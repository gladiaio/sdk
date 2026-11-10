package network

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestHttpClientReadsLargeResponseBody(t *testing.T) {
	payload := strings.Repeat("x", 64*1024)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(payload))
	}))
	t.Cleanup(srv.Close)

	client, err := NewHTTPClient(HttpClientConfig{BaseURL: srv.URL, Timeout: time.Second})
	if err != nil {
		t.Fatal(err)
	}

	res, err := client.Get(context.Background(), "/", WithTimeout(30*time.Second))
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	defer res.Body.Close()

	got, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatalf("read body: %v", err)
	}
	if string(got) != payload {
		t.Fatalf("body length: got %d want %d", len(got), len(payload))
	}
}
