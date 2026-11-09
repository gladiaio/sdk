package live

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

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

// Session is an active or starting live session (JS: LiveV2Session, Python: LiveV2Session).
type Session struct {
	status   SessionStatus
	initResp *LiveV2InitResponse
	http     *network.HttpClient
	ws       *network.WebSocketClient
	opts     clientoptions.GladiaClientOptions
	initCtx  context.Context
}

func newSession(cfg sessionConfig) (*Session, error) {
	s := &Session{
		status:  SessionStatusStarting,
		http:    cfg.http,
		ws:      cfg.ws,
		opts:    cfg.opts,
		initCtx: cfg.ctx,
	}
	if cfg.existing != nil {
		s.initResp = cfg.existing
		s.status = SessionStatusStarted
		return s, nil
	}
	if s.initCtx == nil {
		s.initCtx = context.Background()
	}
	body := InitBodyFor(cfg.init, cfg.apiURL)
	path := "/v2/live"
	if cfg.region != "" {
		q := url.Values{}
		q.Set("region", string(cfg.region))
		path = path + "?" + q.Encode()
	}
	var out LiveV2InitResponse
	err := s.http.JSON(s.initCtx, http.MethodPost, path, &out, network.WithJSONBody(body))
	if err != nil {
		return nil, err
	}
	s.initResp = &out
	s.status = SessionStatusStarted
	return s, nil
}

// Status returns the session lifecycle state.
func (s *Session) Status() SessionStatus {
	return s.status
}

// SessionID returns the live session id when started.
func (s *Session) SessionID() string {
	if s.initResp == nil {
		return ""
	}
	return s.initResp.Id
}

// InitResponse returns the POST /v2/live response.
func (s *Session) InitResponse() *LiveV2InitResponse {
	return s.initResp
}

// ConnectWebSocket will attach to the session WebSocket (not yet implemented).
func (s *Session) ConnectWebSocket(_ context.Context) error {
	return fmt.Errorf("%w: use HTTP job APIs or wait for a future release", network.ErrWebSocketNotImplemented)
}

// MarshalInitDebug returns JSON for the init body (tests / debugging).
func MarshalInitDebug(v any) ([]byte, error) {
	return json.Marshal(v)
}
