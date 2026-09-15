import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InternalGladiaClientOptions } from '../../internal_types.js'
import { HttpClient } from '../../network/httpClient.js'
import { LiveV2Client } from './client.js'
import type { LiveV2ListResponse } from './generated-types.js'

const listResponse: LiveV2ListResponse = {
  first: 'https://api.gladia.io/v2/live?offset=0&limit=20',
  current: 'https://api.gladia.io/v2/live?offset=0&limit=20',
  next: null,
  items: [],
}

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
      list: 54_321,
    },
    ...overrides,
  } as InternalGladiaClientOptions
}

describe('LiveV2Client.list', () => {
  let getSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.restoreAllMocks()
    getSpy = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue(listResponse)
  })

  it('GETs /v2/live with no query when params omitted', async () => {
    const client = new LiveV2Client(makeOptions())
    const result = await client.list()
    expect(result).toEqual(listResponse)
    expect(getSpy).toHaveBeenCalledTimes(1)
    const [url, init] = getSpy.mock.calls[0]
    expect(String(url)).toBe('/v2/live')
    expect(init).toMatchObject({ requestTimeout: 54_321 })
  })

  it('serializes filters into the request URL', async () => {
    const client = new LiveV2Client(makeOptions())
    await client.list({
      offset: 5,
      limit: 10,
      status: ['done', 'error'],
      custom_metadata: { user: 'John Doe' },
      before_date: '2026-09-10T10:38:56.452Z',
    })
    const [url] = getSpy.mock.calls[0]
    const parsed = new URL(String(url), 'https://api.gladia.io')
    expect(parsed.pathname).toBe('/v2/live')
    expect(parsed.searchParams.get('offset')).toBe('5')
    expect(parsed.searchParams.get('limit')).toBe('10')
    expect(parsed.searchParams.getAll('status')).toEqual(['done', 'error'])
    expect(parsed.searchParams.get('custom_metadata[user]')).toBe('John Doe')
    expect(parsed.searchParams.get('before_date')).toBe('2026-09-10T10:38:56.452Z')
  })

  it('follows absolute pagination url when url is provided', async () => {
    const next = 'https://api.gladia.io/v2/live?offset=20&limit=20&status=done'
    const client = new LiveV2Client(makeOptions())
    await client.list({ url: next, offset: 0, status: ['error'] })
    const [url] = getSpy.mock.calls[0]
    expect(String(url)).toBe(next)
  })
})
