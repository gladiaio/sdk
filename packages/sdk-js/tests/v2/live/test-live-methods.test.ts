/**
 * Unit tests for LiveV2Client API methods (get, listTranscriptions, download, delete, startSession).
 * These tests mock the HTTP and WebSocket layers: no API key or real audio is required.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InternalGladiaClientOptions } from '../../../src/internal_types.js'
import { LiveV2Client } from '../../../src/v2/live/client.js'
import { LiveV2Session } from '../../../src/v2/live/session.js'
import type { LiveV2InitRequest } from '../../../src/v2/live/generated-types.js'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockDelete = vi.fn()
const mockCreateSession = vi.fn()

vi.mock('../../../src/network/httpClient.js', () => ({
  HttpClient: vi.fn().mockImplementation(function (this: any) {
    this.get = mockGet
    this.post = mockPost
    this.delete = mockDelete
    return this
  }),
}))

vi.mock('../../../src/network/wsClient.js', () => ({
  WebSocketClient: vi.fn().mockImplementation(function (this: any) {
    this.createSession = mockCreateSession
    return this
  }),
}))

function defaultOptions(overrides?: Partial<InternalGladiaClientOptions>): InternalGladiaClientOptions {
  return {
    apiUrl: 'https://api.gladia.io',
    httpHeaders: { 'x-gladia-version': 'SdkJavascript/0.0.0' },
    httpRetry: {
      maxAttempts: 2,
      statusCodes: [408, 413, 429, [500, 599]],
      delay: () => 100,
    },
    httpTimeout: 10_000,
    wsRetry: {
      maxAttemptsPerConnection: 5,
      closeCodes: [
        [1002, 4399],
        [4500, 9999],
      ],
      delay: () => 100,
      maxConnections: 0,
    },
    wsTimeout: 10_000,
    ...overrides,
  }
}

describe('LiveV2Client methods', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({})
    mockPost.mockResolvedValue({})
    mockDelete.mockResolvedValue(undefined)
    mockCreateSession.mockReturnValue({
      onconnecting: null,
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
      send: vi.fn(),
      close: vi.fn(),
      get readyState() {
        return 1
      },
    })
  })

  describe('get', () => {
    it('calls GET /v2/live/:id and returns session data', async () => {
      const sessionId = 'live-session-123'
      mockGet.mockResolvedValue({ id: sessionId, status: 'created' })

      const client = new LiveV2Client(defaultOptions())
      const result = await client.get(sessionId)

      expect(mockGet).toHaveBeenCalledWith(`/v2/live/${sessionId}`)
      expect(result).toEqual({ id: sessionId, status: 'created' })
    })
  })

  describe('listTranscriptions', () => {
    it('calls GET /v2/live when no limit', async () => {
      mockGet.mockResolvedValue({ data: [], total: 0 })

      const client = new LiveV2Client(defaultOptions())
      const result = await client.listTranscriptions()

      expect(mockGet).toHaveBeenCalledWith('/v2/live')
      expect(result).toEqual({ data: [], total: 0 })
    })

    it('calls GET /v2/live?limit=N when limit provided', async () => {
      mockGet.mockResolvedValue({ data: [] })

      const client = new LiveV2Client(defaultOptions())
      await client.listTranscriptions(10)

      expect(mockGet).toHaveBeenCalledWith('/v2/live?limit=10')
    })
  })

  describe('download', () => {
    it('calls GET /v2/live/:id/file and returns ArrayBuffer', async () => {
      const buffer = new ArrayBuffer(8)
      mockGet.mockResolvedValue(new Response(buffer))

      const client = new LiveV2Client(defaultOptions())
      const result = await client.download('live-dl-456')

      expect(mockGet).toHaveBeenCalledWith('/v2/live/live-dl-456/file')
      expect(result).toBeInstanceOf(ArrayBuffer)
      expect(new Uint8Array(result)).toEqual(new Uint8Array(buffer))
    })
  })

  describe('delete', () => {
    it('calls DELETE /v2/live/:id', async () => {
      const sessionId = 'live-del-789'
      const client = new LiveV2Client(defaultOptions())
      await client.delete(sessionId)
      expect(mockDelete).toHaveBeenCalledWith(`/v2/live/${sessionId}`)
    })
  })

  describe('startSession', () => {
    it('returns LiveV2Session instance', () => {
      mockPost.mockResolvedValue({
        id: 'sess-1',
        created_at: '2025-01-01T00:00:00Z',
        url: 'wss://api.gladia.io/v2/live/ws?token=abc',
      })

      const client = new LiveV2Client(defaultOptions())
      const opts: LiveV2InitRequest = {}
      const session = client.startSession(opts)

      expect(session).toBeInstanceOf(LiveV2Session)
    })
  })
})
