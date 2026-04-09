# Gladia JavaScript SDK

A TypeScript/JavaScript SDK for the [Gladia](https://www.gladia.io/) API.

## Requirements

For non-browser environment, you need either **Node.js 20+** or **Bun** .

## Installation

```bash
npm install @gladiaio/sdk
```

If you are using Node.js < 22, you also need to install the `ws` package:

```bash
npm install ws
```

## Usage

Import **`GladiaClient`** and create an instance.

Provide an API key with **`apiKey`** or the **`GLADIA_API_KEY`** environment variable. [Get your API key here](https://docs.gladia.io/chapters/introduction/getting-started) in under a minute.

You can also set **`GLADIA_API_URL`** and **`GLADIA_REGION`** (`eu-west` / `us-west`).

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

### Browser (script tag)

```html
<script src="https://unpkg.com/@gladiaio/sdk"></script>

<script>
  const gladiaClient = new Gladia.GladiaClient({
    apiKey: 'your-api-key',
  })
</script>
```

## Pre-recorded transcription

**`transcribe()`** accepts a file path (Node), **`http(s)` URL**, **`File`**, or **`Blob`**. It uploads when needed, then polls until the job completes.

```typescript
import { GladiaClient } from '@gladiaio/sdk'
import 'dotenv/config'

const gladiaClient = new GladiaClient()
const audioPath = '../data/online-meeting-example.mp4'

const result = await gladiaClient.preRecorded().transcribe(audioPath, {
  language_config: { languages: ['en'] },
})

console.log(result.result?.transcription?.full_transcript ?? '')
```

See all [supported languages here](https://docs.gladia.io/chapters/language/supported-languages) !

Pass the **options** argument to enable features from **[Audio intelligence](https://docs.gladia.io/chapters/pre-recorded-stt/audio-intelligence)** such as diarization, translation, PII redaction, and much more.

### Async pre-recorded

If your runtime has no top-level `await`, wrap calls in an **`async`** function:

```typescript
async function main() {
  const gladiaClient = new GladiaClient()
  const result = await gladiaClient.preRecorded().transcribe('./audio.mp3')
  console.log(result.result?.transcription?.full_transcript ?? '')
}

main().catch(console.error)
```

## Live transcription

```javascript
const liveSession = gladiaClient.liveV2().startSession({
  model: 'solaria-1',
  encoding: 'wav/pcm',
  sample_rate: 16000,
  bit_depth: 16,
  channels: 1,
  language_config: {
    languages: ['en'],
  },
  messages_config: {
    receive_partial_transcripts: true,
  },
})

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

liveSession.sendAudio(/* <audio_chunk> */)
liveSession.stopRecording()
```

See all the [supported languages here](https://docs.gladia.io/chapters/language/supported-languages) !

Pass the **options** argument to enable features from **[Audio intelligence](https://docs.gladia.io/chapters/live-stt/audio-intelligence)** such as diarization, translation, PII redaction, and much more.

### Waiting for the session to finish

To **`await`** shutdown after **`stopRecording()`**, wait on the **`ended`** event:

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

  liveSession.stopRecording()
  await ended
}

runLive().catch(console.error)
```

When you need the session id as soon as the backend has created the session:

```typescript
const sessionId = await liveSession.getSessionId()
```

## Documentation

- [Pre-recorded quickstart](https://docs.gladia.io/chapters/pre-recorded-stt/quickstart)
- [Live quickstart](https://docs.gladia.io/chapters/live-stt/quickstart)

## License

MIT
