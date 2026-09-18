import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InternalGladiaClientOptions } from '../../internal_types.js'
import { HttpClient } from '../../network/httpClient.js'
import { PreRecordedV2Client } from './client.js'
import type { PreRecordedV2ListResponse } from './generated-types.js'

const listResponse: PreRecordedV2ListResponse = {
  first: 'https://api.gladia.io/v2/pre-recorded?offset=0&limit=20',
  current: 'https://api.gladia.io/v2/pre-recorded?offset=0&limit=20',
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
      list: 12_345,
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

describe('PreRecordedV2Client.list', () => {
  let getSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.restoreAllMocks()
    getSpy = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue(listResponse)
  })

  it('GETs /v2/pre-recorded with no query when params omitted', async () => {
    const client = new PreRecordedV2Client(makeOptions())
    const result = await client.list()
    expect(result).toEqual(listResponse)
    expect(getSpy).toHaveBeenCalledTimes(1)
    const [url, init] = getSpy.mock.calls[0]
    expect(String(url)).toBe('/v2/pre-recorded')
    expect(init).toMatchObject({ requestTimeout: 12_345 })
  })

  it('serializes filters into the request URL', async () => {
    const client = new PreRecordedV2Client(makeOptions())
    await client.list({
      offset: 5,
      limit: 10,
      status: ['done', 'error'],
      custom_metadata: { user: 'John Doe' },
      after_date: '2026-09-01T00:00:00.000Z',
    })
    const [url] = getSpy.mock.calls[0]
    const parsed = new URL(String(url), 'https://api.gladia.io')
    expect(parsed.pathname).toBe('/v2/pre-recorded')
    expect(parsed.searchParams.get('offset')).toBe('5')
    expect(parsed.searchParams.get('limit')).toBe('10')
    expect(parsed.searchParams.getAll('status')).toEqual(['done', 'error'])
    expect(parsed.searchParams.get('custom_metadata[user]')).toBe('John Doe')
    expect(parsed.searchParams.get('after_date')).toBe('2026-09-01T00:00:00.000Z')
  })

  it('follows absolute pagination url when url is provided', async () => {
    const next = 'https://api.gladia.io/v2/pre-recorded?offset=20&limit=20&status=done'
    const client = new PreRecordedV2Client(makeOptions())
    await client.list({ url: next, offset: 0, status: ['error'] })
    const [url] = getSpy.mock.calls[0]
    expect(String(url)).toBe(next)
  })
})
