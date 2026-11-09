package live

import (
	"encoding/json"
	"log"
	"net/url"
	"sync"
)

var (
	cloudHosts   = map[string]struct{}{"api.gladia.io": {}}
	warnedFields sync.Map
)

// IsGladiaCloud reports whether apiURL targets the public Gladia cloud API.
func IsGladiaCloud(apiURL string) bool {
	u, err := url.Parse(apiURL)
	if err != nil {
		return false
	}
	_, ok := cloudHosts[u.Hostname()]
	return ok
}

// InitBodyFor strips Enterprise-only fields on Gladia cloud (mirrors JS initBodyFor).
func InitBodyFor(body map[string]any, apiURL string) map[string]any {
	if !IsGladiaCloud(apiURL) {
		return body
	}
	out := make(map[string]any, len(body))
	for k, v := range body {
		out[k] = v
	}
	for _, field := range []string{"finals"} {
		if _, ok := out[field]; !ok {
			continue
		}
		delete(out, field)
		if _, loaded := warnedFields.LoadOrStore(field, struct{}{}); !loaded {
			log.Printf("gladiaio/sdk-go: %q is a Gladia Enterprise option, not sent to Gladia cloud API (%s)", field, apiURL)
		}
	}
	return out
}

// InitBodyFromJSON decodes init options and applies enterprise filtering.
func InitBodyFromJSON(opts any, apiURL string) (map[string]any, error) {
	b, err := json.Marshal(opts)
	if err != nil {
		return nil, err
	}
	var m map[string]any
	if err := json.Unmarshal(b, &m); err != nil {
		return nil, err
	}
	return InitBodyFor(m, apiURL), nil
}
