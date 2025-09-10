import { EventEmitter } from 'eventemitter3'
import { newWebSocket, type IsoWS } from './iso-ws.js'
import type { WebSocketRetryOptions } from './types.js'

export type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed'

export type WebSocketClientOptions = {
  baseUrl: string
  webSocketRetry?: WebSocketRetryOptions
  webSocketTimeout?: number
}

export type WebSocketEventMap = {
  connecting: () => void
  open: () => void
  error: (error: Error) => void
  close: (code: number, reason: string) => void
  message: (data: string | ArrayBuffer) => void
}

function defaultRetry(): Required<WebSocketRetryOptions> {
  return {
    limit: 5,
    closeCodes: [
      [1002, 4399],
      [4500, 9999],
    ],
    backoffLimit: 2000,
    delay: (attemptCount: number) => 0.3 * 2 ** (attemptCount - 1) * 1000,
    limitConnections: 0,
  }
}

function matchesCloseCode(code: number, list: (number | [number, number])[]): boolean {
  for (const item of list) {
    if (typeof item === 'number') {
      if (code === item) return true
    } else {
      const [start, end] = item
      if (code >= start && code <= end) return true
    }
  }
  return false
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export class WebSocketSession extends EventEmitter<WebSocketEventMap> {
  private readonly retry: Required<WebSocketRetryOptions>
  private readonly timeout: number
  private readonly wsUrl: string | URL

  private ws: IsoWS | null = null
  private status: WebSocketStatus = 'closed'
  private connectionAttempts = 0
  private totalConnections = 0
  private timeoutId: ReturnType<typeof setTimeout> | undefined
  private isManualClose = false
  private hasOpened = false

  constructor({
    retry,
    timeout,
    url,
  }: {
    retry: Required<WebSocketRetryOptions>
    timeout: number
    url: string | URL
  }) {
    super()
    this.retry = retry
    this.timeout = timeout
    this.wsUrl = url
    // kick off connection on next microtask so listeners can be attached
    queueMicrotask(() => {
      this.connect().catch(() => {
        // errors are emitted via event handlers; no throw
      })
    })
  }

  get currentStatus(): WebSocketStatus {
    return this.status
  }

  private setStatus(newStatus: WebSocketStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus
      if (newStatus === 'connecting') {
        this.emit('connecting')
      } else if (newStatus === 'open') {
        this.emit('open')
      }
    }
  }

  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }
  }

  private async connect(): Promise<void> {
    if (this.status === 'connecting' || this.status === 'open') {
      return
    }

    this.isManualClose = false
    this.hasOpened = false
    this.setStatus('connecting')

    if (this.retry.limitConnections > 0 && this.totalConnections >= this.retry.limitConnections) {
      this.setStatus('closed')
      this.emit('error', new Error('Maximum connection limit reached'))
      return
    }

    this.connectionAttempts += 1
    this.totalConnections += 1

    try {
      // url is already a fully qualified URL
      this.ws = await newWebSocket(this.wsUrl)

      this.clearTimeout()
      if (this.timeout > 0) {
        this.timeoutId = setTimeout(() => {
          this.handleTimeout()
        }, this.timeout)
      }

      this.ws.onopen = () => {
        this.clearTimeout()
        this.setStatus('open')
        this.hasOpened = true
        this.connectionAttempts = 0
      }

      this.ws.onerror = () => {
        this.clearTimeout()
        this.setStatus('closed')
        this.emit('error', new Error('WebSocket connection error'))
        // Mimic native: emit close after error for failed connection attempt
        if (!this.hasOpened) {
          this.emit('close', 1006, '')
        }
        if (!this.hasOpened && !this.isManualClose) {
          const shouldRetry = this.retry.limit === 0 || this.connectionAttempts < this.retry.limit
          if (shouldRetry) {
            void this.scheduleReconnect()
          }
        }
      }

      this.ws.onclose = (event) => {
        this.clearTimeout()
        this.setStatus('closed')

        if (this.isManualClose) {
          this.emit('close', event.code, event.reason || '')
          return
        }

        // Decide if we should reconnect based on retry limit semantics
        const shouldReconnect = this.retry.limit === 0 || this.connectionAttempts < this.retry.limit
        const isRetryableCode = matchesCloseCode(event.code, this.retry.closeCodes)

        // Enforce reconnection limit on close first
        if (
          this.retry.limitConnections > 0 &&
          this.totalConnections >= this.retry.limitConnections
        ) {
          this.emit('close', event.code, event.reason || '')
          return
        }

        if (shouldReconnect && isRetryableCode) {
          void this.scheduleReconnect()
          return
        }

        this.emit('close', event.code, event.reason || '')
      }

      this.ws.onmessage = (event) => {
        this.emit('message', event.data as string | ArrayBuffer)
      }
    } catch (error) {
      this.clearTimeout()
      this.setStatus('closed')
      this.emit('error', error instanceof Error ? error : new Error(String(error)))
    }
  }

  private handleTimeout(): void {
    if (this.ws) {
      this.ws.close(1000)
    }
    this.setStatus('closed')
    this.emit('error', new Error('WebSocket connection timeout'))
  }

  private async scheduleReconnect(): Promise<void> {
    const delayMs = Math.min(this.retry.delay(this.connectionAttempts + 1), this.retry.backoffLimit)
    await sleep(delayMs)
    if (!this.isManualClose && this.status === 'closed') {
      await this.connect()
    }
  }

  send(data: string | ArrayBuffer): void {
    if (this.ws && this.status === 'open') {
      this.ws.send(data)
    } else {
      throw new Error('WebSocket is not open')
    }
  }

  close(code = 1000): void {
    this.isManualClose = true
    this.clearTimeout()
    if (this.ws) {
      this.setStatus('closing')
      this.ws.close(code)
    } else {
      this.setStatus('closed')
    }
  }

  destroy(): void {
    this.isManualClose = true
    this.clearTimeout()
    if (this.ws) {
      this.ws.close(1000)
      this.ws = null
    }
    this.setStatus('closed')
    this.removeAllListeners()
  }
}

export class WebSocketClient {
  private readonly baseUrl: string
  private readonly retry: Required<WebSocketRetryOptions>
  private readonly timeout: number

  constructor(options: WebSocketClientOptions) {
    this.baseUrl = options.baseUrl
    this.retry = { ...defaultRetry(), ...(options?.webSocketRetry ?? {}) }
    this.timeout = Math.max(0, Math.floor(options?.webSocketTimeout ?? 10_000))

    // sanitize
    this.retry.limit = Math.max(0, Math.floor(this.retry.limit))
    this.retry.backoffLimit = Math.max(0, Math.floor(this.retry.backoffLimit))
    this.retry.limitConnections = Math.max(0, Math.floor(this.retry.limitConnections))
  }

  createSession(url: string): WebSocketSession {
    return new WebSocketSession({
      retry: this.retry,
      timeout: this.timeout,
      url: new URL(url, this.baseUrl),
    })
  }
}
