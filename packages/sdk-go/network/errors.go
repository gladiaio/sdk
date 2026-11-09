package network

import (
	"fmt"
	"net/http"
	"strings"
	"time"
)

// HttpError is returned for non-2xx HTTP responses.
type HttpError struct {
	Method         string
	Status         int
	URL            string
	Message        string
	ID             string
	RequestID      string
	ResponseBody   any
	ResponseHeader http.Header
}

func (e *HttpError) Error() string {
	parts := []string{e.Message, e.RequestID, e.ID, fmt.Sprint(e.Status), e.Method + " " + e.URL}
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p != "" && p != "0" {
			out = append(out, p)
		}
	}
	if len(out) == 0 {
		return "http error"
	}
	return strings.Join(out, " | ")
}

// TimeoutError is returned when a request exceeds its deadline.
type TimeoutError struct {
	Timeout time.Duration
	Message string
}

func (e *TimeoutError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return "request timed out"
}
