package network

import (
	"time"

	"github.com/gladiaio/sdk-go/clientoptions"
)

// RetryFromOptions converts client retry options to the HTTP client config.
func RetryFromOptions(opts clientoptions.HttpRetryOptions) HttpRetryConfig {
	statuses := make([]StatusCodeMatcher, len(opts.StatusCodes))
	for i, s := range opts.StatusCodes {
		statuses[i] = StatusCodeMatcher{Single: s.Single, Start: s.Start, End: s.End}
	}
	delay := opts.Delay
	if delay == nil {
		delay = func(int) time.Duration { return 300 * time.Millisecond }
	}
	return HttpRetryConfig{
		MaxAttempts: opts.MaxAttempts,
		StatusCodes: statuses,
		Delay:       delay,
	}
}
