package gladia

import (
	"strings"

	"github.com/gladiaio/sdk-go/clientoptions"
	"github.com/gladiaio/sdk-go/v2/live"
	"github.com/gladiaio/sdk-go/v2/prerecorded"
	"github.com/gladiaio/sdk-go/version"
)

var gladiaVersion = "SdkGo/" + version.SDKVersion

// ClientOptions is an alias for the shared options type (Python: client_options, JS: types.ts).
type ClientOptions = clientoptions.GladiaClientOptions

// GladiaClient is the SDK entrypoint.
type GladiaClient struct {
	options clientoptions.GladiaClientOptions
}

// NewGladiaClient builds a client with defaults merged with opts.
func NewGladiaClient(opts *ClientOptions) (*GladiaClient, error) {
	base := clientoptions.Default()
	if opts != nil {
		base = clientoptions.Merge(base, *opts)
	}
	base.HTTPHeaders = clientoptions.NormalizeGladiaHeaders(base.HTTPHeaders)
	if err := clientoptions.Validate(base); err != nil {
		return nil, err
	}
	return &GladiaClient{options: base}, nil
}

func (c *GladiaClient) resolvedOptions(override *ClientOptions) (clientoptions.GladiaClientOptions, error) {
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
func (c *GladiaClient) PreRecordedV2(override *ClientOptions) (*prerecorded.Client, error) {
	opts, err := c.resolvedOptions(override)
	if err != nil {
		return nil, err
	}
	return prerecorded.NewClient(opts)
}

// LiveV2 returns the live V2 client.
func (c *GladiaClient) LiveV2(override *ClientOptions) (*live.Client, error) {
	opts, err := c.resolvedOptions(override)
	if err != nil {
		return nil, err
	}
	return live.NewClient(opts)
}
