export const WS_STATES = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const

export type ErrorEvent = Error
export type CloseEvent = {
  /**
   * Returns the WebSocket connection close code provided by the server.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/CloseEvent/code)
   */
  readonly code: number
  /**
   * Returns the WebSocket connection close reason provided by the server.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/CloseEvent/reason)
   */
  readonly reason: string
}
export type MessageEvent = {
  data: string | ArrayBuffer
}

export interface IsoWS {
  readonly url: string
  readonly readyState:
    | typeof WS_STATES.CONNECTING
    | typeof WS_STATES.OPEN
    | typeof WS_STATES.CLOSING
    | typeof WS_STATES.CLOSED
  onopen: (() => void) | null
  onerror: ((error: ErrorEvent) => void) | null
  onclose: ((event: CloseEvent) => void) | null
  onmessage: ((event: MessageEvent) => void) | null
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void
  close(code: number): void
}

function getNativeWebSocket() {
  if (typeof WebSocket !== 'undefined') {
    return WebSocket
  }
  if (typeof global !== 'undefined' && typeof global.WebSocket !== 'undefined') {
    return global.WebSocket
  }
  if (typeof globalThis !== 'undefined' && typeof globalThis.WebSocket !== 'undefined') {
    return globalThis.WebSocket
  }
  // @ts-expect-error unknown variable in NodeJS but can be defined in other environment
  if (typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined') {
    // @ts-expect-error unknown variable in NodeJS but can be defined in other environment
    return window.WebSocket
  }
  // @ts-expect-error unknown variable in NodeJS but can be defined in other environment
  if (typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined') {
    // @ts-expect-error unknown variable in NodeJS but can be defined in other environment
    return window.WebSocket
  }
  // @ts-expect-error unknown variable in NodeJS but can be defined in other environment
  if (typeof self !== 'undefined' && typeof self.WebSocket !== 'undefined') {
    // @ts-expect-error unknown variable in NodeJS but can be defined in other environment
    return self.WebSocket
  }
}

export async function newWebSocket(url: string | URL): Promise<IsoWS> {
  let WS: any
  try {
    WS = getNativeWebSocket() ?? (await import('ws')).WebSocket
  } catch {
    // noop
  }
  if (!WS) {
    throw new Error(
      'WebSocket is not supported in this environment and the `ws` package is not installed'
    )
  }
  return new WS(url)
}
