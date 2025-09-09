# Gladia JavaScript SDK

A TypeScript/JavaScript SDK for the Gladia API.

## Installation

```bash
npm install @gladiaio/sdk
```

## Usage

### Node.js (ESM)

```typescript
import { GladiaClient } from '@gladiaio/sdk'

const client = new GladiaClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.gladia.io', // optional
})

const status = await client.getStatus()
console.log(status)
```

### Node.js (CommonJS)

```javascript
const { GladiaClient } = require('@gladiaio/sdk')

const client = new GladiaClient({
  apiKey: 'your-api-key',
})
```

### Browser (Script Tag)

```html
<!-- From CDN -->
<script src="https://unpkg.com/@gladiaio/sdk/dist/gladia.browser.min.js"></script>
<!-- Or local file -->
<script src="./node_modules/@gladiaio/sdk/dist/gladia.browser.min.js"></script>

<script>
  const client = new Gladia.GladiaClient({
    apiKey: 'your-api-key',
  })

  client.getStatus().then((status) => {
    console.log(status)
  })
</script>
```

### Browser (ES Modules)

```html
<script type="module">
  import { GladiaClient } from 'https://unpkg.com/@gladiaio/sdk/dist/index.js'

  const client = new GladiaClient({
    apiKey: 'your-api-key',
  })
</script>
```

## Development

### Building

```bash
npm run build
```

This will generate:

- `dist/index.js` - ESM build (ES2022, Node 20+)
- `dist/index.cjs` - CommonJS build (ES2022, Node 20+)
- `dist/index.d.ts` - TypeScript definitions
- `dist/gladia.browser.js` - Browser build (IIFE, ES2020)
- `dist/gladia.browser.min.js` - Minified browser build (IIFE, ES2020)
- Source maps for all builds

### Watch mode

```bash
npm run build:watch
```

### Clean

```bash
npm run clean
```

## Exports

The package supports multiple module formats:

- **ESM**: `import { GladiaClient } from '@gladia/javascript-sdk'`
- **CommonJS**: `const { GladiaClient } = require('@gladia/javascript-sdk')`
- **Browser**: Include `dist/browser.js` or `dist/browser.min.js` and use `window.Gladia`

## License

MIT
