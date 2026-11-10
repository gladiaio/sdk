package network

// ReadyState mirrors JS WS_STATES / Python WS_STATES.
type ReadyState int

const (
	WSConnecting ReadyState = iota
	WSOpen
	WSClosing
	WSClosed
)
