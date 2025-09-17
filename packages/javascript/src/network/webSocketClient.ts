import { sleep } from '../helpers.js'
import type { WebSocketRetryOptions } from '../types.js'
import { newWebSocket, WS_STATES, type IsoWS } from './iso-ws.js'

export { WS_STATES } from './iso-ws.js'

export type WebSocketClientOptions = {
  baseUrl: string | URL
  retry: Required<WebSocketRetryOptions>
  timeout: number
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

function removeWsListeners(ws?: IsoWS | null): void {
  if (!ws) {
    return
  }

  ws.onopen = null
  ws.onerror = null
  ws.onmessage = null
  ws.onclose = null
}

export class WebSocketClient {
  private readonly baseUrl: string | URL
  private readonly retry: Required<WebSocketRetryOptions>
  private readonly timeout: number

  constructor(options: WebSocketClientOptions) {
    this.baseUrl = options.baseUrl
    this.retry = options.retry
    this.timeout = options.timeout

    // Ensure maxAttemptsPerConnection, maxDelay, maxConnections and timeout are non-negative integers
    this.retry.maxAttemptsPerConnection = Math.max(
      0,
      Math.floor(this.retry.maxAttemptsPerConnection)
    )
    this.retry.maxDelay = Math.max(0, Math.floor(this.retry.maxDelay))
    this.retry.maxConnections = Math.max(0, Math.floor(this.retry.maxConnections))
    this.timeout = Math.max(0, Math.floor(this.timeout))
  }

  createSession(url: string): WebSocketSession {
    return new WebSocketSession({
      retry: this.retry,
      timeout: this.timeout,
      url: new URL(url, this.baseUrl),
    })
  }
}

class WebSocketSession implements Omit<IsoWS, 'onopen'> {
  onconnecting: ((event: { connection: number; attempt: number }) => void) | null = null
  onopen: ((event: { connection: number; attempt: number }) => void) | null = null
  onerror: IsoWS['onerror'] = null
  onclose: IsoWS['onclose'] = null
  onmessage: IsoWS['onmessage'] = null

  private _readyState: IsoWS['readyState'] = WS_STATES.CONNECTING
  private _url: IsoWS['url']
  private readonly retry: Required<WebSocketRetryOptions>
  private readonly timeout: number

  private ws: IsoWS | null = null
  private connectionCount = 0
  private connectionAttempt = 0
  private connectionTimeoutId: ReturnType<typeof setTimeout> | undefined

  constructor({
    retry,
    timeout,
    url,
  }: {
    retry: Required<WebSocketRetryOptions>
    timeout: number
    url: string | URL
  }) {
    this._url = url.toString()

    this.retry = retry
    this.timeout = timeout

    this.connect().catch(() => {
      // errors are emitted via event handlers; no throw
    })
  }

  get readyState(): IsoWS['readyState'] {
    return this._readyState
  }

  get url(): IsoWS['url'] {
    return this._url
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.readyState === WS_STATES.OPEN) {
      if (!this.ws) {
        throw new Error('readyState is open but ws is not initialized')
      }
      this.ws.send(data)
    } else {
      throw new Error('WebSocket is not open')
    }
  }

  close(code = 1000, reason = ''): void {
    if (this.readyState === WS_STATES.CLOSING || this.readyState === WS_STATES.CLOSED) {
      return
    }

    this.clearConnectionTimeout()
    this._readyState = WS_STATES.CLOSING

    if (this.ws?.readyState === WS_STATES.OPEN) {
      this.ws.close(code)
    } /* if (this.readyState === WS_STATES.CONNECTING) */ else {
      this.onWsClose(code, reason)
    }
  }

  private onWsClose(code = 1000, reason = ''): void {
    this.clearConnectionTimeout()

    if (this.readyState !== WS_STATES.CLOSED) {
      this._readyState = WS_STATES.CLOSED
      this.onclose?.({ code, reason })
    }

    this.onconnecting = null
    this.onopen = null
    this.onclose = null
    this.onerror = null
    this.onmessage = null

    removeWsListeners(this.ws)
    this.ws = null
  }

  private async connect(isRetry = false): Promise<void> {
    this.clearConnectionTimeout()

    if (!isRetry) {
      this.connectionCount += 1
      this.connectionAttempt = 0
    }
    this.connectionAttempt += 1
    this._readyState = WS_STATES.CONNECTING
    this.onconnecting?.({ connection: this.connectionCount, attempt: this.connectionAttempt })

    if (this.timeout > 0) {
      this.connectionTimeoutId = setTimeout(() => {
        this.close(3008, 'WebSocket connection timeout')
      }, this.timeout)
    }

    const onError = async (ws: IsoWS | null, err?: Error) => {
      this.clearConnectionTimeout()
      removeWsListeners(ws)

      if (this.readyState !== WS_STATES.CONNECTING) {
        return
      }

      const noRetry =
        this.retry.maxAttemptsPerConnection > 0 &&
        this.connectionAttempt >= this.retry.maxAttemptsPerConnection
      if (noRetry) {
        this.onerror?.(new Error('WebSocket connection error', { cause: err }))
        this.close(1006, 'WebSocket connection error')
        return
      }

      const delayMs = Math.min(this.retry.delay(this.connectionAttempt), this.retry.maxDelay)
      await sleep(delayMs)
      if (this.readyState === WS_STATES.CONNECTING) {
        this.connect(true)
      }
    }

    let ws: IsoWS
    try {
      ws = await newWebSocket(this.url)
    } catch (err) {
      onError(null, err instanceof Error ? err : new Error(String(err)))
      return
    }

    if (this.readyState !== WS_STATES.CONNECTING) {
      ws.close(1001)
      return
    }

    ws.onerror = () => onError(ws)
    ws.onopen = () => {
      this.clearConnectionTimeout()
      removeWsListeners(ws)

      if (this.readyState !== WS_STATES.CONNECTING) {
        // User closed the connection during the connection attempt
        ws.close(1001)
        return
      }

      ws.onmessage = (event) => {
        this.onmessage?.(event)
      }
      ws.onclose = (event) => {
        removeWsListeners(ws)

        if (this.ws !== ws) {
          // Should not be possible ?
          return
        }

        this.ws = null

        if (this.readyState === WS_STATES.CLOSING) {
          this.onWsClose(event.code, event.reason || '')
          return
        }

        if (
          (this.retry.maxConnections > 0 && this.connectionCount >= this.retry.maxConnections) ||
          !matchesCloseCode(event.code, this.retry.closeCodes)
        ) {
          this.close(event.code, event.reason || '')
          return
        }

        this.connect()
      }

      this.ws = ws
      this._readyState = WS_STATES.OPEN
      this.onopen?.({ connection: this.connectionCount, attempt: this.connectionAttempt })
    }
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId)
      this.connectionTimeoutId = undefined
    }
  }
}

export type { WebSocketSession }
