/**
 * Unit tests for HttpClient (retries, timeout, methods).
 * Mirrors Python tests/network/test_async_http_client.py.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpClient, HttpError, TimeoutError } from '../../src/network/httpClient.js'

vi.mock('../../src/network/iso-fetch.js', () => ({
  initFetch: vi.fn(),
}))

const BASE = 'https://example.com'

describe('HttpClient (tests/network)', () => {
  let mockFetch: ReturnType<typeof vi.fn>
  let mockInitFetch: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    const { initFetch } = await import('../../src/network/iso-fetch.js')
    mockInitFetch = initFetch as ReturnType<typeof vi.fn>
    mockFetch = vi.fn()
    mockInitFetch.mockResolvedValue(mockFetch)
  })

  it('retries on configured status and eventually succeeds', async () => {
    let calls = 0
    mockFetch.mockImplementation(() => {
      calls += 1
      if (calls < 2) {
        return Promise.resolve(new Response('', { status: 500, statusText: 'Internal Server Error' }))
      }
      return Promise.resolve(new Response('ok', { status: 200 }))
    })

    const client = new HttpClient({
      baseUrl: BASE,
      retry: { maxAttempts: 2, statusCodes: [[500, 599]], delay: () => 0 },
      timeout: 2_000,
    })

    const res = await client.get(`${BASE}/test`)
    expect(res.ok).toBe(true)
    expect(calls).toBe(2)
  })

  it('does not retry on timeout and throws TimeoutError', async () => {
    mockFetch.mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          const err = new Error('The operation was aborted')
          err.name = 'AbortError'
          reject(err)
        }, 100)
      })
    })

    const client = new HttpClient({
      baseUrl: BASE,
      retry: { maxAttempts: 5, statusCodes: [0, 999], delay: () => 0 },
      timeout: 10,
    })

    await expect(client.get(`${BASE}/timeout`)).rejects.toThrow(TimeoutError)
  })

  it('throws HttpError for non-retryable status (404)', async () => {
    mockFetch.mockResolvedValue(new Response('Not Found', { status: 404, statusText: 'Not Found' }))

    const client = new HttpClient({
      baseUrl: BASE,
      retry: { maxAttempts: 5, statusCodes: [408, 413, 429, [500, 599]], delay: () => 0 },
      timeout: 2_000,
    })

    await expect(client.get(`${BASE}/404`)).rejects.toThrow(HttpError)
  })
})
