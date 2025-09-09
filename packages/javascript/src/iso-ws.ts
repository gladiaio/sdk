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

function getNativeWebSocket(): IsoWS | undefined {
  return (
    getWebSocket(global) ||
    getWebSocket(globalThis) ||
    // @ts-expect-error unknown variable in NodeJS but can be defined in other environment
    getWebSocket(window) ||
    // @ts-expect-error unknown variable in NodeJS but can be defined in other environment
    getWebSocket(self)
  )
}

function getWebSocket(_g: any): IsoWS | undefined {
  if (typeof _g !== 'undefined' && typeof _g.WebSocket !== 'undefined') {
    return _g.WebSocket
  }
}

async function WebSocketFactory(): Promise<(url: string) => IsoWS> {
  let WS: any
  try {
    WS = getNativeWebSocket() ?? (await import('ws')).WebSocket
  } catch {
    // noop
  }
  return (url: string) => new WS(url)
}

export async function newWebSocket(url: string): Promise<IsoWS> {
  const wsFactory = await WebSocketFactory()
  return wsFactory(url)
}
