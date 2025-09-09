import { describe, expect, it } from 'vitest'
import { HttpClient, HttpError, TimeoutError } from './httpClient.js'
import { http, HttpResponse, server } from './test/setup-msw.js'

const BASE = 'https://example.com'

describe('HttpClient', () => {
  it('retries on configured HTTP status and eventually succeeds', async () => {
    let calls = 0
    server.use(
      http.get(`${BASE}/test`, () => {
        calls += 1
        if (calls < 3) {
          return HttpResponse.text('', { status: 500, statusText: 'Internal Server Error' })
        }
        return HttpResponse.text('ok', { status: 200 })
      })
    )

    const client = new HttpClient({
      baseUrl: BASE,
      httpRetry: { limit: 2, statusCodes: [[500, 599]], delay: () => 0, backoffLimit: 0 },
      httpTimeout: 2_000,
    })

    const res = await client.get(`${BASE}/test`)
    expect(res.ok).toBe(true)
    expect(calls).toBe(3)
  })

  it('throws aggregated error with cause chain when retries are exhausted', async () => {
    let calls = 0
    server.use(
      http.get(`${BASE}/fail`, () => {
        calls += 1
        return HttpResponse.text('', { status: 500, statusText: 'Internal Server Error' })
      })
    )

    const client = new HttpClient({
      baseUrl: BASE,
      httpRetry: { limit: 2, statusCodes: [[500, 599]], delay: () => 0, backoffLimit: 0 },
      httpTimeout: 2_000,
    })

    await expect(client.get(`${BASE}/fail`)).rejects.toMatchObject({
      message: expect.stringContaining('after 3 attempts'),
    })

    try {
      await client.get(`${BASE}/fail`)
    } catch (e) {
      const cause = (e as any).cause
      expect(cause).toBeInstanceOf(AggregateError)
      const errors = (cause as any).errors as unknown[]
      // 2 retry errors + final HTTP error
      expect(errors.length).toBe(3)
    }

    expect(calls).toBe(6) // two failing runs of 3 attempts each
  })

  it('does not retry on timeout and aborts the pending request', async () => {
    server.use(
      http.get(`${BASE}/timeout`, async ({ request }) => {
        // Wait until aborted by timeout; MSW will allow us to simulate a never-resolving request
        const controller = new AbortController()
        request.signal.addEventListener('abort', () => controller.abort())
        return (await new Promise<Response>(() => {
          // Never resolve; will be aborted by user's signal
        })) as unknown as Response
      })
    )

    const client = new HttpClient({
      baseUrl: BASE,
      httpRetry: { limit: 5, delay: () => 0 },
      httpTimeout: 50,
    })

    await expect(client.get(`${BASE}/timeout`)).rejects.toBeInstanceOf(TimeoutError)
  })

  it('respects user-provided AbortSignal and does not retry', async () => {
    server.use(
      http.get(`${BASE}/abort`, async () => {
        return (await new Promise<Response>(() => {
          // Never resolve; will be aborted by user's signal
        })) as unknown as Response
      })
    )

    const controller = new AbortController()
    const client = new HttpClient({
      baseUrl: BASE,
      httpRetry: { limit: 5, delay: () => 0 },
      httpTimeout: 1_000,
    })

    const promise = client.get(`${BASE}/abort`, { signal: controller.signal })
    controller.abort('user-request')

    await expect(promise).rejects.toMatchObject({
      message: expect.stringContaining('Request aborted by the provided AbortSignal'),
    })
  })

  it('throws HttpError immediately for non-retryable status (e.g., 404)', async () => {
    server.use(
      http.get(`${BASE}/404`, () => HttpResponse.text('', { status: 404, statusText: 'Not Found' }))
    )

    const client = new HttpClient({
      baseUrl: BASE,
      httpRetry: { limit: 5, statusCodes: [408, 413, 429, [500, 599]], delay: () => 0 },
    })

    await expect(client.get(`${BASE}/404`)).rejects.toBeInstanceOf(HttpError)
  })

  it('sends correct HTTP methods for get/post/put/delete', async () => {
    const client = new HttpClient({
      baseUrl: BASE,
    })

    server.use(
      http.get(`${BASE}/method`, () => HttpResponse.text('ok')),
      http.post(`${BASE}/method`, () => HttpResponse.text('ok')),
      http.put(`${BASE}/method`, () => HttpResponse.text('ok')),
      http.delete(`${BASE}/method`, () => HttpResponse.text('ok'))
    )

    const rGet = await client.get(`${BASE}/method`)
    expect(rGet.ok).toBe(true)

    const rPost = await client.post(`${BASE}/method`)
    expect(rPost.ok).toBe(true)

    const rPut = await client.put(`${BASE}/method`)
    expect(rPut.ok).toBe(true)

    const rDelete = await client.delete(`${BASE}/method`)
    expect(rDelete.ok).toBe(true)
  })
})
