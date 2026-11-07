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

  it('emits messages of an unknown type on message, not as an error', async () => {
    const messageSpy = vi.fn()
    const errorSpy = vi.fn()

    const session = new LiveV2Session({
      options: {},
      existingSession: {
        id: 'session-123',
        url: 'wss://api.gladia.io/v2/live/ws?token=abc',
        created_at: '2026-06-25T10:00:00Z',
      },
      httpClient,
      webSocketClient,
    })
    session.on('message', messageSpy)
    session.on('error', errorSpy)

    await tick()
    mockWsSession.onopen?.({ connection: 1, attempt: 1 })

    const message = {
      type: 'end_of_turn',
      session_id: 'session-123',
      created_at: '2026-06-25T10:00:00Z',
      data: { channel: 0, probability: 0.9, reason: 'model' },
    }
    mockWsSession.onmessage?.({ data: JSON.stringify(message) })

    expect(messageSpy).toHaveBeenCalledWith(message)
    expect(errorSpy).not.toHaveBeenCalled()
  })

  async function connectedSession() {
    const messageSpy = vi.fn()
    const errorSpy = vi.fn()
    const session = new LiveV2Session({
      options: {},
      existingSession: {
        id: 'session-123',
        url: 'wss://api.gladia.io/v2/live/ws?token=abc',
        created_at: '2026-06-25T10:00:00Z',
      },
      httpClient,
      webSocketClient,
    })
    session.on('message', messageSpy)
    session.on('error', errorSpy)
    await tick()
    mockWsSession.onopen?.({ connection: 1, attempt: 1 })
    return { session, messageSpy, errorSpy }
  }

  it.each(['not json {', 'null', '42', '"text"', '{"data":{}}'])(
    'emits an error instead of throwing on malformed message %s',
    async (data) => {
      const { session, messageSpy, errorSpy } = await connectedSession()

      expect(() => mockWsSession.onmessage?.({ data })).not.toThrow()
      expect(errorSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy.mock.calls[0][0]).toBeInstanceOf(Error)
      expect(messageSpy).not.toHaveBeenCalled()

      // The session keeps processing the next messages
      const next = { type: 'end_of_turn', data: {} }
      mockWsSession.onmessage?.({ data: JSON.stringify(next) })
      expect(messageSpy).toHaveBeenCalledWith(next)
      expect(session.status).toBe('connected')
    }
  )

  it.each([
    {},
    { byte_range: null },
    { byte_range: [0] },
    { byte_range: [0, 'x'] },
    { byte_range: [0, -1] },
  ])('emits an error instead of throwing on an audio_chunk ack with data %j', async (data) => {
    const { session, errorSpy } = await connectedSession()

    expect(() =>
      mockWsSession.onmessage?.({
        data: JSON.stringify({ type: 'audio_chunk', acknowledged: true, data }),
      })
    ).not.toThrow()
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(session.status).toBe('connected')
  })

  it('only drops newly acknowledged audio from the resend buffer', async () => {
    const { session, errorSpy } = await connectedSession()
    session.sendAudio(new Uint8Array([1, 2, 3, 4, 5, 6]))

    const ack = (end: number) =>
      mockWsSession.onmessage?.({
        data: JSON.stringify({
          type: 'audio_chunk',
          acknowledged: true,
          data: { byte_range: [0, end] },
        }),
      })
    const resent = () => {
      mockWsSession.send.mockClear()
      mockWsSession.onopen?.({ connection: 2, attempt: 1 })
      return mockWsSession.send.mock.calls.map(([chunk]) => Array.from(chunk as Uint8Array))
    }

    ack(4)
    // A stale ack must not move the buffer backwards
    ack(2)
    ack(5)
    expect(resent()).toEqual([[6]])

    // An ack beyond what was sent empties the buffer
    ack(Number.MAX_SAFE_INTEGER)
    expect(resent()).toEqual([])
    expect(errorSpy).not.toHaveBeenCalled()
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

  it('passes region only on POST /v2/live', async () => {
    const session = new LiveV2Session({
      options: { sample_rate: 16000 },
      region: 'us-west',
      httpClient,
      webSocketClient,
    })

    await tick()

    expect(mockHttpPost).toHaveBeenCalledWith(
      '/v2/live?region=us-west',
      expect.objectContaining({
        body: expect.stringContaining('"sample_rate":16000'),
      })
    )
    expect(session.sessionId).toBe('created-session-id')
  })

  it('surfaces init failure without an unhandled rejection', async () => {
    const initError = new Error('init failed')
    mockHttpPost.mockRejectedValue(initError)

    const unhandledRejections: unknown[] = []
    const onUnhandledRejection = (reason: unknown) => {
      unhandledRejections.push(reason)
    }
    process.on('unhandledRejection', onUnhandledRejection)

    try {
      const errorSpy = vi.fn()
      const endedSpy = vi.fn()

      const session = new LiveV2Session({
        options: { sample_rate: 16000 },
        httpClient,
        webSocketClient,
      })

      session.on('error', errorSpy)
      session.on('ended', endedSpy)

      await expect(session.getSessionId()).rejects.toThrow('init failed')
      await tick()

      expect(errorSpy).toHaveBeenCalledWith(initError)
      expect(endedSpy).toHaveBeenCalledWith({
        code: 1006,
        reason: `Couldn't start a new session`,
      })
      expect(session.status).toBe('ended')
      expect(mockCreateSession).not.toHaveBeenCalled()
      expect(unhandledRejections).toEqual([])
    } finally {
      process.off('unhandledRejection', onUnhandledRejection)
    }
  })
})
