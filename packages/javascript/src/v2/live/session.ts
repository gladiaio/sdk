import { EventEmitter } from 'eventemitter3'
import { concatArrayBuffer, toUint8Array } from '../../helpers.js'
import { HttpClient } from '../../network/httpClient.js'
import { WebSocketClient, WebSocketSession, WS_STATES } from '../../network/wsClient.js'
import type {
  LiveV2InitRequest,
  LiveV2InitResponse,
  LiveV2StartSessionMessage,
  LiveV2WebSocketMessage,
} from './generated-types.js'
import { LiveV2SessionStatus } from './types.js'

type EventMap = {
  started: [message: LiveV2InitResponse]
  connecting: [message: { attempt: number }]
  connected: [message: { attempt: number }]
  ending: [message: { code: number; reason?: string }]
  ended: [message: { code: number; reason?: string }]
  message: [message: LiveV2WebSocketMessage]
  error: [error: Error]
}

export class LiveV2Session {
  private sessionOptions: LiveV2InitRequest
  private httpClient: HttpClient
  private webSocketClient: WebSocketClient

  private abortController: AbortController = new AbortController()
  private initSessionPromise: Promise<LiveV2InitResponse>
  private initSession: LiveV2InitResponse | null = null
  private webSocketSession: WebSocketSession | null = null

  private eventEmitter: EventEmitter | null = new EventEmitter()
  private bytesSent = 0
  private audioBuffer: Uint8Array | null = null

  private _status: LiveV2SessionStatus = 'starting'

  constructor({
    options,
    httpClient,
    webSocketClient,
  }: {
    options: LiveV2InitRequest
    httpClient: HttpClient
    webSocketClient: WebSocketClient
  }) {
    this.sessionOptions = options
    this.httpClient = httpClient
    this.webSocketClient = webSocketClient
    this.abortController = new AbortController()

    this.initSessionPromise = this.startSession()
    this.initSessionPromise.then((session) => {
      this.initSession = session

      if (this.abortController.signal.aborted) {
        return
      }

      if (this._status === 'starting') {
        this._status = 'started'
        this.emit('started', session)
      }

      if (this.sessionOptions.messages_config?.receive_lifecycle_events) {
        const startSessionMessage: LiveV2StartSessionMessage = {
          type: 'start_session',
          session_id: session.id,
          created_at: session.created_at,
        }
        this.emit('message', startSessionMessage)
      }

      return this.connectToWebSocket(session)
    })
  }

  /**
   * Get the session id. The promise is resolved when the session is started.
   * @returns the session id
   */
  async getSessionId(): Promise<string> {
    const { id } = await this.initSessionPromise
    return id
  }

  /**
   * The session id or null if the session is not started yet.
   */
  get sessionId(): string | null {
    return this.initSession?.id ?? null
  }

  /**
   * The current status of the session.
   * - `starting`: the session is not started yet
   * - `started`: the session is started but not connected to the websocket
   * - `connecting`: the session is connecting to the websocket. If the connection is lost and it's retryable, the session will reconnect and the status will be `connecting` again.
   * - `connected`: the session is connected to the websocket.
   * - `ending`: the session is ending because of a user action or an error. In this status, sendAudio and stop are no-op.
   * - `ended`: the session is ended. In this status, sendAudio and stop are no-op and listeners are removed.
   */
  get status(): LiveV2SessionStatus {
    return this._status
  }

  /**
   * Send an audio chunk to the current live session.
   * If not connected, the audio will be buffered and sent when the session is connected.
   *
   * @param audio the audio chunk to send
   */
  sendAudio(audio: ArrayBufferLike | Buffer<ArrayBufferLike> | ArrayLike<number>): void {
    if (this._status === 'ended') {
      // throw new Error(`The session stopped, you can no longer send audio.`)
      return
    }
    if (this._status === 'ending') {
      // throw new Error(`The session is stopping, you can no longer send audio.`)
      return
    }

    // TODO check if it has a wav header.
    // If it does, check with config and remove it

    const audioArray = toUint8Array(audio)
    this.audioBuffer = concatArrayBuffer(this.audioBuffer, audioArray)

    if (this.webSocketSession?.readyState === WS_STATES.OPEN) {
      this.webSocketSession?.send(audioArray)
    }
  }

  /**
   * Stop the recording.
   * The session will process the remaining audio and emit the `ended` event when the post-processing is done.
   */
  stopRecording(): void {
    this.doStop(1000)
  }

  /**
   * Force the end of the session without waiting for the post-processing to be done.
   * `ending` and `ended` events are emitted, pending requests/connections are cancelled and listeners are removed.
   */
  endSession(): void {
    this.doDestroy(1000, 'Session ended by user')
  }

  private doStop(code = 1006, reason?: string): void {
    if (this._status === 'ended') {
      // no-op
      return
    }
    if (this._status === 'ending') {
      // no-op
      return
    }

    this._status = 'ending'
    this.emit('ending', { code, reason })

    if (this.webSocketSession?.readyState === WS_STATES.OPEN) {
      this.webSocketSession?.send(JSON.stringify({ type: 'stop_recording' }))
    }
  }

  private doDestroy(code = 1006, reason?: string) {
    if (this._status === 'ended') {
      return
    }

    // Ending the session
    this.doStop(code, reason)

    // Session ended
    this._status = 'ended'
    this.emit('ended', { code, reason })

    // Cancel pending connection
    this.abortController.abort()

    this.audioBuffer = null

    this.removeAllListeners()
    this.eventEmitter = null
  }

  private connectToWebSocket(session: LiveV2InitResponse): void {
    if (this.abortController.signal.aborted) {
      return
    }

    // Create a WebSocket session and bridge its events
    const webSocketSession = this.webSocketClient.createSession(session.url)
    this.abortController.signal.addEventListener('abort', () => {
      this.webSocketSession = null
      webSocketSession.onconnecting = null
      webSocketSession.onopen = null
      webSocketSession.onmessage = null
      webSocketSession.onclose = null
      webSocketSession.onerror = null
      webSocketSession.close(1001, 'Aborted')
    })

    this.webSocketSession = webSocketSession

    this.webSocketSession.onconnecting = ({ connection }) => {
      this._status = 'connecting'
      this.emit('connecting', { attempt: connection })
    }

    this.webSocketSession.onopen = ({ connection }) => {
      if (this.audioBuffer?.byteLength) {
        webSocketSession.send(this.audioBuffer)
      }
      if (this.status === 'ending') {
        webSocketSession.send(JSON.stringify({ type: 'stop_recording' }))
        return
      }
      this._status = 'connected'
      this.emit('connected', { attempt: connection })
    }

    this.webSocketSession.onmessage = (event) => {
      const message = this.parseMessage(event.data.toString())

      // We forced the acknowledgment reception for resume so we must not emit them if user don't want them
      if (
        this.sessionOptions.messages_config?.receive_acknowledgments ||
        !('acknowledged' in message)
      ) {
        this.emit('message', message)
      }

      if (message.type === 'audio_chunk') {
        if (message.acknowledged && message.data) {
          const byteEnd = message.data.byte_range[1]
          const slice = this.audioBuffer?.slice(byteEnd - this.bytesSent)
          this.audioBuffer = slice?.byteLength ? slice : null
          this.bytesSent = byteEnd
        }
      }
    }

    this.webSocketSession.onclose = ({ code, reason }) => {
      this.doDestroy(code, reason)
    }

    this.webSocketSession.onerror = (error) => {
      this.emit('error', error)
    }
  }

  private async startSession(): Promise<LiveV2InitResponse> {
    try {
      return await this.httpClient.post<LiveV2InitResponse>(`/v2/live`, {
        signal: this.abortController.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...this.sessionOptions,
          messages_config: {
            ...this.sessionOptions.messages_config,
            // Force ack reception for resume
            receive_acknowledgments: true,
          },
        } satisfies LiveV2InitRequest),
      })
    } catch (error) {
      if (!this.abortController.signal.aborted) {
        this.emit(
          'error',
          error instanceof Error
            ? error
            : new Error(`Error creating session: ${error}`, { cause: error })
        )
        this.doDestroy(1006, `Couldn't start a new session`)
      }
      throw error
    }
  }

  private parseMessage(data: string): LiveV2WebSocketMessage {
    let message: unknown
    try {
      message = JSON.parse(data)
    } catch (err) {
      throw new Error(`Invalid message received: ${data}`, { cause: err })
    }
    if (!message || typeof message !== 'object' || !('type' in message)) {
      throw new Error(`Invalid message received: ${data}`)
    }
    return message as LiveV2WebSocketMessage
  }

  // #### Listeners ####

  on(type: 'started', cb: (...args: EventMap['started']) => void): this
  on(type: 'connecting', cb: (...args: EventMap['connecting']) => void): this
  on(type: 'connected', cb: (...args: EventMap['connected']) => void): this
  on(type: 'ending', cb: (...args: EventMap['ending']) => void): this
  on(type: 'ended', cb: (...args: EventMap['ended']) => void): this
  on(type: 'message', cb: (...args: EventMap['message']) => void): this
  on(type: 'error', cb: (...args: EventMap['error']) => void): this
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- overload, cannot avoid any
  on(type: keyof EventMap, cb: (event: any) => void): this {
    this.eventEmitter?.on(type, cb)
    return this
  }

  once(type: 'started', cb: (...args: EventMap['started']) => void): this
  once(type: 'connecting', cb: (...args: EventMap['connecting']) => void): this
  once(type: 'connected', cb: (...args: EventMap['connected']) => void): this
  once(type: 'ending', cb: (...args: EventMap['ending']) => void): this
  once(type: 'ended', cb: (...args: EventMap['ended']) => void): this
  once(type: 'message', cb: (...args: EventMap['message']) => void): this
  once(type: 'error', cb: (...args: EventMap['error']) => void): this
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- overload, cannot avoid any
  once(type: keyof EventMap, cb: (event: any) => void): this {
    this.eventEmitter?.once(type, cb)
    return this
  }

  off(type: 'started', cb?: (...args: EventMap['started']) => void): this
  off(type: 'connecting', cb?: (...args: EventMap['connecting']) => void): this
  off(type: 'connected', cb?: (...args: EventMap['connected']) => void): this
  off(type: 'ending', cb?: (...args: EventMap['ending']) => void): this
  off(type: 'ended', cb?: (...args: EventMap['ended']) => void): this
  off(type: 'message', cb?: (...args: EventMap['message']) => void): this
  off(type: 'error', cb?: (...args: EventMap['error']) => void): this
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- overload, cannot avoid any
  off(type: keyof EventMap, cb?: (event: any) => void): this {
    this.eventEmitter?.off(type, cb)
    return this
  }

  addListener(type: 'started', cb: (...args: EventMap['started']) => void): this
  addListener(type: 'connecting', cb: (...args: EventMap['connecting']) => void): this
  addListener(type: 'connected', cb: (...args: EventMap['connected']) => void): this
  addListener(type: 'ending', cb: (...args: EventMap['ending']) => void): this
  addListener(type: 'ended', cb: (...args: EventMap['ended']) => void): this
  addListener(type: 'message', cb: (...args: EventMap['message']) => void): this
  addListener(type: 'error', cb: (...args: EventMap['error']) => void): this
  addListener(
    type: keyof EventMap,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- overload, cannot avoid any
    cb: (event: any) => void
  ): this {
    this.eventEmitter?.addListener(type, cb)
    return this
  }

  removeListener(type: 'started', cb?: (...args: EventMap['started']) => void): this
  removeListener(type: 'connecting', cb?: (...args: EventMap['connecting']) => void): this
  removeListener(type: 'connected', cb?: (...args: EventMap['connected']) => void): this
  removeListener(type: 'ending', cb?: (...args: EventMap['ending']) => void): this
  removeListener(type: 'ended', cb?: (...args: EventMap['ended']) => void): this
  removeListener(type: 'message', cb?: (...args: EventMap['message']) => void): this
  removeListener(type: 'error', cb?: (...args: EventMap['error']) => void): this
  removeListener(
    type: keyof EventMap,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- overload, cannot avoid any
    cb?: (event: any) => void
  ): this {
    this.eventEmitter?.removeListener(type, cb)
    return this
  }

  removeAllListeners(): this {
    this.eventEmitter?.removeAllListeners()
    return this
  }

  private emit(type: 'started', ...args: EventMap['started']): void
  private emit(type: 'connecting', ...args: EventMap['connecting']): void
  private emit(type: 'connected', ...args: EventMap['connected']): void
  private emit(type: 'ending', ...args: EventMap['ending']): void
  private emit(type: 'ended', ...args: EventMap['ended']): void
  private emit(type: 'message', ...args: EventMap['message']): void
  private emit(type: 'error', ...args: EventMap['error']): void
  private emit(
    type: keyof EventMap,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- overload, cannot avoid any
    ...args: any[]
  ): void {
    this.eventEmitter?.emit(type, ...args)
  }
}
