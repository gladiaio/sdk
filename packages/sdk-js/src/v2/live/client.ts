import { InternalGladiaClientOptions } from '../../internal_types.js'
import { HttpClient } from '../../network/httpClient.js'
import { WebSocketClient } from '../../network/wsClient.js'
import type { LiveV2InitRequest } from './generated-types.js'
import { LiveV2Session } from './session.js'

/**
 * Client used to interact with Gladia Live Speech-To-Text API.
 */
export class LiveV2Client {
  private httpClient: HttpClient
  private webSocketClient: WebSocketClient

  constructor(options: InternalGladiaClientOptions) {
    const httpBaseUrl = new URL(options.apiUrl)
    httpBaseUrl.protocol = httpBaseUrl.protocol.replace(/^ws/, 'http')
    this.httpClient = new HttpClient({
      baseUrl: httpBaseUrl,
      headers: options.httpHeaders,
      ...(options.region ? { queryParams: { region: options.region } } : {}),
      retry: options.httpRetry,
      timeout: options.httpTimeout,
    })

    const wsBaseUrl = new URL(options.apiUrl)
    wsBaseUrl.protocol = wsBaseUrl.protocol.replace(/^http/, 'ws')
    this.webSocketClient = new WebSocketClient({
      baseUrl: wsBaseUrl,
      retry: options.wsRetry,
      timeout: options.wsTimeout,
    })
  }

  startSession(options: LiveV2InitRequest): LiveV2Session {
    return new LiveV2Session({
      options,
      httpClient: this.httpClient,
      webSocketClient: this.webSocketClient,
    })
  }
}
