package live

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"sync"
	"time"

	"github.com/gladiaio/sdk-go/clientoptions"
	"github.com/gladiaio/sdk-go/network"
)

type sessionConfig struct {
	ctx      context.Context
	init     map[string]any
	existing *LiveV2InitResponse
	region   clientoptions.Region
	apiURL   string
	http     *network.HttpClient
	ws       *network.WebSocketClient
	opts     clientoptions.GladiaClientOptions
}

// Session is an active live session with HTTP init and WebSocket streaming.
type Session struct {
	mu          sync.RWMutex
	handlers    SessionHandlers
	status      SessionStatus
	initResp    *LiveV2InitResponse
	initOptions map[string]any
	messagesCfg *LiveV2MessagesConfig
	http        *network.HttpClient
	wsClient    *network.WebSocketClient
	wsSession   *network.WebSocketSession
	opts        clientoptions.GladiaClientOptions
	region      clientoptions.Region
	apiURL      string
	initCtx     context.Context
	audioBuffer []byte
	bytesSent   int
	pendingStop bool
	readyCh     chan struct{}
	endedCh     chan struct{}
	stopOnce    sync.Once
	readyOnce   sync.Once
}

func newSession(cfg sessionConfig) (*Session, error) {
	if cfg.http == nil || cfg.ws == nil {
		return nil, errors.New("session requires http and websocket clients")
	}
	initCtx := cfg.ctx
	if initCtx == nil {
		initCtx = context.Background()
	}
	s := &Session{
		status:      SessionStatusStarting,
		initOptions: cfg.init,
		messagesCfg: messagesConfigFromInit(cfg.init),
		http:        cfg.http,
		wsClient:    cfg.ws,
		opts:        cfg.opts,
		region:      cfg.region,
		apiURL:      cfg.apiURL,
		initCtx:     initCtx,
		readyCh:     make(chan struct{}),
		endedCh:     make(chan struct{}),
	}
	if cfg.existing != nil {
		s.initResp = cfg.existing
	}
	go s.lifecycle()
	return s, nil
}

// SetHandlers registers lifecycle callbacks. Safe to call before events fire.
func (s *Session) SetHandlers(h SessionHandlers) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.handlers = h
}

// Status returns the session lifecycle state.
func (s *Session) Status() SessionStatus {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.status
}

// SessionID returns the live session id when started.
func (s *Session) SessionID() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.initResp == nil {
		return ""
	}
	return s.initResp.Id
}

// InitResponse returns the POST /v2/live response.
func (s *Session) InitResponse() *LiveV2InitResponse {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.initResp
}

// SendAudio appends audio and sends when the WebSocket is open.
func (s *Session) SendAudio(audio []byte) {
	s.mu.Lock()
	if s.status == SessionStatusEnding || s.status == SessionStatusEnded {
		s.mu.Unlock()
		return
	}
	s.audioBuffer = append(s.audioBuffer, audio...)
	ws := s.wsSession
	open := ws != nil && ws.ReadyState() == network.WSOpen
	s.mu.Unlock()
	if open && ws != nil {
		_ = ws.Send(audio)
	}
}

// StopRecording asks the server to finish processing buffered audio.
func (s *Session) StopRecording() {
	s.mu.Lock()
	if s.status == SessionStatusEnding || s.status == SessionStatusEnded {
		s.mu.Unlock()
		return
	}
	s.status = SessionStatusEnding
	ws := s.wsSession
	open := ws != nil && ws.ReadyState() == network.WSOpen
	s.mu.Unlock()

	s.emitEnding(1000, "")
	if open && ws != nil {
		_ = ws.SendText(`{"type":"stop_recording"}`)
		s.mu.Lock()
		s.pendingStop = false
		s.mu.Unlock()
	} else {
		s.mu.Lock()
		s.pendingStop = true
		s.mu.Unlock()
	}
}

// EndSession closes the session immediately.
func (s *Session) EndSession() {
	s.doDestroy(1000, "Session ended by user")
}

// WaitUntilConnected blocks until connected or ctx ends.
func (s *Session) WaitUntilConnected(ctx context.Context) error {
	select {
	case <-s.readyCh:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	case <-s.endedCh:
		return errors.New("session ended before connected")
	}
}

func (s *Session) lifecycle() {
	defer s.signalEnded()
	if s.initResp == nil {
		if err := s.initSession(); err != nil {
			return
		}
	}
	s.startSession()
}

func (s *Session) initSession() error {
	body := buildInitBody(s.initOptions, s.apiURL)
	var out LiveV2InitResponse
	err := s.http.JSON(s.initCtx, http.MethodPost, buildLiveInitPath(s.region), &out, network.WithJSONBody(body))
	if err != nil {
		s.emitError(err)
		s.doDestroy(1006, "Couldn't start a new session")
		return err
	}
	s.mu.Lock()
	s.initResp = &out
	s.mu.Unlock()
	return nil
}

func (s *Session) startSession() {
	s.mu.Lock()
	session := s.initResp
	if session == nil {
		s.mu.Unlock()
		return
	}
	if s.status == SessionStatusStarting {
		s.status = SessionStatusStarted
	}
	s.mu.Unlock()

	s.emitStarted(session)
	if receiveLifecycleEvents(s.messagesCfg) {
		s.emitMessage(map[string]any{
			"type":       "start_session",
			"session_id": session.Id,
			"created_at": session.CreatedAt,
		})
	}
	s.connectWebSocket(session.Url)
}

func (s *Session) connectWebSocket(wsURL string) {
	ws, err := s.wsClient.CreateSession(wsURL)
	if err != nil {
		s.emitError(err)
		s.doDestroy(1006, "Couldn't connect websocket")
		return
	}

	s.mu.Lock()
	s.wsSession = ws
	s.mu.Unlock()

	ws.OnConnecting = func(_ int, attempt int) {
		s.mu.Lock()
		s.status = SessionStatusConnecting
		s.mu.Unlock()
		s.emitConnecting(attempt)
	}

	ws.OnOpen = func(_ int, attempt int) {
		s.mu.Lock()
		buffered := append([]byte(nil), s.audioBuffer...)
		pendingStop := s.pendingStop
		ending := s.status == SessionStatusEnding
		s.mu.Unlock()

		if len(buffered) > 0 {
			sendAudioInChunks(ws, buffered)
		}
		if pendingStop {
			s.mu.Lock()
			s.pendingStop = false
			s.mu.Unlock()
			_ = ws.SendText(`{"type":"stop_recording"}`)
		}
		if ending {
			return
		}
		s.mu.Lock()
		s.status = SessionStatusConnected
		s.mu.Unlock()
		s.emitConnected(attempt)
		s.readyOnce.Do(func() { close(s.readyCh) })
	}

	ws.OnMessage = func(data []byte) {
		msg, err := parseWSMessage(data)
		if err != nil {
			s.emitError(err)
			return
		}
		if shouldEmitWSMessage(msg, s.messagesCfg) {
			s.emitMessage(msg)
		}
		if typ, _ := msg["type"].(string); typ == "audio_chunk" {
			if ack, _ := msg["acknowledged"].(bool); ack {
				end, err := acknowledgedByteEnd(msg)
				if err != nil {
					s.emitError(err)
					return
				}
				s.mu.Lock()
				s.audioBuffer, s.bytesSent = trimAcknowledgedBuffer(s.audioBuffer, s.bytesSent, end)
				s.mu.Unlock()
			}
		}
	}

	ws.OnError = func(err error) {
		s.emitError(err)
	}

	ws.OnClose = func(code int, reason string) {
		s.doDestroy(code, reason)
	}
}

func (s *Session) doDestroy(code int, reason string) {
	s.mu.Lock()
	if s.status == SessionStatusEnded {
		s.mu.Unlock()
		return
	}
	ws := s.wsSession
	if s.status != SessionStatusEnding {
		s.status = SessionStatusEnding
		s.mu.Unlock()
		s.emitEnding(code, reason)
		if ws != nil && ws.ReadyState() == network.WSOpen {
			_ = ws.SendText(`{"type":"stop_recording"}`)
		}
	} else {
		s.mu.Unlock()
	}
	s.mu.Lock()
	s.status = SessionStatusEnded
	s.wsSession = nil
	s.audioBuffer = nil
	s.mu.Unlock()

	if ws != nil {
		ws.Close(1001, "Aborted")
	}
	s.emitEnded(code, reason)
	s.signalEnded()
}

func (s *Session) signalEnded() {
	s.stopOnce.Do(func() { close(s.endedCh) })
}

func (s *Session) emitStarted(resp *LiveV2InitResponse) {
	s.mu.RLock()
	h := s.handlers.OnStarted
	s.mu.RUnlock()
	if h != nil {
		h(resp)
	}
}

func (s *Session) emitConnecting(attempt int) {
	s.mu.RLock()
	h := s.handlers.OnConnecting
	s.mu.RUnlock()
	if h != nil {
		h(attempt)
	}
}

func (s *Session) emitConnected(attempt int) {
	s.mu.RLock()
	h := s.handlers.OnConnected
	s.mu.RUnlock()
	if h != nil {
		h(attempt)
	}
}

func (s *Session) emitEnding(code int, reason string) {
	s.mu.RLock()
	h := s.handlers.OnEnding
	s.mu.RUnlock()
	if h != nil {
		h(code, reason)
	}
}

func (s *Session) emitEnded(code int, reason string) {
	s.mu.RLock()
	h := s.handlers.OnEnded
	s.mu.RUnlock()
	if h != nil {
		h(code, reason)
	}
}

func (s *Session) emitMessage(msg map[string]any) {
	s.mu.RLock()
	h := s.handlers.OnMessage
	s.mu.RUnlock()
	if h != nil {
		h(msg)
	}
}

func (s *Session) emitError(err error) {
	s.mu.RLock()
	h := s.handlers.OnError
	s.mu.RUnlock()
	if h != nil {
		h(err)
	}
}

// ConnectWebSocket is a no-op; the session connects automatically in the background.
func (s *Session) ConnectWebSocket(context.Context) error {
	return nil
}

// MarshalInitDebug returns JSON for the init body (tests / debugging).
func MarshalInitDebug(v any) ([]byte, error) {
	return json.Marshal(v)
}

// WaitEnded blocks until the session ends or the timeout elapses.
func (s *Session) WaitEnded(timeout time.Duration) bool {
	if timeout <= 0 {
		<-s.endedCh
		return true
	}
	select {
	case <-s.endedCh:
		return true
	case <-time.After(timeout):
		return false
	}
}
