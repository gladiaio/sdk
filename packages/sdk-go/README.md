# Gladia Go SDK (`github.com/gladiaio/sdk-go`)

Official Gladia API client for Go. Package layout mirrors [@gladiaio/sdk](../sdk-js) and [gladiaio-sdk](../sdk-python).

## Install

```sh
go get github.com/gladiaio/sdk-go
```

## Quick start

```go
package main

import (
	"context"
	"log"
	"time"

	"github.com/gladiaio/sdk-go"
	"github.com/gladiaio/sdk-go/clientoptions"
)

func main() {
	root, err := gladia.NewGladiaClient(nil) // uses GLADIA_API_KEY
	if err != nil {
		log.Fatal(err)
	}
	pre, err := root.PreRecordedV2(nil)
	if err != nil {
		log.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
	defer cancel()
	result, err := pre.Transcribe(ctx, "/path/to/audio.wav", nil, 3*time.Second)
	if err != nil {
		log.Fatal(err)
	}
	log.Println(result.Status)
}
```

## Layout (parity with JS / Python)

| Go | JavaScript | Python |
| --- | --- | --- |
| `gladia` (`GladiaClient`) | `GladiaClient` | `GladiaClient` |
| `clientoptions` | `GladiaClientOptions` in `types.ts` | `client_options.py` |
| `network` (`HttpClient`, `WebSocketClient`) | `network/httpClient.ts`, `wsClient.ts` | `network/http_client.py`, `websocket_client.py` |
| `v2/live` | `v2/live/` | `v2/live/` |
| `v2/prerecorded` | `v2/prerecorded/` | `v2/prerecorded/` |
| `v2` (`JobCore`, list URLs) | `v2/build-list-url.ts` + shared logic | `v2/core.py` |

Generated OpenAPI types: `v2/live/generated_types.go`, `v2/prerecorded/generated_types.go`.

### Not yet implemented (structural placeholders exist)

- Live **WebSocket** streaming (`Session.ConnectWebSocket`, `network.WebSocketClient`)
- Python-style **async** clients (`async_client.py` equivalents)

Publishing to pkg.go.dev is intentionally deferred.

## Development (monorepo)

```sh
bun nx run generator:generate
bun nx run sdk-go:build
bun nx run sdk-go:test
```
