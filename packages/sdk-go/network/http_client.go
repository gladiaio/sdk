package network

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// HttpRetryConfig is the resolved HTTP retry policy for a client instance.
type HttpRetryConfig struct {
	MaxAttempts int
	StatusCodes []StatusCodeMatcher
	Delay       func(attempt int) time.Duration
}

// StatusCodeMatcher matches one code or an inclusive range.
type StatusCodeMatcher struct {
	Single int
	Start  int
	End    int
}

// HttpClient performs JSON and raw HTTP against the Gladia API.
type HttpClient struct {
	baseURL            string
	defaultHeaders     map[string]string
	defaultQueryParams map[string]string
	retry              HttpRetryConfig
	timeout            time.Duration
	http               *http.Client
	trustedOrigin      string
}

// HttpClientConfig configures a new HttpClient.
type HttpClientConfig struct {
	BaseURL     string
	Headers     map[string]string
	QueryParams map[string]string
	Retry       HttpRetryConfig
	Timeout     time.Duration
}

// NewHTTPClient creates an HttpClient with manual redirect handling and credential stripping.
func NewHTTPClient(cfg HttpClientConfig) (*HttpClient, error) {
	u, err := urlParse(cfg.BaseURL)
	if err != nil {
		return nil, err
	}
	maxAttempts := cfg.Retry.MaxAttempts
	if maxAttempts < 0 {
		maxAttempts = 0
	}
	return &HttpClient{
		baseURL:            cfg.BaseURL,
		defaultHeaders:     cloneMap(cfg.Headers),
		defaultQueryParams: cloneMap(cfg.QueryParams),
		retry: HttpRetryConfig{
			MaxAttempts: maxAttempts,
			StatusCodes: cfg.Retry.StatusCodes,
			Delay:       cfg.Retry.Delay,
		},
		timeout:       cfg.Timeout,
		trustedOrigin: u.Scheme + "://" + u.Host,
		http: &http.Client{
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
	}, nil
}

type RequestOption func(*requestConfig)

type requestConfig struct {
	headers     map[string]string
	timeout     time.Duration
	rawResponse bool
	body        io.Reader
	rawBody     []byte
	contentType string
}

func WithJSONBody(v any) RequestOption {
	return func(rc *requestConfig) {
		b, _ := json.Marshal(v)
		rc.body = bytes.NewReader(b)
		rc.rawBody = b
		rc.contentType = "application/json"
	}
}

// WithRawBody sets a request body and optional Content-Type (e.g. multipart).
func WithRawBody(body []byte, contentType string) RequestOption {
	return func(rc *requestConfig) {
		rc.rawBody = body
		rc.body = bytes.NewReader(body)
		rc.contentType = contentType
	}
}

func WithTimeout(d time.Duration) RequestOption {
	return func(rc *requestConfig) {
		rc.timeout = d
	}
}

func (c *HttpClient) Get(ctx context.Context, path string, opts ...RequestOption) (*http.Response, error) {
	return c.do(ctx, http.MethodGet, path, opts...)
}

func (c *HttpClient) Post(ctx context.Context, path string, opts ...RequestOption) (*http.Response, error) {
	return c.do(ctx, http.MethodPost, path, opts...)
}

func (c *HttpClient) Delete(ctx context.Context, path string, opts ...RequestOption) (*http.Response, error) {
	return c.do(ctx, http.MethodDelete, path, opts...)
}

func (c *HttpClient) JSON(ctx context.Context, method, path string, dest any, opts ...RequestOption) error {
	opts = append(opts, func(rc *requestConfig) {})
	res, err := c.do(ctx, method, path, opts...)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if strings.Contains(res.Header.Get("Content-Type"), "application/json") {
		return json.NewDecoder(res.Body).Decode(dest)
	}
	return fmt.Errorf("unexpected content type: %s", res.Header.Get("Content-Type"))
}

func (c *HttpClient) do(ctx context.Context, method, path string, opts ...RequestOption) (*http.Response, error) {
	rc := &requestConfig{}
	for _, o := range opts {
		o(rc)
	}
	target, err := BuildURL(c.baseURL, path)
	if err != nil {
		return nil, err
	}
	for k, v := range c.defaultQueryParams {
		if target.Query().Get(k) == "" {
			q := target.Query()
			q.Set(k, v)
			target.RawQuery = q.Encode()
		}
	}
	timeout := c.timeout
	if rc.timeout > 0 {
		timeout = rc.timeout
	}
	attempt := 0
	limit := c.retry.MaxAttempts
	for {
		attempt++
		reqCtx := ctx
		var cancel context.CancelFunc
		if timeout > 0 {
			reqCtx, cancel = context.WithTimeout(ctx, timeout)
		}
		var body io.Reader
		if len(rc.rawBody) > 0 {
			body = bytes.NewReader(rc.rawBody)
		} else {
			body = rc.body
		}
		req, err := http.NewRequestWithContext(reqCtx, method, target.String(), body)
		if err != nil {
			if cancel != nil {
				cancel()
			}
			return nil, err
		}
		for k, v := range c.defaultHeaders {
			req.Header.Set(k, v)
		}
		for k, v := range rc.headers {
			req.Header.Set(k, v)
		}
		if rc.contentType != "" {
			req.Header.Set("Content-Type", rc.contentType)
		}

		res, err := c.followRedirects(req)
		if cancel != nil {
			cancel()
		}
		if err != nil {
			if reqCtx.Err() == context.DeadlineExceeded {
				return nil, &TimeoutError{Timeout: timeout, Message: fmt.Sprintf("request timed out after %s", timeout)}
			}
			shouldRetry := limit == 0 || attempt < limit
			if shouldRetry {
				time.Sleep(c.retry.Delay(attempt))
				continue
			}
			return nil, err
		}
		if res.StatusCode >= 200 && res.StatusCode < 300 {
			return res, nil
		}
		httpErr := newHTTPError(method, target.String(), res)
		shouldRetry := limit == 0 || attempt < limit
		if shouldRetry && matchesStatus(res.StatusCode, c.retry.StatusCodes) {
			_ = res.Body.Close()
			time.Sleep(c.retry.Delay(attempt))
			continue
		}
		_ = res.Body.Close()
		return nil, httpErr
	}
}

const maxRedirects = 20

var crossOriginSensitive = map[string]struct{}{
	"x-gladia-key":  {},
	"authorization": {},
	"cookie":        {},
}

func (c *HttpClient) followRedirects(req *http.Request) (*http.Response, error) {
	current := req
	for redirects := 0; redirects <= maxRedirects; redirects++ {
		if current.URL.Scheme+"://"+current.URL.Host != c.trustedOrigin {
			current.Header = stripSensitive(current.Header)
		}
		res, err := c.http.Do(current)
		if err != nil {
			return nil, err
		}
		loc := res.Header.Get("Location")
		if !isRedirect(res.StatusCode) || loc == "" {
			return res, nil
		}
		next, err := current.URL.Parse(loc)
		if err != nil {
			return nil, err
		}
		if current.URL.Scheme+"://"+current.URL.Host != next.Scheme+"://"+next.Host {
			current.Header = stripSensitive(current.Header)
		}
		_, _ = io.Copy(io.Discard, res.Body)
		_ = res.Body.Close()
		method := current.Method
		var body io.Reader
		if res.StatusCode == http.StatusSeeOther || ((res.StatusCode == http.StatusMovedPermanently || res.StatusCode == http.StatusFound) && method == http.MethodPost) {
			method = http.MethodGet
		} else {
			body = current.Body
		}
		current, err = http.NewRequestWithContext(current.Context(), method, next.String(), body)
		if err != nil {
			return nil, err
		}
		current.Header = req.Header.Clone()
	}
	return nil, fmt.Errorf("too many redirects for %s %s", req.Method, req.URL)
}

func matchesStatus(status int, list []StatusCodeMatcher) bool {
	for _, item := range list {
		if item.Start != 0 || item.End != 0 {
			if status >= item.Start && status <= item.End {
				return true
			}
			continue
		}
		if status == item.Single {
			return true
		}
	}
	return false
}

func newHTTPError(method, rawURL string, res *http.Response) *HttpError {
	bodyBytes, _ := io.ReadAll(res.Body)
	var parsed map[string]any
	_ = json.Unmarshal(bodyBytes, &parsed)
	msg := res.Status
	if parsed != nil {
		if m, ok := parsed["message"].(string); ok {
			msg = m
		}
	}
	err := &HttpError{
		Method:         method,
		Status:         res.StatusCode,
		URL:            rawURL,
		Message:        fmt.Sprint(msg),
		ResponseHeader: res.Header.Clone(),
	}
	if id := res.Header.Get("x-aipi-call-id"); id != "" {
		err.ID = id
	}
	if parsed != nil {
		err.ResponseBody = parsed
		if rid, ok := parsed["request_id"].(string); ok {
			err.RequestID = rid
		}
	} else if len(bodyBytes) > 0 {
		err.ResponseBody = string(bodyBytes)
	}
	return err
}

func isRedirect(code int) bool {
	switch code {
	case http.StatusMovedPermanently, http.StatusFound, http.StatusSeeOther, http.StatusTemporaryRedirect, http.StatusPermanentRedirect:
		return true
	default:
		return false
	}
}

func stripSensitive(h http.Header) http.Header {
	out := h.Clone()
	for name := range out {
		if _, ok := crossOriginSensitive[strings.ToLower(name)]; ok {
			out.Del(name)
		}
	}
	return out
}

func cloneMap(in map[string]string) map[string]string {
	if in == nil {
		return nil
	}
	out := make(map[string]string, len(in))
	for k, v := range in {
		out[k] = v
	}
	return out
}

func urlParse(raw string) (*url.URL, error) {
	return url.Parse(raw)
}
