import { EventEmitter } from 'eventemitter3'
import { HttpClient } from '../../network/httpClient.js'
import { WebSocketClient, WebSocketSession } from '../../network/webSocketClient.js'
import { LiveV2EventEmitter } from './generated-eventemitter.js'
import type {
  LiveV2InitRequest,
  LiveV2InitResponse,
  LiveV2StartSessionMessage,
  LiveV2WebSocketMessage,
} from './generated-types.js'

function toUint8Array(
  audio: ArrayBufferLike | Buffer<ArrayBufferLike> | ArrayLike<number>
): Uint8Array {
  if (audio instanceof SharedArrayBuffer) {
    return new Uint8Array(audio)
  }
  return new Uint8Array(audio)
}

function concatArrayBuffer(buffer1?: Uint8Array | null, buffer2?: Uint8Array | null): Uint8Array {
  const newBuffer = new Uint8Array((buffer1?.byteLength ?? 0) + (buffer2?.byteLength ?? 0))
  if (buffer1) {
    newBuffer.set(new Uint8Array(buffer1), 0)
  }
  if (buffer2) {
    newBuffer.set(new Uint8Array(buffer2), buffer1?.byteLength ?? 0)
  }
  return newBuffer
}

export class LiveV2Session implements LiveV2EventEmitter {
  private sessionOptions: LiveV2InitRequest
  private httpClient: HttpClient
  private webSocketClient: WebSocketClient

  private initSessionPromise: Promise<LiveV2InitResponse>
  private webSocketSession: WebSocketSession | null = null

  private eventEmitter: EventEmitter | null = new EventEmitter()
  private bytesSent = 0
  private audioBuffer: Uint8Array | null = null

  private status: 'init' | 'created' | 'stopped' | 'destroyed' = 'init'

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

    this.initSessionPromise = this.createSession()
    this.initSessionPromise.then((session) => {
      if (this.status === 'init') {
        this.status = 'created'
      }

      if (this.sessionOptions.messages_config?.receive_lifecycle_events) {
        const startSessionMessage: LiveV2StartSessionMessage = {
          type: 'start_session',
          session_id: session.id,
          created_at: session.created_at,
        }
        this.emit('start_session', startSessionMessage)
        this.emit('message', startSessionMessage)
      }

      return this.resumeWebsocket()
    })
  }

  on(type: LiveV2WebSocketMessage['type'] | 'message' | 'error', cb: (event: any) => void): this {
    this.eventEmitter?.on(type, cb)
    return this
  }

  once(type: LiveV2WebSocketMessage['type'] | 'message' | 'error', cb: (event: any) => void): this {
    this.eventEmitter?.once(type, cb)
    return this
  }

  off(type: LiveV2WebSocketMessage['type'] | 'message' | 'error', cb?: (event: any) => void): this {
    this.eventEmitter?.off(type, cb)
    return this
  }

  addListener(
    type: LiveV2WebSocketMessage['type'] | 'message' | 'error',
    cb: (event: any) => void
  ): this {
    this.eventEmitter?.addListener(type, cb)
    return this
  }

  removeListener(
    type: LiveV2WebSocketMessage['type'] | 'message' | 'error',
    cb?: (event: any) => void
  ): this {
    this.eventEmitter?.removeListener(type, cb)
    return this
  }

  removeAllListeners(): this {
    this.eventEmitter?.removeAllListeners()
    return this
  }

  emit(type: LiveV2WebSocketMessage['type'] | 'message' | 'error', ...params: any[]): this {
    this.eventEmitter?.emit(type, ...params)
    return this
  }

  async getSessionId(): Promise<string> {
    const { id } = await this.initSessionPromise
    return id
  }

  sendAudio(audio: ArrayBufferLike | Buffer<ArrayBufferLike> | ArrayLike<number>): void {
    if (this.status === 'destroyed') {
      // throw new Error(`The session stopped, you can no longer send audio.`)
      return
    }
    if (this.status === 'stopped') {
      // throw new Error(`The session is stopping, you can no longer send audio.`)
      return
    }

    // TODO check if it has a wav header.
    // If it does, check with config and remove it

    const audioArray = toUint8Array(audio)
    this.audioBuffer = concatArrayBuffer(this.audioBuffer, audioArray)

    if (this.webSocketSession?.currentStatus === 'open') {
      this.webSocketSession?.send(audioArray)
    }
  }

  stop(): void {
    if (this.status === 'destroyed') {
      // throw new Error(`The session stopped.`)
      return
    }
    if (this.status === 'stopped') {
      // throw new Error(`The session is already stopping.`)
      return
    }

    this.status = 'stopped'

    // TODO force a timeout if ws connection is not ready to destroy the client
    // TODO buffer the message
    if (this.webSocketSession?.currentStatus === 'open') {
      this.webSocketSession?.send(JSON.stringify({ type: 'stop_recording' }))
    }
  }

  destroy(): void {
    if (this.status === 'destroyed') {
      // throw new Error(`The session stopped.`)
      return
    }

    if (this.status !== 'stopped') {
      this.stop()
    }

    this.status = 'destroyed'

    // TODO cancel pending connection

    this.audioBuffer = null

    this.removeAllListeners()
    this.eventEmitter = null

    // Close the WebSocket connection
    this.webSocketSession?.close(1000)
    this.webSocketSession?.destroy()
    this.webSocketSession = null
  }

  private async resumeWebsocket(): Promise<void> {
    const session = await this.initSessionPromise

    // Create a WebSocket session and bridge its events
    this.webSocketSession = this.webSocketClient.createSession(session.url)

    this.webSocketSession.on('open', () => {
      if (this.audioBuffer?.byteLength) {
        this.webSocketSession?.send(this.audioBuffer)
      }
    })

    this.webSocketSession.on('message', (data) => {
      const message = this.parseMessage(data.toString())
      this.emit(message.type, message)
      this.emit('message', message)
      if (message.type === 'audio_chunk') {
        if (message.acknowledged && message.data) {
          const byteEnd = message.data.byte_range[1]
          const slice = this.audioBuffer?.slice(byteEnd - this.bytesSent)
          this.audioBuffer = slice?.byteLength ? slice : null
          this.bytesSent = byteEnd
        }
      }
    })

    this.webSocketSession.on('close', (code, reason) => {
      if (code === 1000) {
        this.destroy()
      }
    })

    this.webSocketSession.on('error', (error) => {
      console.error('WebSocket error:', error)
      this.emit('error', error)
    })
  }

  private async createSession(): Promise<LiveV2InitResponse> {
    try {
      return await this.httpClient.post<LiveV2InitResponse>(`/v2/live`, {
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
      this.emit('error', error)
      this.destroy()
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
}
