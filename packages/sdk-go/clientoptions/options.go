package clientoptions

import (
	"net/url"
	"os"
	"strings"
	"time"
)

// Region is used for live session creation (POST /v2/live) only.
type Region string

const (
	RegionEUWest Region = "eu-west"
	RegionUSWest Region = "us-west"
)

// QueryParams are default HTTP query parameters on every request from an HTTP client.
type QueryParams map[string]string

// HttpRetryOptions controls HTTP retry behavior.
type HttpRetryOptions struct {
	MaxAttempts int
	StatusCodes []StatusCodeMatcher
	Delay       func(attempt int) time.Duration
}

// StatusCodeMatcher is either a single status code or an inclusive range.
type StatusCodeMatcher struct {
	Single int
	Start  int
	End    int
}

// WebSocketRetryOptions controls WebSocket reconnection (live sessions).
type WebSocketRetryOptions struct {
	MaxAttemptsPerConnection int
	Delay                    func(attempt int) time.Duration
	MaxConnections           int
	CloseCodes               []StatusCodeMatcher
}

// PreRecordedV2Timeouts are per-operation HTTP limits and default poll/transcribe deadlines.
type PreRecordedV2Timeouts struct {
	Transcribe    time.Duration
	Poll          time.Duration
	CreateAndPoll time.Duration
	UploadFile    time.Duration
	GetFile       time.Duration
	Create        time.Duration
	Delete        time.Duration
	Get           time.Duration
	List          time.Duration
}

// LiveV2Timeouts are HTTP timeouts for live V2 job management.
type LiveV2Timeouts struct {
	Get     time.Duration
	Delete  time.Duration
	GetFile time.Duration
	List    time.Duration
}

// GladiaClientOptions configures the root client.
type GladiaClientOptions struct {
	APIKey              string
	APIURL              string
	Region              Region
	HTTPHeaders         map[string]string
	HTTPRetry           HttpRetryOptions
	HTTPTimeout         time.Duration
	PreRecordedTimeouts PreRecordedV2Timeouts
	LiveTimeouts        LiveV2Timeouts
	WSRetry             WebSocketRetryOptions
	WSTimeout           time.Duration
}

func defaultHTTPDelay(attempt int) time.Duration {
	ms := min(300*float64(uint(1)<<max(0, attempt-1)), 10_000)
	return time.Duration(ms) * time.Millisecond
}

func defaultWSDelay(attempt int) time.Duration {
	ms := min(300*float64(uint(1)<<max(0, attempt-1)), 2_000)
	return time.Duration(ms) * time.Millisecond
}

func defaultHTTPRetry() HttpRetryOptions {
	return HttpRetryOptions{
		MaxAttempts: 2,
		StatusCodes: []StatusCodeMatcher{
			{Single: 408},
			{Single: 413},
			{Single: 429},
			{Start: 500, End: 599},
		},
		Delay: defaultHTTPDelay,
	}
}

func defaultWSRetry() WebSocketRetryOptions {
	return WebSocketRetryOptions{
		MaxAttemptsPerConnection: 5,
		Delay:                    defaultWSDelay,
		MaxConnections:           0,
		CloseCodes: []StatusCodeMatcher{
			{Start: 1002, End: 4399},
			{Start: 4500, End: 9999},
		},
	}
}

func defaultPreRecordedTimeouts() PreRecordedV2Timeouts {
	return PreRecordedV2Timeouts{
		Transcribe:    7200 * time.Second,
		Poll:          7200 * time.Second,
		CreateAndPoll: 7200 * time.Second,
		UploadFile:    300 * time.Second,
		GetFile:       300 * time.Second,
		Create:        60 * time.Second,
		Delete:        60 * time.Second,
		Get:           10 * time.Second,
		List:          10 * time.Second,
	}
}

func defaultLiveTimeouts() LiveV2Timeouts {
	return LiveV2Timeouts{
		Get:     10 * time.Second,
		Delete:  60 * time.Second,
		GetFile: 300 * time.Second,
		List:    10 * time.Second,
	}
}

// Default returns SDK defaults, reading GLADIA_* environment variables when set.
func Default() GladiaClientOptions {
	apiKey := os.Getenv("GLADIA_API_KEY")
	apiURL := os.Getenv("GLADIA_API_URL")
	if apiURL == "" {
		apiURL = "https://api.gladia.io"
	}
	var region Region
	if v := os.Getenv("GLADIA_REGION"); v != "" {
		region = Region(v)
	}
	return GladiaClientOptions{
		APIKey:              apiKey,
		APIURL:              apiURL,
		Region:              region,
		HTTPHeaders:         map[string]string{},
		HTTPRetry:           defaultHTTPRetry(),
		HTTPTimeout:         10 * time.Second,
		PreRecordedTimeouts: defaultPreRecordedTimeouts(),
		LiveTimeouts:        defaultLiveTimeouts(),
		WSRetry:             defaultWSRetry(),
		WSTimeout:           10 * time.Second,
	}
}

// Merge shallow-merges non-empty override fields into base.
func Merge(base, override GladiaClientOptions) GladiaClientOptions {
	out := base
	if override.APIKey != "" {
		out.APIKey = override.APIKey
	}
	if override.APIURL != "" {
		out.APIURL = override.APIURL
	}
	if override.Region != "" {
		out.Region = override.Region
	}
	if len(override.HTTPHeaders) > 0 {
		out.HTTPHeaders = mergeHeaders(out.HTTPHeaders, override.HTTPHeaders)
	}
	if override.HTTPTimeout > 0 {
		out.HTTPTimeout = override.HTTPTimeout
	}
	if override.WSTimeout > 0 {
		out.WSTimeout = override.WSTimeout
	}
	if override.HTTPRetry.MaxAttempts != 0 || len(override.HTTPRetry.StatusCodes) > 0 {
		out.HTTPRetry = override.HTTPRetry
	}
	if override.WSRetry.MaxAttemptsPerConnection != 0 {
		out.WSRetry = override.WSRetry
	}
	return out
}

// NormalizeGladiaHeaders lowercases x-gladia-* header names.
func NormalizeGladiaHeaders(headers map[string]string) map[string]string {
	if headers == nil {
		return map[string]string{}
	}
	out := make(map[string]string, len(headers))
	for key, value := range headers {
		lc := strings.ToLower(key)
		if strings.HasPrefix(lc, "x-gladia-") {
			out[lc] = value
		} else {
			out[key] = value
		}
	}
	return out
}

func mergeHeaders(base, extra map[string]string) map[string]string {
	out := make(map[string]string, len(base)+len(extra))
	for k, v := range base {
		out[k] = v
	}
	for k, v := range extra {
		out[k] = v
	}
	return out
}

// Validate checks required fields and supported APIURL schemes.
func Validate(opts GladiaClientOptions) error {
	u, err := url.Parse(opts.APIURL)
	if err != nil {
		return &InvalidOptionsError{Message: `invalid url: "` + opts.APIURL + `"`}
	}
	if opts.APIKey == "" && strings.HasSuffix(u.Hostname(), ".gladia.io") {
		return &InvalidOptionsError{Message: `you have to set your "APIKey" or define a proxy "APIURL"`}
	}
	switch u.Scheme {
	case "https", "http", "wss", "ws":
		return nil
	default:
		return &InvalidOptionsError{
			Message: "only HTTP and WebSocket protocols are supported for APIURL (received: " + u.Scheme + ")",
		}
	}
}

// InvalidOptionsError is returned when GladiaClientOptions are invalid.
type InvalidOptionsError struct {
	Message string
}

func (e *InvalidOptionsError) Error() string {
	return e.Message
}

// HTTPBaseURL rewrites ws→http on the configured API URL.
func HTTPBaseURL(apiURL string) (string, error) {
	u, err := url.Parse(apiURL)
	if err != nil {
		return "", err
	}
	u.Scheme = strings.Replace(u.Scheme, "ws", "http", 1)
	return u.String(), nil
}

// WSBaseURL rewrites http→ws on the configured API URL.
func WSBaseURL(apiURL string) (string, error) {
	u, err := url.Parse(apiURL)
	if err != nil {
		return "", err
	}
	u.Scheme = strings.Replace(u.Scheme, "http", "ws", 1)
	return u.String(), nil
}

func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
