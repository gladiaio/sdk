package network

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/coder/websocket"
	"github.com/gladiaio/sdk-go/clientoptions"
)

// WebSocketClient dials live session streams (JS: WebSocketClient).
type WebSocketClient struct {
	baseURL string
	retry   clientoptions.WebSocketRetryOptions
	timeout time.Duration
	headers http.Header
}

// WebSocketClientConfig configures WebSocketClient.
type WebSocketClientConfig struct {
	BaseURL string
	Headers map[string]string
	Retry   clientoptions.WebSocketRetryOptions
	Timeout time.Duration
}

// NewWebSocketClient constructs a WebSocket client.
func NewWebSocketClient(cfg WebSocketClientConfig) (*WebSocketClient, error) {
	if cfg.BaseURL == "" {
		return nil, fmt.Errorf("websocket base URL is required")
	}
	h := http.Header{}
	for k, v := range cfg.Headers {
		h.Set(k, v)
	}
	return &WebSocketClient{
		baseURL: cfg.BaseURL,
		retry:   wsRetryFrom(cfg.Retry),
		timeout: cfg.Timeout,
		headers: h,
	}, nil
}

// WebSocketSession is one connection with retry semantics (JS: WebSocketSession).
type WebSocketSession struct {
	url     string
	retry   clientoptions.WebSocketRetryOptions
	timeout time.Duration
	headers http.Header

	mu                sync.Mutex
	readyState        ReadyState
	conn              *websocket.Conn
	connectionCount   int
	connectionAttempt int
	stop              chan struct{}
	stopOnce          sync.Once
	startOnce         sync.Once
	sendMu            sync.Mutex

	OnConnecting func(connection, attempt int)
	OnOpen       func(connection, attempt int)
	OnMessage    func(data []byte)
	OnError      func(err error)
	OnClose      func(code int, reason string)
}

// CreateSession resolves url against baseURL. Call Start after registering callbacks (OnOpen, etc.).
func (c *WebSocketClient) CreateSession(pathOrURL string) (*WebSocketSession, error) {
	u, err := BuildURL(c.baseURL, pathOrURL)
	if err != nil {
		return nil, err
	}
	s := &WebSocketSession{
		url:        u.String(),
		retry:      c.retry,
		timeout:    c.timeout,
		headers:    c.headers.Clone(),
		readyState: WSClosed,
		stop:       make(chan struct{}),
	}
	return s, nil
}

// Start begins dialing in the background. Register callbacks before calling Start.
func (s *WebSocketSession) Start() {
	s.startOnce.Do(func() {
		s.mu.Lock()
		s.readyState = WSConnecting
		s.mu.Unlock()
		go s.connectLoop(false)
	})
}

// ReadyState returns the session ready state.
func (s *WebSocketSession) ReadyState() ReadyState {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.readyState
}

// Send writes a text or binary frame when OPEN.
func (s *WebSocketSession) Send(data []byte) error {
	s.mu.Lock()
	state := s.readyState
	conn := s.conn
	s.mu.Unlock()
	if state != WSOpen || conn == nil {
		return errors.New("websocket is not open")
	}
	s.sendMu.Lock()
	defer s.sendMu.Unlock()
	ctx := context.Background()
	return conn.Write(ctx, websocket.MessageBinary, data)
}

// SendText sends a text WebSocket frame.
func (s *WebSocketSession) SendText(text string) error {
	s.mu.Lock()
	state := s.readyState
	conn := s.conn
	s.mu.Unlock()
	if state != WSOpen || conn == nil {
		return errors.New("websocket is not open")
	}
	s.sendMu.Lock()
	defer s.sendMu.Unlock()
	return conn.Write(context.Background(), websocket.MessageText, []byte(text))
}

// Close initiates close with code and reason.
func (s *WebSocketSession) Close(code int, reason string) {
	s.mu.Lock()
	if s.readyState == WSClosing || s.readyState == WSClosed {
		s.mu.Unlock()
		return
	}
	s.readyState = WSClosing
	conn := s.conn
	s.mu.Unlock()

	s.signalStop()
	if conn != nil {
		_ = conn.Close(websocket.StatusCode(code), reason)
		return
	}
	s.finishClose(code, reason)
}

func (s *WebSocketSession) connectLoop(isRetry bool) {
	s.mu.Lock()
	if !isRetry {
		s.connectionCount++
		s.connectionAttempt = 0
	}
	s.connectionAttempt++
	s.readyState = WSConnecting
	attempt := s.connectionAttempt
	connNum := s.connectionCount
	onConnecting := s.OnConnecting
	s.mu.Unlock()

	if onConnecting != nil {
		onConnecting(connNum, attempt)
	}

	ctx := context.Background()
	if s.timeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, s.timeout)
		defer cancel()
	}

	conn, _, err := websocket.Dial(ctx, s.url, &websocket.DialOptions{
		HTTPHeader: s.headers,
	})
	if err != nil {
		if s.shouldRetryAfterError(err) {
			time.Sleep(s.retry.Delay(attempt))
			select {
			case <-s.stop:
				return
			default:
			}
			s.connectLoop(true)
			return
		}
		if s.OnError != nil {
			s.OnError(fmt.Errorf("websocket connection error: %w", err))
		}
		s.Close(1006, "WebSocket connection error")
		return
	}

	s.mu.Lock()
	if s.readyState != WSConnecting {
		_ = conn.Close(websocket.StatusGoingAway, "")
		s.mu.Unlock()
		return
	}
	s.conn = conn
	s.readyState = WSOpen
	onOpen := s.OnOpen
	s.mu.Unlock()

	if onOpen != nil {
		onOpen(connNum, attempt)
	}

	closeCode, closeReason := s.readLoop(conn)

	s.mu.Lock()
	s.conn = nil
	state := s.readyState
	connCount := s.connectionCount
	s.mu.Unlock()

	if state == WSClosing {
		s.finishClose(closeCode, closeReason)
		return
	}
	if wsMaxConnectionsReached(s.retry, connCount) || !matchesCloseCode(closeCode, s.retry.CloseCodes) {
		s.finishClose(closeCode, closeReason)
		return
	}
	select {
	case <-s.stop:
		s.finishClose(closeCode, closeReason)
	default:
		s.connectLoop(false)
	}
}

func (s *WebSocketSession) readLoop(conn *websocket.Conn) (int, string) {
	ctx := context.Background()
	for {
		select {
		case <-s.stop:
			return 1000, ""
		default:
		}
		_, data, err := conn.Read(ctx)
		if err != nil {
			code := int(websocket.CloseStatus(err))
			if code == -1 {
				code = 1006
			}
			return code, err.Error()
		}
		if s.OnMessage != nil {
			s.OnMessage(data)
		}
	}
}

func (s *WebSocketSession) shouldRetryAfterError(err error) bool {
	s.mu.Lock()
	state := s.readyState
	attempt := s.connectionAttempt
	max := s.retry.MaxAttemptsPerConnection
	s.mu.Unlock()
	if state != WSConnecting {
		return false
	}
	if errors.Is(err, context.DeadlineExceeded) {
		return false
	}
	if max > 0 && attempt >= max {
		return false
	}
	return true
}

func (s *WebSocketSession) finishClose(code int, reason string) {
	s.mu.Lock()
	if s.readyState == WSClosed {
		s.mu.Unlock()
		return
	}
	s.readyState = WSClosed
	onClose := s.OnClose
	s.conn = nil
	s.mu.Unlock()
	if onClose != nil {
		onClose(code, reason)
	}
	s.OnConnecting = nil
	s.OnOpen = nil
	s.OnMessage = nil
	s.OnError = nil
	s.OnClose = nil
}

func (s *WebSocketSession) signalStop() {
	s.stopOnce.Do(func() { close(s.stop) })
}
