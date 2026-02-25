/**
 * Unit tests for WebSocketClient (options, createSession).
 * Mirrors Python tests/network/test_async_websocket_client.py structure.
 * For full WebSocket behavior see src/network/wsClient.test.ts.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WebSocketRetryOptions } from '../../src/types.js'
import { WebSocketClient, WS_STATES } from '../../src/network/wsClient.js'

vi.mock('../../src/network/iso-ws.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/network/iso-ws.js')>()
  return {
    ...actual,
    newWebSocket: vi.fn(),
  }
})

describe('WebSocketClient (tests/network)', () => {
  let mockNewWebSocket: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    const { newWebSocket } = await import('../../src/network/iso-ws.js')
    mockNewWebSocket = newWebSocket as ReturnType<typeof vi.fn>
    const mockWs = {
      readyState: WS_STATES.OPEN,
      send: vi.fn(),
      close: vi.fn(),
      onopen: null,
      onerror: null,
      onclose: null,
      onmessage: null,
    }
    mockNewWebSocket.mockReturnValue(mockWs)
  })

  function partialOptions(retry?: Partial<WebSocketRetryOptions>, timeout = 1000) {
    return {
      baseUrl: 'ws://localhost:8080',
      timeout,
      retry: {
        maxAttemptsPerConnection: 0,
        delay: () => 0,
        maxConnections: 0,
        closeCodes: [] as [number, number][],
        ...retry,
      },
    }
  }

  it('accepts retry and timeout options', () => {
    const retry: WebSocketRetryOptions = {
      maxAttemptsPerConnection: 5,
      closeCodes: [[1002, 4399]],
      delay: () => 100,
      maxConnections: 1,
    }
    const client = new WebSocketClient(partialOptions(retry, 2000))
    expect(client).toBeDefined()
  })

  it('createSession returns a session-like object with send and close', () => {
    const client = new WebSocketClient(partialOptions())
    const session = client.createSession('wss://api.gladia.io/v2/live/ws?token=test')
    expect(session).toBeDefined()
    expect(typeof session.send).toBe('function')
    expect(typeof session.close).toBe('function')
  })
})
