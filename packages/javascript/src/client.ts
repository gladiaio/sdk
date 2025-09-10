import { mergeHeaders } from './helpers.js'
import { getEnv } from './iso-env.js'
import type { GladiaClientOptions } from './types.js'
import { LiveV2Client } from './v2/live/index.js'

function assertValidOptions(options: GladiaClientOptions & { apiUrl: string }) {
  let url: URL
  try {
    url = new URL(options.apiUrl)
  } catch {
    throw new Error(`Invalid url: "${options.apiUrl}".`)
  }

  if (!options?.apiKey && url.hostname.endsWith('.gladia.io')) {
    throw new Error(`You have to set your "apiKey" or define a proxy "apiUrl".`)
  }
}

/**
 * Gladia Client
 */
export class GladiaClient {
  private options?: GladiaClientOptions

  constructor(options?: GladiaClientOptions) {
    this.options = options
  }

  liveV2(options?: GladiaClientOptions): LiveV2Client {
    let opts = {
      apiKey: getEnv('GLADIA_API_KEY'),
      apiUrl: getEnv('GLADIA_API_URL', 'https://api.gladia.io'),
      region: getEnv<Required<GladiaClientOptions>['region']>('GLADIA_REGION'),
      httpTimeout: 10000,
      webSocketTimeout: 10000,
      ...this.options,
      ...options,
    } satisfies GladiaClientOptions

    opts = {
      ...opts,

      httpHeaders: mergeHeaders(
        {
          'X-GLADIA-ORIGIN': 'sdk/js',
          ...(opts.apiKey && {
            'X-GLADIA-KEY': opts.apiKey,
          }),
        },
        this.options?.httpHeaders,
        options?.httpHeaders
      ),
      httpRetry: {
        limit: 2,
        statusCodes: [408, 413, 429, [500, 599]],
        backoffLimit: 10000,
        delay: (attemptCount) => 0.3 * 2 ** (attemptCount - 1) * 1000,
        ...this.options?.httpRetry,
        ...options?.httpRetry,
      },
      webSocketRetry: {
        limit: 5,
        closeCodes: [
          [1002, 4399],
          [4500, 9999],
        ],
        backoffLimit: 2000,
        delay: (attemptCount) => 0.3 * 2 ** (attemptCount - 1) * 1000,
        ...this.options?.webSocketRetry,
        ...options?.webSocketRetry,
      },
    } satisfies GladiaClientOptions

    assertValidOptions(opts)
    return new LiveV2Client(opts)
  }
}
