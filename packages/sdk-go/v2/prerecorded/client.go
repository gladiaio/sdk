package prerecorded

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"time"

	"github.com/gladiaio/sdk-go/clientoptions"
	"github.com/gladiaio/sdk-go/network"
)

// Client is the pre-recorded V2 REST client (JS: PreRecordedV2Client, Python: PreRecordedV2Client).
type Client struct {
	http *network.HttpClient
	opts clientoptions.GladiaClientOptions
	core Core
}

// NewClient constructs a pre-recorded client from resolved GladiaClientOptions.
func NewClient(opts clientoptions.GladiaClientOptions) (*Client, error) {
	base, err := clientoptions.HTTPBaseURL(opts.APIURL)
	if err != nil {
		return nil, err
	}
	httpClient, err := network.NewHTTPClient(network.HttpClientConfig{
		BaseURL:     base,
		Headers:     opts.HTTPHeaders,
		QueryParams: map[string]string{},
		Retry:       network.RetryFromOptions(opts.HTTPRetry),
		Timeout:     opts.HTTPTimeout,
	})
	if err != nil {
		return nil, err
	}
	return &Client{http: httpClient, opts: opts, core: NewCore()}, nil
}

// Create starts a new pre-recorded job.
func (c *Client) Create(ctx context.Context, body any) (*PreRecordedV2InitTranscriptionResponse, error) {
	var out PreRecordedV2InitTranscriptionResponse
	err := c.http.JSON(ctx, http.MethodPost, "/v2/pre-recorded", &out,
		network.WithJSONBody(body),
		network.WithTimeout(c.opts.PreRecordedTimeouts.Create))
	return &out, err
}

// UploadFile uploads a local file to /v2/upload.
func (c *Client) UploadFile(ctx context.Context, path string) (*PreRecordedV2AudioUploadResponse, error) {
	if IsURL(path) {
		return nil, fmt.Errorf("upload file only accepts a local path; use Create with audio_url for URLs")
	}
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	buf := &bytes.Buffer{}
	w := multipart.NewWriter(buf)
	part, err := w.CreateFormFile("audio", FilenameForPath(path))
	if err != nil {
		return nil, err
	}
	if _, err := io.Copy(part, f); err != nil {
		return nil, err
	}
	if err := w.Close(); err != nil {
		return nil, err
	}
	res, err := c.http.Post(ctx, "/v2/upload",
		network.WithRawBody(buf.Bytes(), w.FormDataContentType()),
		network.WithTimeout(c.opts.PreRecordedTimeouts.UploadFile))
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	var out PreRecordedV2AudioUploadResponse
	return &out, json.NewDecoder(res.Body).Decode(&out)
}

// Get fetches a job by ID.
func (c *Client) Get(ctx context.Context, jobID string) (*PreRecordedV2Response, error) {
	var out PreRecordedV2Response
	path := c.core.BuildJobEndpoint(jobID)
	err := c.http.JSON(ctx, http.MethodGet, path, &out, network.WithTimeout(c.opts.PreRecordedTimeouts.Get))
	return &out, err
}

// List returns jobs matching filters.
func (c *Client) List(ctx context.Context, params any) (*PreRecordedV2ListResponse, error) {
	path, err := c.core.BuildListEndpoint(params)
	if err != nil {
		return nil, err
	}
	var out PreRecordedV2ListResponse
	err = c.http.JSON(ctx, http.MethodGet, path, &out, network.WithTimeout(c.opts.PreRecordedTimeouts.List))
	return &out, err
}

// Delete removes a job.
func (c *Client) Delete(ctx context.Context, jobID string) (bool, error) {
	res, err := c.http.Delete(ctx, c.core.BuildJobEndpoint(jobID), network.WithTimeout(c.opts.PreRecordedTimeouts.Delete))
	if err != nil {
		return false, err
	}
	defer res.Body.Close()
	return res.StatusCode == http.StatusAccepted, nil
}

// GetFile downloads job audio bytes.
func (c *Client) GetFile(ctx context.Context, jobID string) ([]byte, error) {
	res, err := c.http.Get(ctx, c.core.BuildJobFileEndpoint(jobID), network.WithTimeout(c.opts.PreRecordedTimeouts.GetFile))
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	return io.ReadAll(res.Body)
}

// Poll waits until the job completes or ctx is done.
func (c *Client) Poll(ctx context.Context, jobID string, interval time.Duration) (*PreRecordedV2Response, error) {
	if interval <= 0 {
		interval = 3 * time.Second
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	path := c.core.BuildJobEndpoint(jobID)
	type pollSnapshot struct {
		Status    string `json:"status"`
		ErrorCode *int   `json:"error_code"`
	}
	for {
		var snap pollSnapshot
		err := c.http.JSON(ctx, http.MethodGet, path, &snap, network.WithTimeout(c.opts.PreRecordedTimeouts.Get))
		if err != nil {
			if ctx.Err() != nil {
				return nil, &network.TimeoutError{Message: c.core.JobTimeoutMessage(jobID, ctx.Err().Error())}
			}
			if pollShouldRetryStatus(err) || pollShouldRetryTransport(err) {
				select {
				case <-ctx.Done():
					return nil, &network.TimeoutError{Message: c.core.JobTimeoutMessage(jobID, ctx.Err().Error())}
				case <-ticker.C:
					continue
				}
			}
			return nil, err
		}
		if c.core.IsJobSuccessful(snap.Status) {
			return c.Get(ctx, jobID)
		}
		if c.core.IsJobFailed(snap.Status) {
			return nil, errors.New(c.core.JobErrorMessage(jobID, snap.ErrorCode))
		}
		select {
		case <-ctx.Done():
			return nil, &network.TimeoutError{Message: c.core.JobTimeoutMessage(jobID, ctx.Err().Error())}
		case <-ticker.C:
		}
	}
}

// CreateAndPoll creates a job then polls until completion.
func (c *Client) CreateAndPoll(ctx context.Context, body any, interval time.Duration) (*PreRecordedV2Response, error) {
	init, err := c.Create(ctx, body)
	if err != nil {
		return nil, err
	}
	return c.Poll(ctx, init.Id, interval)
}

// Transcribe uploads a local file when needed, then create-and-poll.
func (c *Client) Transcribe(ctx context.Context, audio any, options any, interval time.Duration) (*PreRecordedV2Response, error) {
	var audioURL string
	switch v := audio.(type) {
	case string:
		if IsURL(v) {
			audioURL = v
		} else {
			upload, err := c.UploadFile(ctx, v)
			if err != nil {
				return nil, err
			}
			audioURL = upload.AudioUrl
		}
	default:
		return nil, fmt.Errorf("unsupported audio type %T", audio)
	}
	body := map[string]any{"audio_url": audioURL}
	if options != nil {
		ob, err := json.Marshal(options)
		if err != nil {
			return nil, err
		}
		var extra map[string]any
		if err := json.Unmarshal(ob, &extra); err != nil {
			return nil, err
		}
		for k, val := range extra {
			body[k] = val
		}
	}
	return c.CreateAndPoll(ctx, body, interval)
}

func pollShouldRetryTransport(err error) bool {
	if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
		return true
	}
	var te *network.TimeoutError
	return errors.As(err, &te)
}

func pollShouldRetryStatus(err error) bool {
	var he *network.HttpError
	if !errors.As(err, &he) {
		return false
	}
	return he.Status == http.StatusRequestTimeout || he.Status == http.StatusTooManyRequests || he.Status >= 500
}
