package network

import (
	"net/url"
	"regexp"
	"strings"
)

var absoluteURL = regexp.MustCompile(`^(?i)(https?|wss?)://`)

// BuildURL joins baseURL and path, preserving the base path prefix (mirrors JS buildUrl).
func BuildURL(baseURL, path string) (*url.URL, error) {
	if absoluteURL.MatchString(path) {
		return url.Parse(path)
	}
	base, err := url.Parse(baseURL)
	if err != nil {
		return nil, err
	}
	relative, err := url.Parse(path)
	if err != nil {
		return nil, err
	}
	out := *base
	out.Path = strings.TrimRight(base.Path, "/") + "/" + strings.TrimLeft(relative.Path, "/")
	q := []string{}
	if base.RawQuery != "" {
		q = append(q, base.RawQuery)
	}
	if relative.RawQuery != "" {
		q = append(q, relative.RawQuery)
	}
	out.RawQuery = strings.Join(q, "&")
	if relative.Fragment != "" {
		out.Fragment = relative.Fragment
	} else {
		out.Fragment = base.Fragment
	}
	return &out, nil
}
