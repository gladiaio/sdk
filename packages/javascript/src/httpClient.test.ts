import { describe, expect, it, vi, beforeEach } from 'vitest'
import { HttpClient, HttpError, TimeoutError } from './httpClient.js'

// Mock the iso-fetch module
vi.mock('./iso-fetch.js', () => ({
  initFetch: vi.fn(),
}))

const BASE = 'https://example.com'

describe('HttpClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>
  let mockInitFetch: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked function
    const { initFetch } = await import('./iso-fetch.js')
    mockInitFetch = initFetch as ReturnType<typeof vi.fn>
    
    // Create a mock fetch function
    mockFetch = vi.fn()
    mockInitFetch.mockResolvedValue(mockFetch)
  })

  it('retries on configured HTTP status and eventually succeeds', async () => {
    let calls = 0
    mockFetch.mockImplementation(() => {
      calls += 1
      if (calls < 2) {
        return Promise.resolve(new Response('', { 
          status: 500, 
          statusText: 'Internal Server Error' 
        }))
      }
      return Promise.resolve(new Response('ok', { status: 200 }))
    })

    const client = new HttpClient({
      baseUrl: BASE,
      httpRetry: { limit: 2, statusCodes: [[500, 599]], delay: () => 0, backoffLimit: 0 },
      httpTimeout: 2_000,
    })

    const res = await client.get(`${BASE}/test`)
    expect(res.ok).toBe(true)
    expect(calls).toBe(2) // Initial attempt + 1 retry
  })

  it('throws aggregated error with cause chain when retries are exhausted', async () => {
    let calls = 0
    mockFetch.mockImplementation(() => {
      calls += 1
      return Promise.resolve(new Response('', { 
        status: 500, 
        statusText: 'Internal Server Error' 
      }))
    })

    const client = new HttpClient({
      baseUrl: BASE,
      httpRetry: { limit: 2, statusCodes: [[500, 599]], delay: () => 0, backoffLimit: 0 },
      httpTimeout: 2_000,
    })

    await expect(client.get(`${BASE}/fail`)).rejects.toMatchObject({
      message: expect.stringContaining('after 2 attempts'),
    })

    try {
      await client.get(`${BASE}/fail`)
    } catch (e) {
      const cause = (e as Error).cause
      expect(cause).toBeInstanceOf(AggregateError)
      const errors = (cause as AggregateError).errors
      // 1 retry error + final HTTP error
      expect(errors.length).toBe(2)
    }

    expect(calls).toBe(4) // two failing runs of 2 attempts each
  })

  it('does not retry on timeout and aborts the pending request', async () => {
    mockFetch.mockImplementation((_url, options) => {
      // Simulate a never-resolving request that will be aborted by timeout
      return new Promise((_resolve, reject) => {
        // Set up a timeout to reject with AbortError when aborted
        const timeout = setTimeout(() => {
          const error = new Error('The operation was aborted')
          error.name = 'AbortError'
          reject(error)
        }, 100)
        
        // Listen for abort signal
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            clearTimeout(timeout)
            const error = new Error('The operation was aborted')
            error.name = 'AbortError'
            reject(error)
          })
        }
      })
    })

    const client = new HttpClient({
      baseUrl: BASE,
      httpRetry: { limit: 5, delay: () => 0 },
      httpTimeout: 50,
    })

    await expect(client.get(`${BASE}/timeout`)).rejects.toBeInstanceOf(TimeoutError)
  })

  it('respects user-provided AbortSignal and does not retry', async () => {
    let fetchCalls = 0
    mockFetch.mockImplementation((_url, options) => {
      fetchCalls++
      // Simulate a never-resolving request that will be aborted by user signal
      return new Promise((_resolve, reject) => {
        // Listen for abort signal
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            const error = new Error('The operation was aborted')
            error.name = 'AbortError'
            reject(error)
          })
        }
      })
    })

    const controller = new AbortController()
    const client = new HttpClient({
      baseUrl: BASE,
      httpRetry: { limit: 5, delay: () => 0 },
      httpTimeout: 1_000,
    })

    const promise = client.get(`${BASE}/abort`, { signal: controller.signal })
    
    // Abort after a short delay to ensure the request has started
    setTimeout(() => {
      controller.abort('user-request')
    }, 10)

    await expect(promise).rejects.toMatchObject({
      message: expect.stringContaining('Request aborted by the provided AbortSignal'),
    })
    
    // Should only make one call since it was aborted
    expect(fetchCalls).toBe(1)
  })

  it('throws HttpError immediately for non-retryable status (e.g., 404)', async () => {
    mockFetch.mockImplementation(() => {
      return Promise.resolve(new Response('', { 
        status: 404, 
        statusText: 'Not Found' 
      }))
    })

    const client = new HttpClient({
      baseUrl: BASE,
      httpRetry: { limit: 5, statusCodes: [408, 413, 429, [500, 599]], delay: () => 0 },
    })

    await expect(client.get(`${BASE}/404`)).rejects.toBeInstanceOf(HttpError)
  })

  it('sends correct HTTP methods for get/post/put/delete', async () => {
    mockFetch.mockImplementation(() => {
      return Promise.resolve(new Response('ok', { status: 200 }))
    })

    const client = new HttpClient({
      baseUrl: BASE,
    })

    const rGet = await client.get(`${BASE}/method`)
    expect(rGet.ok).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/method'), expect.objectContaining({
      method: 'GET'
    }))

    const rPost = await client.post(`${BASE}/method`)
    expect(rPost.ok).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/method'), expect.objectContaining({
      method: 'POST'
    }))

    const rPut = await client.put(`${BASE}/method`)
    expect(rPut.ok).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/method'), expect.objectContaining({
      method: 'PUT'
    }))

    const rDelete = await client.delete(`${BASE}/method`)
    expect(rDelete.ok).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/method'), expect.objectContaining({
      method: 'DELETE'
    }))
  })

  it('does not retry with limit 1 (only initial call)', async () => {
    let calls = 0
    mockFetch.mockImplementation(() => {
      calls += 1
      // Always return success on first call
      return Promise.resolve(new Response('ok', { status: 200 }))
    })

    const client = new HttpClient({
      baseUrl: BASE,
      httpRetry: { limit: 1, statusCodes: [[500, 599]], delay: () => 0, backoffLimit: 0 },
      httpTimeout: 2_000,
    })

    const res = await client.get(`${BASE}/test`)
    expect(res.ok).toBe(true)
    expect(calls).toBe(1) // Only initial attempt, no retries
  })

  it('fails immediately with limit 1 (no retries)', async () => {
    let calls = 0
    mockFetch.mockImplementation(() => {
      calls += 1
      return Promise.resolve(new Response('', { 
        status: 500, 
        statusText: 'Internal Server Error' 
      }))
    })

    const client = new HttpClient({
      baseUrl: BASE,
      httpRetry: { limit: 1, statusCodes: [[500, 599]], delay: () => 0, backoffLimit: 0 },
      httpTimeout: 2_000,
    })

    await expect(client.get(`${BASE}/fail`)).rejects.toMatchObject({
      message: expect.stringContaining('HTTP 500 Internal Server Error'),
    })

    expect(calls).toBe(1) // Only initial attempt, no retries
  })

  it('retries exactly once with limit 2', async () => {
    let calls = 0
    mockFetch.mockImplementation(() => {
      calls += 1
      if (calls < 2) {
        return Promise.resolve(new Response('', { 
          status: 500, 
          statusText: 'Internal Server Error' 
        }))
      }
      return Promise.resolve(new Response('ok', { status: 200 }))
    })

    const client = new HttpClient({
      baseUrl: BASE,
      httpRetry: { limit: 2, statusCodes: [[500, 599]], delay: () => 0, backoffLimit: 0 },
      httpTimeout: 2_000,
    })

    const res = await client.get(`${BASE}/test`)
    expect(res.ok).toBe(true)
    expect(calls).toBe(2) // Initial attempt + 1 retry
  })

  it('retries unlimited times with limit 0', async () => {
    let calls = 0
    mockFetch.mockImplementation(() => {
      calls += 1
      if (calls < 5) {
        return Promise.resolve(new Response('', { 
          status: 500, 
          statusText: 'Internal Server Error' 
        }))
      }
      return Promise.resolve(new Response('ok', { status: 200 }))
    })

    const client = new HttpClient({
      baseUrl: BASE,
      httpRetry: { limit: 0, statusCodes: [[500, 599]], delay: () => 0, backoffLimit: 0 },
      httpTimeout: 2_000,
    })

    const res = await client.get(`${BASE}/test`)
    expect(res.ok).toBe(true)
    expect(calls).toBe(5) // Initial attempt + 4 retries
  })

})
