# Gladia JavaScript SDK

A TypeScript/JavaScript SDK for the Gladia API.

## Installation

```bash
npm install @gladiaio/sdk
```

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
<!-- From CDN -->
<script src="https://unpkg.com/@gladiaio/sdk"></script>
<!-- Or local file -->
<script src="./node_modules/@gladiaio/sdk"></script>

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
const liveSession = gladiaClient.liveV2().newSession({
  language_config: {
    languages: ['en'],
  },
  messages_config: {
    receive_partial_transcripts: true,
  },
})

// Add listeners
liveSession.on('transcript', transcript => {
  console.log(`${transcript.data.is_final ? 'F' : 'P'} | ${transcript.data.utterance.text.trim()}`)
})

// Send audio
liveSession.sendAudio(/* <audio_chunk> */)
// ...
liveSession.sendAudio(/* <audio_chunk> */)

// Stop the session when all audio have been sent
liveSession.stop()
```
