# Gladia Go SDK

A Go SDK for the [Gladia](https://www.gladia.io/) API.

## Requirements

Go **1.22+**.

## Installation

```sh
go get github.com/gladiaio/sdk/packages/sdk-go
```

The package name is `gladia`; importing it with an explicit name keeps call sites clear:

```go
import gladia "github.com/gladiaio/sdk/packages/sdk-go"
```

## Authentication

Pass an API key with `APIKey`, or set the `GLADIA_API_KEY` environment variable. [Get your API key](https://docs.gladia.io/chapters/introduction/getting-started).

```go
client, err := gladia.NewClient(&gladia.ClientOptions{APIKey: "your-api-key"})
// or, with GLADIA_API_KEY set:
client, err := gladia.NewClient(nil)
```

`GLADIA_API_URL` and `GLADIA_REGION` (`eu-west` / `us-west`) are also read from the environment.

## Pre-recorded transcription

`Transcribe` accepts a local file path (uploaded first) or an `http(s)` URL, then polls until the job completes.

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	gladia "github.com/gladiaio/sdk/packages/sdk-go"
	"github.com/gladiaio/sdk/packages/sdk-go/v2/prerecorded"
)

func main() {
	client, err := gladia.NewClient(nil)
	if err != nil {
		log.Fatal(err)
	}
	pre, err := client.PreRecordedV2(nil)
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
	defer cancel()

	result, err := pre.Transcribe(ctx, "audio.mp3", &prerecorded.PreRecordedV2InitTranscriptionRequest{
		LanguageConfig: &prerecorded.PreRecordedV2LanguageConfig{
			Languages: []prerecorded.PreRecordedV2TranscriptionLanguageCode{prerecorded.PreRecordedV2TranscriptionLanguageCodeEn},
		},
		Diarization: gladia.Ptr(true),
	}, 3*time.Second)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(result.Result.Transcription.FullTranscript)
}
```

See the [supported languages](https://docs.gladia.io/chapters/language/supported-languages) and [audio intelligence](https://docs.gladia.io/chapters/pre-recorded-stt/audio-intelligence) options.

Lower-level calls are available too: `UploadFile`, `Create`, `Poll`, `CreateAndPoll`, `Get`, `List`, `GetFile`, `Delete`.

## Live transcription

`StartSession` creates the session (errors are returned right away), then streams in the background. Handlers are called from SDK goroutines.

```go
lc, err := client.LiveV2(nil)
if err != nil {
	log.Fatal(err)
}

session, err := lc.StartSession(ctx, live.LiveV2InitRequest{
	Model:      gladia.Ptr(live.LiveV2ModelSolaria1),
	Encoding:   gladia.Ptr(live.LiveV2EncodingWavPcm),
	SampleRate: gladia.Ptr(live.LiveV2SampleRate16000),
	BitDepth:   gladia.Ptr(live.LiveV2BitDepth16),
	Channels:   gladia.Ptr(1),
	LanguageConfig: &live.LiveV2LanguageConfig{
		Languages: []live.LiveV2TranscriptionLanguageCode{live.LiveV2TranscriptionLanguageCodeEn},
	},
}, live.SessionHandlers{
	OnMessage: func(msg map[string]any) {
		if msg["type"] == "transcript" {
			fmt.Println(msg["data"])
		}
	},
	OnError: func(err error) { log.Println("live error:", err) },
	OnEnded: func(code int, reason string) { log.Println("ended", code, reason) },
})
if err != nil {
	log.Fatal(err)
}

for chunk := range audioChunks { // your audio source
	session.SendAudio(chunk)
}
session.StopRecording() // the server sends the final results, then ends the session

_ = session.WaitEnded(ctx)
```

- `SendAudio` is safe to call from any goroutine. Audio is buffered until the server acknowledges it and replayed in order after a reconnection.
- `WaitUntilConnected(ctx)` blocks until the WebSocket is open; audio sent before that is buffered.
- `EndSession()` closes the session immediately, without final results.
- `ConnectSession` attaches to a session created elsewhere (for example on your backend).
- Job management: `Get`, `List`, `GetFile`, `Delete`.

## Options

```go
client, err := gladia.NewClient(&gladia.ClientOptions{
	APIKey:      "your-api-key",
	Region:      clientoptions.RegionUSWest, // live session creation only
	HTTPTimeout: 30 * time.Second,
	HTTPRetry:   clientoptions.HTTPRetryOptions{MaxAttempts: 3},
	WSTimeout:   10 * time.Second, // WebSocket dial and per-write timeout
	WSRetry:     clientoptions.WebSocketRetryOptions{MaxAttemptsPerConnection: 5},
})
```

`PreRecordedV2(override)` and `LiveV2(override)` accept per-client overrides.

## Error handling

Non-2xx responses return a `*network.HTTPError`; deadlines return a `*network.TimeoutError`.

```go
var httpErr *network.HTTPError
if errors.As(err, &httpErr) {
	log.Println(httpErr.Status, httpErr.RequestID, httpErr.Message)
}
```

## Links

- [Documentation](https://docs.gladia.io)
- [API reference](https://docs.gladia.io/api-reference)
- [Code samples](https://github.com/gladiaio/gladia-samples)
