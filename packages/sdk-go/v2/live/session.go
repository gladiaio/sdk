package live

import (
	"context"
	"errors"
	"sync"

	"github.com/gladiaio/sdk/packages/sdk-go/network"
)

const stopRecordingMessage = `{"type":"stop_recording"}`

// ErrSessionEnded is returned by WaitUntilConnected when the session ends before connecting.
var ErrSessionEnded = errors.New("live session ended before connected")

type sessionConfig struct {
	init     map[string]any
	existing *LiveV2InitResponse
	ws       *network.WebSocketClient
	handlers SessionHandlers
}

// Session is a live transcription session: the WebSocket stream of a session
// created by Client.StartSession or attached with Client.ConnectSession.
//
// Audio passed to SendAudio is kept in a resend buffer until the server
// acknowledges it, and replayed in order after a reconnection.
//
// All methods are safe for concurrent use. Handlers are called from SDK
// goroutines, never while an internal lock is held, so they may call Session
// methods (including EndSession).
type Session struct {
	handlers    SessionHandlers
	messagesCfg *LiveV2MessagesConfig
	wsClient    *network.WebSocketClient

	// sendMu serializes everything written on the socket for this session
	// (audio, stop_recording, and the buffer replay on (re)connect) so that
	// the wire order always matches the resend buffer order.
	sendMu sync.Mutex

	// mu guards the fields below.
	mu          sync.Mutex
	status      SessionStatus
	initResp    *LiveV2InitResponse
	wsSession   *network.WebSocketSession
	audioBuffer []byte
	// bufferOffset is the absolute stream offset of audioBuffer[0] (bytes acknowledged so far).
	bufferOffset int
	// streaming is true once the buffer was replayed on the current connection;
	// direct sends are only allowed while it is true. Set to true only with sendMu held.
	streaming bool

	readyCh   chan struct{}
	endedCh   chan struct{}
	readyOnce sync.Once
	endOnce   sync.Once
}

func newSession(cfg sessionConfig) *Session {
	return &Session{
		handlers:    cfg.handlers,
		messagesCfg: messagesConfigFromInit(cfg.init),
		wsClient:    cfg.ws,
		status:      SessionStatusStarted,
		initResp:    cfg.existing,
		readyCh:     make(chan struct{}),
		endedCh:     make(chan struct{}),
	}
}

// start emits started and dials the WebSocket in the background.
func (s *Session) start() {
	go func() {
		session := s.InitResponse()
		s.emitStarted(session)
		if receiveLifecycleEvents(s.messagesCfg) {
			s.emitMessage(map[string]any{
				"type":       "start_session",
				"session_id": session.ID,
				"created_at": session.CreatedAt,
			})
		}
		s.connectWebSocket(session.URL)
	}()
}

// Status returns the session lifecycle state.
func (s *Session) Status() SessionStatus {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.status
}

// SessionID returns the live session id.
func (s *Session) SessionID() string {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.initResp == nil {
		return ""
	}
	return s.initResp.ID
}

// InitResponse returns the POST /v2/live response (or the attached session info).
func (s *Session) InitResponse() *LiveV2InitResponse {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.initResp
}

// SendAudio queues audio and sends it right away when the WebSocket is connected.
//
// Audio stays in the resend buffer until acknowledged by the server. It is a
// no-op once StopRecording or EndSession has been called. Concurrent calls are
// serialized: chunks reach the server in the order the calls acquire the lock.
func (s *Session) SendAudio(audio []byte) {
	if len(audio) == 0 {
		return
	}
	s.sendMu.Lock()
	defer s.sendMu.Unlock()

	s.mu.Lock()
	if s.status == SessionStatusEnding || s.status == SessionStatusEnded {
		s.mu.Unlock()
		return
	}
	s.audioBuffer = append(s.audioBuffer, audio...)
	ws, streaming := s.wsSession, s.streaming
	s.mu.Unlock()

	if streaming && ws != nil {
		if err := ws.Send(audio); err != nil {
			// Keep the chunk buffered; it is replayed (in order) on reconnect.
			s.stopStreaming()
		}
	}
}

// StopRecording asks the server to finish processing the audio sent so far.
// stop_recording is (re)sent on every (re)connection until the session ends.
func (s *Session) StopRecording() {
	s.sendMu.Lock()
	s.mu.Lock()
	if s.status == SessionStatusEnding || s.status == SessionStatusEnded {
		s.mu.Unlock()
		s.sendMu.Unlock()
		return
	}
	s.status = SessionStatusEnding
	ws, streaming := s.wsSession, s.streaming
	s.mu.Unlock()
	if streaming && ws != nil {
		if err := ws.SendText(stopRecordingMessage); err != nil {
			s.stopStreaming()
		}
	}
	s.sendMu.Unlock()

	s.emitEnding(1000, "")
}

// EndSession closes the session immediately, without waiting for the final results.
func (s *Session) EndSession() {
	s.doDestroy(1000, "Session ended by user")
}

// WaitUntilConnected blocks until the WebSocket is connected, the session ends
// (ErrSessionEnded) or ctx is done.
func (s *Session) WaitUntilConnected(ctx context.Context) error {
	select {
	case <-s.readyCh:
		return nil
	case <-s.endedCh:
		select {
		case <-s.readyCh:
			return nil
		default:
		}
		return ErrSessionEnded
	case <-ctx.Done():
		return ctx.Err()
	}
}

// WaitEnded blocks until the session has ended or ctx is done.
func (s *Session) WaitEnded(ctx context.Context) error {
	select {
	case <-s.endedCh:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

// Done returns a channel closed when the session has ended.
func (s *Session) Done() <-chan struct{} {
	return s.endedCh
}

func (s *Session) stopStreaming() {
	s.mu.Lock()
	s.streaming = false
	s.mu.Unlock()
}

func (s *Session) connectWebSocket(wsURL string) {
	ws, err := s.wsClient.CreateSession(wsURL)
	if err != nil {
		s.emitError(err)
		s.doDestroy(1006, "Couldn't connect websocket")
		return
	}

	s.mu.Lock()
	if s.status == SessionStatusEnded {
		s.mu.Unlock()
		return
	}
	s.wsSession = ws
	s.mu.Unlock()

	ws.OnConnecting = func(_ int, attempt int) {
		s.mu.Lock()
		s.streaming = false
		if s.status != SessionStatusEnding && s.status != SessionStatusEnded {
			s.status = SessionStatusConnecting
		}
		s.mu.Unlock()
		s.emitConnecting(attempt)
	}
	ws.OnOpen = func(_ int, attempt int) { s.onOpen(ws, attempt) }
	ws.OnMessage = s.onMessage
	ws.OnError = s.emitError
	ws.OnClose = s.doDestroy
	ws.Start()
}

// onOpen replays the resend buffer (and stop_recording when ending) before
// allowing direct sends, all under sendMu so no SendAudio can interleave.
func (s *Session) onOpen(ws *network.WebSocketSession, attempt int) {
	s.sendMu.Lock()
	s.mu.Lock()
	if s.status == SessionStatusEnded {
		s.mu.Unlock()
		s.sendMu.Unlock()
		return
	}
	buffered := append([]byte(nil), s.audioBuffer...)
	ending := s.status == SessionStatusEnding
	s.mu.Unlock()

	err := sendAudioInChunks(ws, buffered)
	if err == nil && ending {
		err = ws.SendText(stopRecordingMessage)
	}

	s.mu.Lock()
	// On failure the connection is dropping: keep buffering, the next open replays again.
	s.streaming = err == nil
	connected := err == nil && s.status != SessionStatusEnding && s.status != SessionStatusEnded
	if connected {
		s.status = SessionStatusConnected
	}
	s.mu.Unlock()
	s.sendMu.Unlock()

	if connected {
		s.readyOnce.Do(func() { close(s.readyCh) })
		s.emitConnected(attempt)
	}
}

func (s *Session) onMessage(data []byte) {
	msg, err := parseWSMessage(data)
	if err != nil {
		s.emitError(err)
		return
	}
	if typ, _ := msg["type"].(string); typ == "audio_chunk" {
		if ack, _ := msg["acknowledged"].(bool); ack {
			end, err := acknowledgedByteEnd(msg)
			if err != nil {
				s.emitError(err)
			} else {
				s.mu.Lock()
				s.audioBuffer, s.bufferOffset = trimAcknowledgedBuffer(s.audioBuffer, s.bufferOffset, end)
				s.mu.Unlock()
			}
		}
	}
	if shouldEmitWSMessage(msg, s.messagesCfg) {
		s.emitMessage(msg)
	}
}

func (s *Session) doDestroy(code int, reason string) {
	s.sendMu.Lock()
	s.mu.Lock()
	if s.status == SessionStatusEnded {
		s.mu.Unlock()
		s.sendMu.Unlock()
		return
	}
	wasEnding := s.status == SessionStatusEnding
	ws, streaming := s.wsSession, s.streaming
	s.status = SessionStatusEnded
	s.wsSession = nil
	s.streaming = false
	s.audioBuffer = nil
	s.mu.Unlock()
	if !wasEnding && streaming && ws != nil {
		_ = ws.SendText(stopRecordingMessage)
	}
	s.sendMu.Unlock()

	if !wasEnding {
		s.emitEnding(code, reason)
	}
	if ws != nil {
		ws.Close(1001, "Aborted")
	}
	s.emitEnded(code, reason)
	s.endOnce.Do(func() { close(s.endedCh) })
}

func (s *Session) emitStarted(resp *LiveV2InitResponse) {
	if h := s.handlers.OnStarted; h != nil {
		h(resp)
	}
}

func (s *Session) emitConnecting(attempt int) {
	if h := s.handlers.OnConnecting; h != nil {
		h(attempt)
	}
}

func (s *Session) emitConnected(attempt int) {
	if h := s.handlers.OnConnected; h != nil {
		h(attempt)
	}
}

func (s *Session) emitEnding(code int, reason string) {
	if h := s.handlers.OnEnding; h != nil {
		h(code, reason)
	}
}

func (s *Session) emitEnded(code int, reason string) {
	if h := s.handlers.OnEnded; h != nil {
		h(code, reason)
	}
}

func (s *Session) emitMessage(msg map[string]any) {
	if h := s.handlers.OnMessage; h != nil {
		h(msg)
	}
}

func (s *Session) emitError(err error) {
	if h := s.handlers.OnError; h != nil {
		h(err)
	}
}
