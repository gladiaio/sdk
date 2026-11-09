package v2

import (
	"fmt"
	"net/url"
	"strconv"
)

// ListURLParams mirrors JS build-list-url.ts ListUrlParams.
type ListURLParams struct {
	Offset         *int
	Limit          *int
	Date           string
	BeforeDate     string
	AfterDate      string
	Status         []string
	CustomMetadata map[string]any
	URL            string
}

// BuildListURL builds a collection list path with optional query filters.
func BuildListURL(basePath string, params *ListURLParams) string {
	if params == nil {
		return basePath
	}
	if params.URL != "" {
		u, err := url.Parse(params.URL)
		if err != nil {
			return basePath
		}
		if u.RawQuery == "" {
			return basePath
		}
		return basePath + "?" + u.RawQuery
	}
	q := url.Values{}
	if params.Offset != nil {
		q.Set("offset", itoa(*params.Offset))
	}
	if params.Limit != nil {
		q.Set("limit", itoa(*params.Limit))
	}
	if params.Date != "" {
		q.Set("date", params.Date)
	}
	if params.BeforeDate != "" {
		q.Set("before_date", params.BeforeDate)
	}
	if params.AfterDate != "" {
		q.Set("after_date", params.AfterDate)
	}
	for _, st := range params.Status {
		q.Add("status", st)
	}
	for k, v := range params.CustomMetadata {
		if v == nil {
			continue
		}
		q.Add("custom_metadata["+k+"]", stringify(v))
	}
	enc := q.Encode()
	if enc == "" {
		return basePath
	}
	return basePath + "?" + enc
}

func itoa(n int) string {
	return strconv.Itoa(n)
}

func stringify(v any) string {
	switch t := v.(type) {
	case string:
		return t
	default:
		return fmt.Sprint(v)
	}
}
