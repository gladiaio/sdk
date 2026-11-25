package live

// SessionHandlers receives live session lifecycle callbacks (JS/Python event emitter).
type SessionHandlers struct {
	OnStarted    func(*LiveV2InitResponse)
	OnConnecting func(attempt int)
	OnConnected  func(attempt int)
	OnEnding     func(code int, reason string)
	OnEnded      func(code int, reason string)
	OnMessage    func(map[string]any)
	OnError      func(error)
}
