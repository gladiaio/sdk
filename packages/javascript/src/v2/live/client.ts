import { HttpClient } from '../../httpClient.js'
import { WebSocketClient } from '../../webSocketClient.js'
import type { LiveV2InitRequest } from './generated-types.js'
import { LiveV2Session as BaseLiveV2Session } from './session.js'
import type { LiveV2ClientOptions, LiveV2Session } from './types.js'

/**
 * Client used to interact with Gladia Live Speech-To-Text API.
 */
export class LiveV2Client {
  private httpClient: HttpClient
  private webSocketClient: WebSocketClient

  constructor(options: LiveV2ClientOptions) {
    this.httpClient = new HttpClient({
      baseUrl: options.apiUrl,
      headers: options.httpHeaders,
      ...(options.region ? { queryParams: { region: options.region } } : {}),
      retry: options.httpRetry,
      timeout: options.httpTimeout,
    })

    this.webSocketClient = new WebSocketClient({
      baseUrl: options.apiUrl,
      webSocketRetry: options.webSocketRetry,
      webSocketTimeout: options.webSocketTimeout,
    })
  }

  newSession(options: LiveV2InitRequest): LiveV2Session {
    return new BaseLiveV2Session({
      options,
      httpClient: this.httpClient,
      webSocketClient: this.webSocketClient,
    })
  }
}
