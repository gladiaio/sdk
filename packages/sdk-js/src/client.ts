import { deepMergeObjects, getEnv } from './helpers.js'
import type { InternalGladiaClientOptions } from './internal_types.js'
import type { GladiaClientOptions } from './types.js'
import { LiveV2Client } from './v2/live/index.js'

function assertValidOptions(options: InternalGladiaClientOptions) {
  let url: URL
  try {
    url = new URL(options.apiUrl)
  } catch {
    throw new Error(`Invalid url: "${options.apiUrl}".`)
  }

  if (!options?.apiKey && url.hostname.endsWith('.gladia.io')) {
    throw new Error(`You have to set your "apiKey" or define a proxy "apiUrl".`)
  }

  if (!['https:', 'http:', 'wss:', 'ws:'].includes(url.protocol)) {
    throw new Error(
      `Only HTTP and WebSocket protocols are supported for apiUrl (received: ${url.protocol}).`
    )
  }
}

const defaultHttpDelay = (attemptCount: number) =>
  Math.min(0.3 * 2 ** (attemptCount - 1) * 1_000, 10_000)

const defaultWsDelay = (attemptCount: number) =>
  Math.min(0.3 * 2 ** (attemptCount - 1) * 1_000, 2_000)

const defaultOptions: InternalGladiaClientOptions = {
  apiKey: getEnv('GLADIA_API_KEY'),
  apiUrl: getEnv('GLADIA_API_URL', 'https://api.gladia.io'),
  region: getEnv<Required<GladiaClientOptions>['region']>('GLADIA_REGION'),
  httpHeaders: {
    'X-GLADIA-ORIGIN': 'sdk/js',
  },
  httpRetry: {
    maxAttempts: 2,
    statusCodes: [408, 413, 429, [500, 599]],
    delay: defaultHttpDelay,
  },
  httpTimeout: 10_000,
  wsRetry: {
    maxAttemptsPerConnection: 5,
    closeCodes: [
      [1002, 4399],
      [4500, 9999],
    ],
    delay: defaultWsDelay,
    maxConnections: 0,
  },
  wsTimeout: 10_000,
}

/**
 * Gladia Client
 */
export class GladiaClient {
  private options: InternalGladiaClientOptions

  constructor(options?: GladiaClientOptions) {
    this.options = deepMergeObjects(defaultOptions, options)
  }

  liveV2(options?: GladiaClientOptions): LiveV2Client {
    const mergedOptions = deepMergeObjects(this.options, options)
    if (mergedOptions.apiKey) {
      mergedOptions.httpHeaders = deepMergeObjects(mergedOptions.httpHeaders, {
        'X-GLADIA-KEY': mergedOptions.apiKey,
      })
    }
    assertValidOptions(mergedOptions)
    return new LiveV2Client(mergedOptions)
  }
}
