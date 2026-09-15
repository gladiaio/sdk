import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InternalGladiaClientOptions } from '../../internal_types.js'
import { HttpClient } from '../../network/httpClient.js'
import { WebSocketClient, WS_STATES } from '../../network/wsClient.js'
import { LiveV2Client } from './client.js'

function makeOptions(
  overrides: Partial<InternalGladiaClientOptions> = {}
): InternalGladiaClientOptions {
  return {
    apiKey: 'test-key',
    apiUrl: 'https://api.gladia.io',
    httpHeaders: { 'x-gladia-key': 'test-key' },
    httpRetry: { maxAttempts: 1, statusCodes: [], delay: () => 0 },
    httpTimeout: 10_000,
    wsRetry: {
      maxAttemptsPerConnection: 1,
      closeCodes: [],
      delay: () => 0,
      maxConnections: 1,
    },
    wsTimeout: 10_000,
    prerecordedTimeouts: {
      transcribe: 7_200_000,
      poll: 7_200_000,
      createAndPoll: 7_200_000,
      uploadFile: 300_000,
      getFile: 300_000,
      create: 60_000,
      delete: 60_000,
      get: 10_000,
      list: 10_000,
    },
    liveTimeouts: {
      get: 10_000,
      delete: 60_000,
      getFile: 300_000,
      list: 10_000,
    },
    ...overrides,
  } as InternalGladiaClientOptions
}

describe('LiveV2Client.startSession region wiring', () => {
  let postSpy: ReturnType<typeof vi.spyOn>
  let createSessionSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.restoreAllMocks()

    postSpy = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({
      id: 'created-session-id',
      url: 'wss://api.gladia.io/v2/live/ws?token=created',
      created_at: '2026-06-25T09:00:00Z',
    })

    createSessionSpy = vi.spyOn(WebSocketClient.prototype, 'createSession').mockReturnValue({
      readyState: WS_STATES.CONNECTING,
      onconnecting: null,
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
      send: vi.fn(),
      close: vi.fn(),
    } as never)
  })

  async function tick(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  it('passes region from GladiaClient options through startSession to POST /v2/live', async () => {
    const client = new LiveV2Client(makeOptions({ region: 'us-west' }))
    const session = client.startSession({ sample_rate: 16000 })

    await tick()

    expect(postSpy).toHaveBeenCalledTimes(1)
    expect(postSpy).toHaveBeenCalledWith(
      '/v2/live?region=us-west',
      expect.objectContaining({
        body: expect.stringContaining('"sample_rate":16000'),
      })
    )
    expect(createSessionSpy).toHaveBeenCalledWith(
      'wss://api.gladia.io/v2/live/ws?token=created'
    )
    expect(await session.getSessionId()).toBe('created-session-id')

    session.endSession()
  })

  it('does not put region on POST /v2/live when region is unset', async () => {
    const client = new LiveV2Client(makeOptions())
    const session = client.startSession({ sample_rate: 16000 })

    await tick()

    expect(postSpy).toHaveBeenCalledWith(
      '/v2/live',
      expect.objectContaining({
        body: expect.stringContaining('"sample_rate":16000'),
      })
    )

    session.endSession()
  })
})
