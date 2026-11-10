package live

import (
	"context"
	"encoding/json"
	"io"
	"net/http"

	"github.com/gladiaio/sdk-go/clientoptions"
	"github.com/gladiaio/sdk-go/network"
	"github.com/gladiaio/sdk-go/v2"
)

// Client is the live V2 client (JS: LiveV2Client, Python: LiveV2Client).
type Client struct {
	http   *network.HttpClient
	ws     *network.WebSocketClient
	opts   clientoptions.GladiaClientOptions
	core   v2.JobCore
	apiURL string
}

// NewClient constructs a live client from resolved options.
func NewClient(opts clientoptions.GladiaClientOptions) (*Client, error) {
	httpBase, err := clientoptions.HTTPBaseURL(opts.APIURL)
	if err != nil {
		return nil, err
	}
	wsBase, err := clientoptions.WSBaseURL(opts.APIURL)
	if err != nil {
		return nil, err
	}
	httpClient, err := network.NewHTTPClient(network.HttpClientConfig{
		BaseURL: httpBase,
		Headers: opts.HTTPHeaders,
		Retry:   network.RetryFromOptions(opts.HTTPRetry),
		Timeout: opts.HTTPTimeout,
	})
	if err != nil {
		return nil, err
	}
	// WebSocket URLs from POST /v2/live embed session auth; do not attach x-gladia-key (JS/Python parity).
	wsClient, err := network.NewWebSocketClient(network.WebSocketClientConfig{
		BaseURL: wsBase,
		Retry:   opts.WSRetry,
		Timeout: opts.WSTimeout,
	})
	if err != nil {
		return nil, err
	}
	return &Client{
		http:   httpClient,
		ws:     wsClient,
		opts:   opts,
		core:   v2.JobCore{BasePath: "/v2/live", Kind: "Live"},
		apiURL: opts.APIURL,
	}, nil
}

// StartSession creates a live session (WebSocket wiring in Session).
func (c *Client) StartSession(ctx context.Context, init any) (*Session, error) {
	body, err := InitBodyFromJSON(init, c.apiURL)
	if err != nil {
		return nil, err
	}
	return newSession(sessionConfig{
		ctx:    ctx,
		init:   body,
		region: c.opts.Region,
		apiURL: c.apiURL,
		http:   c.http,
		ws:     c.ws,
		opts:   c.opts,
	})
}

// ConnectSession attaches to an existing session WebSocket URL.
func (c *Client) ConnectSession(opts ConnectSessionOptions) (*Session, error) {
	existing := &LiveV2InitResponse{
		Id:        opts.ID,
		Url:       opts.URL,
		CreatedAt: opts.CreatedAt,
	}
	init := map[string]any{}
	if opts.MessagesConfig != nil {
		b, err := json.Marshal(opts.MessagesConfig)
		if err != nil {
			return nil, err
		}
		var mc map[string]any
		if err := json.Unmarshal(b, &mc); err != nil {
			return nil, err
		}
		init["messages_config"] = mc
	}
	return newSession(sessionConfig{
		init:     init,
		existing: existing,
		apiURL:   c.apiURL,
		http:     c.http,
		ws:       c.ws,
		opts:     c.opts,
	})
}

// Get fetches a live job by ID.
func (c *Client) Get(ctx context.Context, jobID string) (*LiveV2Response, error) {
	var out LiveV2Response
	err := c.http.JSON(ctx, http.MethodGet, c.core.BuildJobEndpoint(jobID), &out,
		network.WithTimeout(c.opts.LiveTimeouts.Get))
	return &out, err
}

// List lists live jobs.
func (c *Client) List(ctx context.Context, params any) (*LiveV2ListResponse, error) {
	path, err := c.core.BuildListEndpoint(params)
	if err != nil {
		return nil, err
	}
	var out LiveV2ListResponse
	err = c.http.JSON(ctx, http.MethodGet, path, &out, network.WithTimeout(c.opts.LiveTimeouts.List))
	return &out, err
}

// Delete deletes a live job.
func (c *Client) Delete(ctx context.Context, jobID string) (bool, error) {
	res, err := c.http.Delete(ctx, c.core.BuildJobEndpoint(jobID), network.WithTimeout(c.opts.LiveTimeouts.Delete))
	if err != nil {
		return false, err
	}
	defer res.Body.Close()
	return res.StatusCode == http.StatusAccepted, nil
}

// GetFile downloads live job audio.
func (c *Client) GetFile(ctx context.Context, jobID string) ([]byte, error) {
	res, err := c.http.Get(ctx, c.core.BuildJobFileEndpoint(jobID), network.WithTimeout(c.opts.LiveTimeouts.GetFile))
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	return io.ReadAll(res.Body)
}
