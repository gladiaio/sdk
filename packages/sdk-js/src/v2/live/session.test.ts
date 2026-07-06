import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpClient } from '../../network/httpClient.js'
import { WebSocketClient, WS_STATES } from '../../network/wsClient.js'
import { LiveV2Session } from './session.js'

type MockWebSocketSession = {
  readyState: number
  onconnecting: ((event: { connection: number; attempt: number }) => void) | null
  onopen: ((event: { connection: number; attempt: number }) => void) | null
  onmessage: ((event: { data: string }) => void) | null
  onclose: ((event: { code: number; reason: string }) => void) | null
  onerror: ((error: Error) => void) | null
  send: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
}

describe('LiveV2Session connectSession', () => {
  let mockHttpPost: ReturnType<typeof vi.fn>
  let mockCreateSession: ReturnType<typeof vi.fn>
  let mockWsSession: MockWebSocketSession
  let httpClient: HttpClient
  let webSocketClient: WebSocketClient

  beforeEach(() => {
    mockHttpPost = vi.fn().mockResolvedValue({
      id: 'created-session-id',
      url: 'wss://api.gladia.io/v2/live/ws?token=created',
      created_at: '2026-06-25T09:00:00Z',
    })

    mockWsSession = {
      readyState: WS_STATES.CONNECTING,
      onconnecting: null,
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
      send: vi.fn(),
      close: vi.fn(),
    }

    mockCreateSession = vi.fn().mockReturnValue(mockWsSession)

    httpClient = { post: mockHttpPost } as unknown as HttpClient
    webSocketClient = { createSession: mockCreateSession } as unknown as WebSocketClient
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  async function tick(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  it('skips HTTP init and connects to the provided WebSocket URL', async () => {
    const existingSession = {
      id: 'session-123',
      url: 'wss://api.gladia.io/v2/live/ws?token=abc',
      created_at: '2026-06-25T10:00:00Z',
    }

    const startedSpy = vi.fn()
    const connectedSpy = vi.fn()

    const session = new LiveV2Session({
      options: {},
      existingSession,
      httpClient,
      webSocketClient,
    })

    session.on('started', startedSpy)
    session.once('connected', connectedSpy)

    await tick()

    expect(mockHttpPost).not.toHaveBeenCalled()
    expect(mockCreateSession).toHaveBeenCalledWith(existingSession.url)
    expect(startedSpy).toHaveBeenCalledWith(existingSession)
    expect(session.sessionId).toBe('session-123')

    mockWsSession.onopen?.({ connection: 1, attempt: 1 })
    expect(connectedSpy).toHaveBeenCalledWith({ attempt: 1 })
    expect(session.status).toBe('connected')
  })

  it('emits a synthetic start_session lifecycle message when configured', async () => {
    const existingSession = {
      id: 'session-123',
      url: 'wss://api.gladia.io/v2/live/ws?token=abc',
      created_at: '2026-06-25T10:00:00Z',
    }

    const messageSpy = vi.fn()

    const session = new LiveV2Session({
      options: {
        messages_config: {
          receive_lifecycle_events: true,
        },
      },
      existingSession,
      httpClient,
      webSocketClient,
    })

    session.on('message', messageSpy)

    await tick()

    expect(messageSpy).toHaveBeenCalledWith({
      type: 'start_session',
      session_id: existingSession.id,
      created_at: existingSession.created_at,
    })
  })

  it('still calls HTTP init for startSession flow', async () => {
    const startedSpy = vi.fn()

    const session = new LiveV2Session({
      options: {
        encoding: 'wav/pcm',
        sample_rate: 16000,
      },
      httpClient,
      webSocketClient,
    })

    session.on('started', startedSpy)

    await tick()

    expect(mockHttpPost).toHaveBeenCalledWith(
      '/v2/live',
      expect.objectContaining({
        body: expect.stringContaining('"sample_rate":16000'),
      })
    )
    expect(mockCreateSession).toHaveBeenCalledWith('wss://api.gladia.io/v2/live/ws?token=created')
    expect(startedSpy).toHaveBeenCalledWith({
      id: 'created-session-id',
      url: 'wss://api.gladia.io/v2/live/ws?token=created',
      created_at: '2026-06-25T09:00:00Z',
    })
    expect(session.sessionId).toBe('created-session-id')
  })

  it('endSession does not throw when abort closes the websocket with a reserved code', async () => {
    const existingSession = {
      id: 'session-123',
      url: 'wss://api.gladia.io/v2/live/ws?token=abc',
      created_at: '2026-06-25T10:00:00Z',
    }

    mockWsSession.readyState = WS_STATES.OPEN
    mockWsSession.close = vi.fn(() => {
      throw new DOMException('Invalid close code', 'InvalidAccessError')
    })

    const session = new LiveV2Session({
      options: {},
      existingSession,
      httpClient,
      webSocketClient,
    })

    await tick()
    mockWsSession.onopen?.({ connection: 1, attempt: 1 })

    expect(() => session.endSession()).not.toThrow()
    expect(session.status).toBe('ended')
  })
})
