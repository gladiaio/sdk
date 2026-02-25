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

  /**
   * Fetch a live session by ID.
   *
   * @param id - The ID of the live session.
   * @returns The session data.
   */
  async get(id: string): Promise<Record<string, unknown>> {
    return this.httpClient.get<Record<string, unknown>>(`/v2/live/${id}`)
  }

  /**
   * List live transcription sessions.
   *
   * @param limit - Optional maximum number of sessions to return (e.g. 20).
   * @returns The response containing the list of sessions.
   */
  async listTranscriptions(limit?: number): Promise<Record<string, unknown>> {
    const path = limit != null ? `/v2/live?limit=${limit}` : '/v2/live'
    return this.httpClient.get<Record<string, unknown>>(path)
  }

  /**
   * Download the file for a live session by ID.
   *
   * @param id - The ID of the live session.
   * @returns The raw file as an `ArrayBuffer`.
   */
  async download(id: string): Promise<ArrayBuffer> {
    const response = await this.httpClient.get<Response>(`/v2/live/${id}/file`)
    if (response instanceof Response) {
      return response.arrayBuffer()
    }
    throw new Error('Unexpected JSON response from file endpoint')
  }

  /**
   * Delete a live session by ID.
   *
   * @param id - The ID of the live session to delete.
   */
  async delete(id: string): Promise<void> {
    await this.httpClient.delete(`/v2/live/${id}`)
  }

  startSession(options: LiveV2InitRequest): LiveV2Session {
    return new LiveV2Session({
      options,
      httpClient: this.httpClient,
      webSocketClient: this.webSocketClient,
    })
  }
}
