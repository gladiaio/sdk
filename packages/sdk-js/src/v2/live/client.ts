import { InternalGladiaClientOptions } from '../../internal_types.js'
import { HttpClient } from '../../network/httpClient.js'
import { WebSocketClient } from '../../network/wsClient.js'
import type { QueryParams, Region } from '../../types.js'
import type { LiveV2InitRequest, LiveV2InitResponse, LiveV2Response } from './generated-types.js'
import { LiveV2Session } from './session.js'
import type { LiveV2ConnectSessionOptions } from './types.js'

/**
 * Client used to interact with Gladia Live Speech-To-Text API.
 */
export class LiveV2Client {
  private httpClient: HttpClient
  private webSocketClient: WebSocketClient
  private readonly liveTimeouts: InternalGladiaClientOptions['liveTimeouts']
  private readonly region?: Region

  constructor(options: InternalGladiaClientOptions) {
    const httpBaseUrl = new URL(options.apiUrl)
    httpBaseUrl.protocol = httpBaseUrl.protocol.replace(/^ws/, 'http')
    this.liveTimeouts = options.liveTimeouts
    this.region = options.region
    const queryParams: QueryParams = {}
    this.httpClient = new HttpClient({
      baseUrl: httpBaseUrl,
      headers: options.httpHeaders,
      queryParams,
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
      region: this.region,
      httpClient: this.httpClient,
      webSocketClient: this.webSocketClient,
    })
  }

  /**
   * Connect to an existing live session using its WebSocket URL and session ID.
   * Skips session initialization and connects directly to the WebSocket.
   */
  connectSession(connectOptions: LiveV2ConnectSessionOptions): LiveV2Session {
    const existingSession: LiveV2InitResponse = {
      id: connectOptions.id,
      url: connectOptions.url,
      created_at: connectOptions.created_at ?? '',
    }
    return new LiveV2Session({
      options: { messages_config: connectOptions.messages_config },
      existingSession,
      httpClient: this.httpClient,
      webSocketClient: this.webSocketClient,
    })
  }

  /**
   * Get a live job by ID.
   *
   * @param jobId - The UUID of the live job.
   * @returns The full job response including status and result if done.
   */
  async get(jobId: string): Promise<LiveV2Response> {
    return this.httpClient.get<LiveV2Response>(`/v2/live/${jobId}`, {
      requestTimeout: this.liveTimeouts.get,
    })
  }

  /**
   * Delete a live job.
   *
   * @param jobId - The UUID of the live job to delete.
   * @returns `true` if the job was deleted successfully (HTTP 202), `false` if the server responded with another 2xx status.
   * @throws When the server responds with an error HTTP status (e.g. 404).
   */
  async delete(jobId: string): Promise<boolean> {
    const response = await this.httpClient.delete<Response>(`/v2/live/${jobId}`, {
      rawResponse: true,
      requestTimeout: this.liveTimeouts.delete,
    })
    return response.status === 202
  }

  /**
   * Download the audio file for a live job.
   *
   * @param jobId - The UUID of the live job.
   * @returns The raw audio file as an `ArrayBuffer`.
   */
  async getFile(jobId: string): Promise<ArrayBuffer> {
    const response = await this.httpClient.get<Response>(`/v2/live/${jobId}/file`, {
      rawResponse: true,
      requestTimeout: this.liveTimeouts.getFile,
    })
    return response.arrayBuffer()
  }
}
