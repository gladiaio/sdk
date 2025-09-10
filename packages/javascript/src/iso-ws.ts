export type IsoWS = {
  onopen: ((event: import('ws').Event) => void) | null
  onerror: ((event: import('ws').ErrorEvent) => void) | null
  onclose: ((event: import('ws').CloseEvent) => void) | null
  onmessage: ((event: import('ws').MessageEvent) => void) | null
  readonly readyState:
    | import('ws').WebSocket['CONNECTING']
    | import('ws').WebSocket['OPEN']
    | import('ws').WebSocket['CLOSING']
    | import('ws').WebSocket['CLOSED']
  send(data: string | ArrayBuffer): unknown
  close(code: number): unknown
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
  return undefined
}

async function WebSocketFactory(): Promise<(url: string | URL) => IsoWS> {
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
  return (url: string | URL) => new WS(url)
}

export async function newWebSocket(url: string | URL): Promise<IsoWS> {
  const wsFactory = await WebSocketFactory()
  return wsFactory(url)
}
