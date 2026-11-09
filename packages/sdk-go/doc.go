// Package gladia is the official Gladia API client for Go.
//
// Layout mirrors the JavaScript and Python SDKs:
//
//   - clientoptions — GladiaClientOptions (Python: client_options, JS: types.ts)
//   - network — HTTP and WebSocket clients (Python: network/, JS: network/)
//   - v2/live, v2/prerecorded — V2 API clients and generated OpenAPI types
//
// WebSocket streaming for live sessions is not implemented yet.
package gladia
