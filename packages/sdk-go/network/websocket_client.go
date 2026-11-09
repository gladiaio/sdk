package network

import (
	"fmt"
	"time"

	"github.com/gladiaio/sdk-go/clientoptions"
)

// WebSocketClient is the live-session WebSocket layer (Python: WebSocketClient).
// Streaming connect/send is not implemented yet; the type exists for structural parity with JS/Python.
type WebSocketClient struct {
	baseURL string
	retry   clientoptions.WebSocketRetryOptions
	timeout time.Duration
}

// WebSocketClientConfig configures WebSocketClient.
type WebSocketClientConfig struct {
	BaseURL string
	Retry   clientoptions.WebSocketRetryOptions
	Timeout time.Duration
}

// NewWebSocketClient constructs a WebSocket client (connection logic WIP).
func NewWebSocketClient(cfg WebSocketClientConfig) (*WebSocketClient, error) {
	if cfg.BaseURL == "" {
		return nil, fmt.Errorf("websocket base URL is required")
	}
	return &WebSocketClient{baseURL: cfg.BaseURL, retry: cfg.Retry, timeout: cfg.Timeout}, nil
}

// ErrWebSocketNotImplemented is returned until live WebSocket support lands.
var ErrWebSocketNotImplemented = fmt.Errorf("live WebSocket streaming is not implemented yet in the Go SDK")
