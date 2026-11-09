package network

import (
	"time"

	"github.com/gladiaio/sdk-go/clientoptions"
)

func matchesCloseCode(code int, list []clientoptions.StatusCodeMatcher) bool {
	for _, item := range list {
		if item.Start != 0 || item.End != 0 {
			if code >= item.Start && code <= item.End {
				return true
			}
			continue
		}
		if code == item.Single {
			return true
		}
	}
	return false
}

func wsRetryFrom(opts clientoptions.WebSocketRetryOptions) clientoptions.WebSocketRetryOptions {
	out := opts
	if out.Delay == nil {
		out.Delay = func(attempt int) time.Duration {
			ms := min(300*float64(uint(1)<<max(0, attempt-1)), 2_000)
			return time.Duration(ms) * time.Millisecond
		}
	}
	if out.MaxAttemptsPerConnection < 0 {
		out.MaxAttemptsPerConnection = 0
	}
	if out.MaxConnections < 0 {
		out.MaxConnections = 0
	}
	return out
}

func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func wsMaxConnectionsReached(retry clientoptions.WebSocketRetryOptions, count int) bool {
	return retry.MaxConnections > 0 && count >= retry.MaxConnections
}
