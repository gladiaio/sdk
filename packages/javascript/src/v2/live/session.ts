import { EventEmitter } from 'eventemitter3'
import { HttpClient } from '../../httpClient.js'
import { newWebSocket, type IsoWS } from '../../iso-ws.js'
import { LiveV2EventEmitter } from './generated-eventemitter.js'
import type {
  LiveV2InitRequest,
  LiveV2InitResponse,
  LiveV2WebSocketMessage,
} from './generated-types.js'

function concatArrayBuffer(
  buffer1?: ArrayBufferLike | null,
  buffer2?: ArrayBufferLike | null
): ArrayBuffer {
  const newBuffer = new Uint8Array((buffer1?.byteLength ?? 0) + (buffer2?.byteLength ?? 0))
  if (buffer1?.byteLength) {
    newBuffer.set(new Uint8Array(buffer1), 0)
  }
  if (buffer2?.byteLength) {
    newBuffer.set(new Uint8Array(buffer2), buffer1?.byteLength ?? 0)
  }
  return newBuffer.buffer
}

export class LiveV2Session implements LiveV2EventEmitter {
  private sessionOptions: LiveV2InitRequest
  private httpClient: HttpClient

  private initSessionPromise: Promise<LiveV2InitResponse>
  private ws?: IsoWS | null
  private bytesSent = 0
  private audioBuffer: ArrayBuffer | null = null
  private eventEmitter: EventEmitter | null = new EventEmitter()

  private status: 'init' | 'created' | 'stopped' | 'destroyed' = 'init'

  constructor({ options, httpClient }: { options: LiveV2InitRequest; httpClient: HttpClient }) {
    this.sessionOptions = options
    this.httpClient = httpClient

    this.initSessionPromise = this.createSession()
    this.initSessionPromise.then((session) => {
      if (this.status === 'init') {
        this.status = 'created'
      }

      if (this.sessionOptions.messages_config?.receive_lifecycle_events) {
        this.emit('start_session', {
          type: 'start_session',
          session_id: session.id,
          created_at: session.created_at,
        })
      }

      return this.resumeWebsocket()
    })
  }

  on(type: LiveV2WebSocketMessage['type'] | 'error', cb: (event: any) => void): this {
    this.eventEmitter?.on(type, cb)
    return this
  }

  once(type: LiveV2WebSocketMessage['type'] | 'error', cb: (event: any) => void): this {
    this.eventEmitter?.once(type, cb)
    return this
  }

  off(type: LiveV2WebSocketMessage['type'] | 'error', cb?: (event: any) => void): this {
    this.eventEmitter?.off(type, cb)
    return this
  }

  addListener(type: LiveV2WebSocketMessage['type'] | 'error', cb: (event: any) => void): this {
    this.eventEmitter?.addListener(type, cb)
    return this
  }

  removeListener(type: LiveV2WebSocketMessage['type'] | 'error', cb?: (event: any) => void): this {
    this.eventEmitter?.removeListener(type, cb)
    return this
  }

  removeAllListeners(): this {
    this.eventEmitter?.removeAllListeners()
    return this
  }

  emit(type: LiveV2WebSocketMessage['type'] | 'error', ...params: any[]): this {
    this.eventEmitter?.emit(type, ...params)
    return this
  }

  async getSessionId(): Promise<string> {
    const { id } = await this.initSessionPromise
    return id
  }

  sendAudio(audio: ArrayBufferLike): void {
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

    this.audioBuffer = concatArrayBuffer(this.audioBuffer, audio)
    this.ws?.send(audio)
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
    this.ws?.send(JSON.stringify({ type: 'stop_recording' }))
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

    if (this.ws) {
      this.ws.onclose = null
      this.ws.onerror = null
      this.ws.onmessage = null
      this.ws.onopen = null
      // if connecting or opened, close the ws
      if (this.ws.readyState < 2) {
        this.ws.close(1000)
      }
    }
  }

  private async resumeWebsocket(): Promise<void> {
    const session = await this.initSessionPromise
    this.ws = await this.initWebSocket(session)
    if (this.audioBuffer?.byteLength) {
      this.ws.send(this.audioBuffer)
    }
    this.ws.onmessage = (evt) => {
      const message = this.parseMessage(evt.data.toString())
      this.emit(message.type, message)
      if (message.type === 'audio_chunk') {
        if (message.acknowledged && message.data) {
          const byteEnd = message.data.byte_range[1]
          const slice = this.audioBuffer?.slice(byteEnd - this.bytesSent)
          this.audioBuffer = slice?.byteLength ? slice : null
          this.bytesSent = byteEnd
        }
      }
    }
    this.ws.onclose = (evt) => {
      // TODO
      console.log(`[${evt.code}] WS closed${evt.reason ? `: ${evt.reason}` : ''}`)
      if (evt.code === 1000) {
        this.destroy()
      }
    }
  }

  private async createSession(): Promise<LiveV2InitResponse> {
    const response = await this.httpClient.post(`/v2/live`, {
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
    if (!response.ok) {
      console.error(`${response.status}: ${(await response.text()) || response.statusText}`)
      process.exit(response.status)
    }

    return (await response.json()) as LiveV2InitResponse
  }

  private async initWebSocket({ url }: LiveV2InitResponse): Promise<IsoWS> {
    try {
      const ws = await newWebSocket(url)
      let resolve: () => void
      let reject: (reason?: any) => void
      const promise = new Promise<void>((res, rej) => {
        resolve = res
        reject = rej
      })
      ws.onopen = () => {
        ws.onopen = null
        ws.onerror = null
        resolve()
      }
      ws.onerror = (event) => {
        ws.onopen = null
        ws.onerror = null
        reject(event.error)
      }
      await promise
      return ws
    } catch (err: unknown) {
      throw new Error(`Couldn't connect to ws url: ${url}`, { cause: err })
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
