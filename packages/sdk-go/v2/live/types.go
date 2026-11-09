package live

// SessionStatus mirrors JS LiveV2SessionStatus.
type SessionStatus string

const (
	SessionStatusStarting   SessionStatus = "starting"
	SessionStatusStarted    SessionStatus = "started"
	SessionStatusConnecting SessionStatus = "connecting"
	SessionStatusConnected  SessionStatus = "connected"
	SessionStatusEnding     SessionStatus = "ending"
	SessionStatusEnded      SessionStatus = "ended"
)

// ConnectSessionOptions mirrors JS LiveV2ConnectSessionOptions.
type ConnectSessionOptions struct {
	ID             string
	URL            string
	CreatedAt      string
	MessagesConfig *LiveV2MessagesConfig
}

// EnterpriseFinals mirrors JS LiveV2EnterpriseFinals.
type EnterpriseFinals string

const (
	EnterpriseFinalsEndOfTurn           EnterpriseFinals = "end_of_turn"
	EnterpriseFinalsSentenceOrEndOfTurn EnterpriseFinals = "sentence_or_end_of_turn"
	EnterpriseFinalsSentence            EnterpriseFinals = "sentence"
	EnterpriseFinalsEndpointing         EnterpriseFinals = "endpointing"
)

// EnterpriseInitOptions are Gladia Enterprise-only init fields (see enterprise.go).
type EnterpriseInitOptions struct {
	Finals *EnterpriseFinals `json:"finals,omitempty"`
}
