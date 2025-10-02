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

You have to give a valid `apiKey` to make requests.
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

## Live V2

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
