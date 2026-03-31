# Gladia JavaScript SDK

A TypeScript/JavaScript SDK for the Gladia API.

## Requirements

For non-browser environment, you need either Node 20+ or Bun.  
It may work on other runtimes but they are not supported / tested.

## Installation

```bash
npm install @gladiaio/sdk
```

If you are using Node.js < 22, you also need to install the `ws` package:

```bash
npm install ws
```

On Node >= 22, Bun and browser, the native WebSocket client will be used.

## Usage

To use the SDK, import `GladiaClient` and create a new instance of it.

Provide a valid API key via the `apiKey` option or the `GLADIA_API_KEY` environment variable.
If the SDK is used in public code (on browser for example) and you don't want to give away your private api key, you can also change the default `apiUrl` to redirect calls to a proxy that will redirect to `https://api.gladia.io` and add the header `X-Gladia-Key`.

You can also configure `apiKey`, `apiUrl` and `region` through their respective environment variables: `GLADIA_API_KEY`, `GLADIA_API_URL` and `GLADIA_REGION`.

### Node.js / Browser (ESM)

```typescript
import { GladiaClient } from '@gladiaio/sdk'

const gladiaClient = new GladiaClient({
  apiKey: 'your-api-key',
})
```

### Node.js (CommonJS)

```javascript
const { GladiaClient } = require('@gladiaio/sdk')

const gladiaClient = new GladiaClient({
  apiKey: 'your-api-key',
})
```

### Browser (Script Tag)

```html
<script src="https://unpkg.com/@gladiaio/sdk"></script>

<script>
  const gladiaClient = new Gladia.GladiaClient({
    apiKey: 'your-api-key',
  })
</script>
```

## Pre-recorded transcription

```typescript
import { GladiaClient } from '@gladiaio/sdk'
import 'dotenv/config'

const gladiaClient = new GladiaClient()
const audioPath = '../data/online-meeting-example.mp4'

const result = await gladiaClient.preRecorded().transcribe(audioPath)

console.log(result.result?.transcription?.full_transcript ?? '')
```

`GladiaClient` reads `GLADIA_API_KEY` (and optional `GLADIA_API_URL`, `GLADIA_REGION`) from the environment; in Node you can load a `.env` file with [`dotenv`](https://github.com/motdotla/dotenv) as shown above.

`transcribe` accepts a file path, `http(s)` URL, `File`, or `Blob`, uploads when needed, then polls until the job completes. Pass a second argument for options such as `language_config` (see the [API reference](https://docs.gladia.io)).

### Async pre-recorded

If your environment does not support top-level `await`, wrap calls in an `async` function:

```typescript
import { GladiaClient } from '@gladiaio/sdk'
import 'dotenv/config'

async function main() {
  const gladiaClient = new GladiaClient()
  const audioPath = '../data/online-meeting-example.mp4'

  const result = await gladiaClient.preRecorded().transcribe(audioPath, {
    language_config: { languages: ['en'] },
  })

  console.log(result.result?.transcription?.full_transcript ?? '')
}

main().catch(console.error)
```

## Live transcription (V2)

### Usage

```javascript
// Create session
const liveSession = gladiaClient.liveV2().startSession({
  language_config: {
    languages: ['en'],
  },
  messages_config: {
    receive_partial_transcripts: true,
  },
})

// Add listeners
liveSession.on('message', (message) => {
  if (message.type === 'transcript') {
    console.log(`${message.data.is_final ? 'F' : 'P'} | ${message.data.utterance.text.trim()}`)
  }
})

liveSession.once('started', () => {
  console.log(`Session ${liveSession.sessionId} started`)
})

liveSession.on('error', (err) => {
  console.error('An error occurred during live session:', err)
})

liveSession.once('ended', () => {
  console.log(`Session ${liveSession.sessionId} ended`)
})

// Send audio
liveSession.sendAudio(/* <audio_chunk> */)
// ...
liveSession.sendAudio(/* <audio_chunk> */)

// Stop the recording when all audio have been sent.
// Remaining audio will be processed and after post-processing,
// the session is ended.
liveSession.stopRecording()
```

`live()` is an alias for `liveV2()`.

### Waiting for the session to finish

To **`await`** shutdown after `stopRecording()` (for example in an `async` function), wait on the `ended` event:

```typescript
import { GladiaClient } from '@gladiaio/sdk'

async function runLive() {
  const gladiaClient = new GladiaClient({ apiKey: 'your-api-key' })
  const liveSession = gladiaClient.liveV2().startSession({
    language_config: { languages: ['en'] },
  })

  const ended = new Promise<void>((resolve) => {
    liveSession.once('ended', () => resolve())
  })

  // … register other listeners, send audio with liveSession.sendAudio(...), then:
  liveSession.stopRecording()
  await ended
}

runLive().catch(console.error)
```

When you need the session id as soon as the backend has created the session, you can use:

```typescript
const sessionId = await liveSession.getSessionId()
```
