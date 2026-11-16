package live

import (
	"context"
	"errors"
	"io"
	"net/http"

	"github.com/gladiaio/sdk/packages/sdk-go/clientoptions"
	"github.com/gladiaio/sdk/packages/sdk-go/network"
	"github.com/gladiaio/sdk/packages/sdk-go/v2"
)

// Client is the live V2 client (JS: LiveV2Client, Python: LiveV2Client).
type Client struct {
	http   *network.HTTPClient
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
	httpClient, err := network.NewHTTPClient(network.HTTPClientConfig{
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

// StartSessionOption customizes StartSession.
type StartSessionOption func(*startSessionOptions)

type startSessionOptions struct {
	enterprise *EnterpriseInitOptions
}

// WithEnterpriseOptions adds Gladia Enterprise-only init fields. They are not
// sent to the Gladia cloud API (a warning is logged once instead).
func WithEnterpriseOptions(opts EnterpriseInitOptions) StartSessionOption {
	return func(o *startSessionOptions) { o.enterprise = &opts }
}

// StartSession creates a live session (POST /v2/live) and starts streaming in the background.
//
// Creation errors are returned synchronously and no handler is called. On
// success, OnStarted is called, then the WebSocket connects (OnConnecting /
// OnConnected). Use Session.WaitUntilConnected to block until audio flows;
// audio sent earlier is buffered and replayed on connect.
func (c *Client) StartSession(ctx context.Context, init LiveV2InitRequest, handlers SessionHandlers, opts ...StartSessionOption) (*Session, error) {
	var o startSessionOptions
	for _, opt := range opts {
		opt(&o)
	}
	var enterprise any
	if o.enterprise != nil {
		enterprise = o.enterprise
	}
	body, err := initBody(init, enterprise, c.apiURL)
	if err != nil {
		return nil, err
	}
	var resp LiveV2InitResponse
	if err := c.http.JSON(ctx, http.MethodPost, buildLiveInitPath(c.opts.Region), &resp, network.WithJSONBody(body)); err != nil {
		return nil, err
	}
	s := newSession(sessionConfig{init: body, existing: &resp, ws: c.ws, handlers: handlers})
	s.start()
	return s, nil
}

// ConnectSession attaches to an existing session (e.g. created server-side) and
// starts streaming in the background, skipping POST /v2/live.
func (c *Client) ConnectSession(opts ConnectSessionOptions, handlers SessionHandlers) (*Session, error) {
	if opts.ID == "" || opts.URL == "" {
		return nil, errors.New("connect session requires ID and URL")
	}
	existing := &LiveV2InitResponse{
		ID:        opts.ID,
		URL:       opts.URL,
		CreatedAt: opts.CreatedAt,
	}
	init := map[string]any{}
	if opts.MessagesConfig != nil {
		mc, err := toMap(opts.MessagesConfig)
		if err != nil {
			return nil, err
		}
		init["messages_config"] = mc
	}
	s := newSession(sessionConfig{init: init, existing: existing, ws: c.ws, handlers: handlers})
	s.start()
	return s, nil
}

// Get fetches a live job by ID.
func (c *Client) Get(ctx context.Context, jobID string) (*LiveV2Response, error) {
	var out LiveV2Response
	err := c.http.JSON(ctx, http.MethodGet, c.core.BuildJobEndpoint(jobID), &out,
		network.WithTimeout(c.opts.LiveTimeouts.Get))
	return &out, err
}

// List lists live jobs. Pass a zero LiveV2ListParams for no filters.
func (c *Client) List(ctx context.Context, params LiveV2ListParams) (*LiveV2ListResponse, error) {
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
