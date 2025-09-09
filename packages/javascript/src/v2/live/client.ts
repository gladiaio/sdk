import { HttpClient } from '../../httpClient.js'
import type { LiveV2InitRequest } from './generated-types.js'
import { LiveV2Session as BaseLiveV2Session } from './session.js'
import type { LiveV2ClientOptions, LiveV2Session } from './types.js'

/**
 * Client used to interact with Gladia Live Speech-To-Text API.
 */
export class LiveV2Client {
  private httpClient: HttpClient

  constructor(options: LiveV2ClientOptions) {
    this.httpClient = new HttpClient({
      baseUrl: options.apiUrl,
      headers: options.httpHeaders,
      httpRetry: options.httpRetry,
      httpTimeout: options.httpTimeout,
    })
  }

  newSession(options: LiveV2InitRequest): LiveV2Session {
    return new BaseLiveV2Session({
      options,
      httpClient: this.httpClient,
    })
  }
}
