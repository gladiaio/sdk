# Gladia JavaScript SDK

A TypeScript/JavaScript SDK for the Gladia API.

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
