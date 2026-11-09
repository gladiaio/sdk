package live

import (
	"sync"
	"testing"
	"time"

	"github.com/gladiaio/sdk-go/clientoptions"
	"github.com/gladiaio/sdk-go/network"
)

func TestConnectSessionSkipsHTTPInit(t *testing.T) {
	wsClient, err := network.NewWebSocketClient(network.WebSocketClientConfig{
		BaseURL: "wss://example.invalid",
		Retry: clientoptions.WebSocketRetryOptions{
			MaxAttemptsPerConnection: 1,
			Delay:                    func(int) time.Duration { return time.Millisecond },
		},
		Timeout: time.Second,
	})
	if err != nil {
		t.Fatal(err)
	}
	httpClient, err := network.NewHTTPClient(network.HttpClientConfig{
		BaseURL: "https://example.invalid",
		Retry:   network.RetryFromOptions(clientoptions.Default().HTTPRetry),
		Timeout: time.Second,
	})
	if err != nil {
		t.Fatal(err)
	}

	var started sync.WaitGroup
	started.Add(1)
	sess, err := newSession(sessionConfig{
		existing: &LiveV2InitResponse{
			Id:        "sess-1",
			Url:       "/v2/live/ws",
			CreatedAt: "2026-01-01T00:00:00Z",
		},
		http: httpClient,
		ws:   wsClient,
	})
	if err != nil {
		t.Fatal(err)
	}
	sess.SetHandlers(SessionHandlers{
		OnStarted: func(*LiveV2InitResponse) { started.Done() },
	})

	done := make(chan struct{})
	go func() {
		started.Wait()
		close(done)
	}()
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for started")
	}
	if sess.SessionID() != "sess-1" {
		t.Fatalf("session id %q", sess.SessionID())
	}
}
