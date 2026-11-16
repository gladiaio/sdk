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

// isGladiaCloud reports whether apiURL targets the public Gladia cloud API.
func isGladiaCloud(apiURL string) bool {
	u, err := url.Parse(apiURL)
	if err != nil {
		return false
	}
	_, ok := cloudHosts[u.Hostname()]
	return ok
}

// initBodyFor strips Enterprise-only fields on Gladia cloud (mirrors JS initBodyFor).
func initBodyFor(body map[string]any, apiURL string) map[string]any {
	if !isGladiaCloud(apiURL) {
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
			log.Printf("gladia: %q is a Gladia Enterprise option, not sent to Gladia cloud API (%s)", field, apiURL)
		}
	}
	return out
}

// initBody merges the typed init request with optional extra fields, forces
// acknowledgments on (needed by the resend buffer) and applies enterprise filtering.
func initBody(init LiveV2InitRequest, extra any, apiURL string) (map[string]any, error) {
	body, err := toMap(init)
	if err != nil {
		return nil, err
	}
	if extra != nil {
		m, err := toMap(extra)
		if err != nil {
			return nil, err
		}
		for k, v := range m {
			body[k] = v
		}
	}
	return buildInitBody(body, apiURL), nil
}

func toMap(v any) (map[string]any, error) {
	b, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}
	m := map[string]any{}
	if err := json.Unmarshal(b, &m); err != nil {
		return nil, err
	}
	return m, nil
}
