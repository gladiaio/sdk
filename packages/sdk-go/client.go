package gladia

import (
	"strings"

	"github.com/gladiaio/sdk/packages/sdk-go/clientoptions"
	"github.com/gladiaio/sdk/packages/sdk-go/v2/live"
	"github.com/gladiaio/sdk/packages/sdk-go/v2/prerecorded"
	"github.com/gladiaio/sdk/packages/sdk-go/version"
)

var gladiaVersion = "SdkGo/" + version.SDKVersion

// ClientOptions is an alias for the shared options type (Python: client_options, JS: types.ts).
type ClientOptions = clientoptions.GladiaClientOptions

// Client is the SDK entrypoint.
type Client struct {
	options clientoptions.GladiaClientOptions
}

// NewClient builds a client with defaults merged with opts.
func NewClient(opts *ClientOptions) (*Client, error) {
	base := clientoptions.Default()
	if opts != nil {
		base = clientoptions.Merge(base, *opts)
	}
	base.HTTPHeaders = clientoptions.NormalizeGladiaHeaders(base.HTTPHeaders)
	if err := clientoptions.Validate(base); err != nil {
		return nil, err
	}
	return &Client{options: base}, nil
}

func (c *Client) resolvedOptions(override *ClientOptions) (clientoptions.GladiaClientOptions, error) {
	merged := c.options
	if override != nil {
		merged = clientoptions.Merge(merged, *override)
	}
	merged.HTTPHeaders = clientoptions.NormalizeGladiaHeaders(merged.HTTPHeaders)
	if merged.APIKey != "" {
		merged.HTTPHeaders = mergeHeaders(merged.HTTPHeaders, map[string]string{"x-gladia-key": merged.APIKey})
	}
	if v, ok := merged.HTTPHeaders["x-gladia-version"]; ok && strings.TrimSpace(v) != "" {
		merged.HTTPHeaders["x-gladia-version"] = strings.TrimSpace(v) + " " + gladiaVersion
	} else {
		merged.HTTPHeaders["x-gladia-version"] = gladiaVersion
	}
	if err := clientoptions.Validate(merged); err != nil {
		return clientoptions.GladiaClientOptions{}, err
	}
	return merged, nil
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

// PreRecordedV2 returns the pre-recorded V2 client.
func (c *Client) PreRecordedV2(override *ClientOptions) (*prerecorded.Client, error) {
	opts, err := c.resolvedOptions(override)
	if err != nil {
		return nil, err
	}
	return prerecorded.NewClient(opts)
}

// LiveV2 returns the live V2 client.
func (c *Client) LiveV2(override *ClientOptions) (*live.Client, error) {
	opts, err := c.resolvedOptions(override)
	if err != nil {
		return nil, err
	}
	return live.NewClient(opts)
}

// Ptr returns a pointer to v. Handy for optional fields of request types:
//
//	live.LiveV2InitRequest{SampleRate: gladia.Ptr(live.LiveV2SampleRate16000)}
func Ptr[T any](v T) *T {
	return &v
}
