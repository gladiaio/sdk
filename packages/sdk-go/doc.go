// Package gladia is the official Gladia API client for Go.
//
// The import path ends in sdk-go but the package name is gladia:
//
//	import gladia "github.com/gladiaio/sdk/packages/sdk-go"
//
//	client, err := gladia.NewClient(nil) // reads GLADIA_API_KEY
//
// Sub-packages:
//
//   - v2/prerecorded — pre-recorded transcription (upload, create, poll, transcribe, jobs)
//   - v2/live — live transcription sessions (WebSocket streaming) and jobs
//   - clientoptions — client configuration (API key, region, retries, timeouts)
//   - network — HTTP and WebSocket clients, HTTPError and TimeoutError
package gladia
