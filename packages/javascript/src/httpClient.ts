import { mergeHeaders } from './helpers.js'
import { initFetch } from './iso-fetch.js'
import type { Headers, HttpRetryOptions } from './types.js'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export class HttpError extends Error {
  readonly status: number
  readonly url: string
  readonly response?: Response

  constructor(
    message: string,
    status: number,
    url: string,
    response?: Response,
    options?: { cause?: unknown }
  ) {
    super(message, options)
    this.name = 'HttpError'
    this.status = status
    this.url = url
    this.response = response
  }
}

export class TimeoutError extends Error {
  readonly timeoutMs: number
  constructor(message: string, timeoutMs: number, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'TimeoutError'
    this.timeoutMs = timeoutMs
  }
}

type RequestOptions = Omit<RequestInit, 'method' | 'headers'> & { headers?: Headers }

export type HttpClientOptions = {
  baseUrl: string
  headers?: Headers
  httpRetry?: HttpRetryOptions
  httpTimeout?: number
}

function defaultRetry(): Required<HttpRetryOptions> {
  return {
    limit: 2,
    statusCodes: [408, 413, 429, [500, 599]],
    backoffLimit: 10_000,
    delay: (attemptCount: number) => 0.3 * 2 ** (attemptCount - 1) * 1000,
  }
}

function matchesStatus(status: number, list: (number | [number, number])[]): boolean {
  for (const item of list) {
    if (typeof item === 'number') {
      if (status === item) return true
    } else {
      const [start, end] = item
      if (status >= start && status <= end) return true
    }
  }
  return false
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  if ('name' in error && (error as any).name === 'AbortError') return true
  // In some environments, fetch abort rejects with a DOMException named 'AbortError'
  try {
    if (
      typeof DOMException !== 'undefined' &&
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {
      return true
    }
  } catch {
    // ignore if DOMException is not available
  }
  return false
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export class HttpClient {
  private baseUrl: string
  private defaultHeaders?: Headers

  private retry: Required<HttpRetryOptions>
  private timeoutMs: number
  private fetchPromise: Promise<typeof fetch>

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl
    this.defaultHeaders = options.headers
    this.retry = { ...defaultRetry(), ...(options?.httpRetry ?? {}) }
    this.timeoutMs = options?.httpTimeout ?? 10_000

    // Ensure limit, backoffLimit and timeout are non-negative integers
    this.retry.limit = Math.max(0, Math.floor(this.retry.limit))
    this.retry.backoffLimit = Math.max(0, Math.floor(this.retry.backoffLimit))
    this.timeoutMs = Math.max(0, Math.floor(this.timeoutMs))

    this.fetchPromise = initFetch()
  }

  async get(url: string | URL, init: RequestOptions = {}): Promise<Response> {
    return this.request('GET', url, init)
  }

  async post(url: string | URL, init: RequestOptions = {}): Promise<Response> {
    return this.request('POST', url, init)
  }

  async put(url: string | URL, init: RequestOptions = {}): Promise<Response> {
    return this.request('PUT', url, init)
  }

  async delete(url: string | URL, init: RequestOptions = {}): Promise<Response> {
    return this.request('DELETE', url, init)
  }

  async request(
    method: HttpMethod,
    url: string | URL,
    init: RequestOptions = {}
  ): Promise<Response> {
    url = new URL(url, this.baseUrl).toString()
    const { signal: userSignal, headers, ...rest } = init

    const overallStart = Date.now()
    const attemptErrors: Error[] = []

    let attempt = 0
    const limit = this.retry.limit

    while (true) {
      attempt += 1

      // Prepare AbortController that combines user signal and timeout
      const controller = new AbortController()
      const onUserAbort = () => controller.abort((userSignal as any)?.reason)
      let timeoutId: ReturnType<typeof setTimeout> | undefined
      let timedOut = false

      try {
        if (userSignal) {
          if (userSignal.aborted) {
            // Respect user pre-aborted signal
            throw new Error('Request aborted by the provided AbortSignal', {
              cause: (userSignal as any).reason,
            })
          }
          userSignal.addEventListener('abort', onUserAbort, { once: true })
        }

        if (this.timeoutMs > 0) {
          timeoutId = setTimeout(() => {
            timedOut = true
            controller.abort(
              new TimeoutError(`Request timed out after ${this.timeoutMs}ms`, this.timeoutMs)
            )
          }, this.timeoutMs)
        }

        const selectedFetch = await this.fetchPromise
        const response = await selectedFetch(url, {
          ...rest,
          method,
          headers: mergeHeaders(this.defaultHeaders, headers),
          signal: controller.signal,
        })

        // Clear timeout on successful resolution
        if (timeoutId) clearTimeout(timeoutId)
        if (userSignal) userSignal.removeEventListener('abort', onUserAbort)

        if (!response.ok) {
          const httpErr = new HttpError(
            `HTTP ${response.status} ${response.statusText} for ${method} ${url}`,
            response.status,
            url,
            response
          )

          // Retry only if status is retryable and attempts remain
          // When limit is 0, retry unlimited times
          // When limit is 1, no retries (only initial attempt)
          // When limit is 2, 1 retry (initial + 1 retry)
          const shouldRetry = limit === 0 ? true : attempt < limit
          if (shouldRetry && matchesStatus(response.status, this.retry.statusCodes)) {
            attemptErrors.push(httpErr)
            const delayMs = Math.min(this.retry.delay(attempt), this.retry.backoffLimit)
            await sleep(delayMs)
            continue
          }

          // Not retryable or attempts exhausted -> throw and handle in catch
          throw httpErr
        }

        // Success
        return response
      } catch (err) {
        // Clear timers and listeners
        if (timeoutId) clearTimeout(timeoutId)
        if (userSignal) userSignal.removeEventListener('abort', onUserAbort)

        if (timedOut) {
          // No retry after timeout
          const elapsed = Date.now() - overallStart
          const timeoutError = new TimeoutError(
            `Request timed out after ${this.timeoutMs}ms on attempt ${attempt} (duration=${elapsed}ms) for ${method} ${url}`,
            this.timeoutMs,
            { cause: err }
          )
          throw timeoutError
        }

        if (isAbortError(err) || (userSignal && userSignal.aborted)) {
          // User abort should be clear and not retried
          const elapsed = Date.now() - overallStart
          const abortErr = new Error(
            `Request aborted by the provided AbortSignal after ${elapsed}ms for ${method} ${url}`,
            { cause: err }
          )
          throw abortErr
        }

        // Other errors (HTTP or network) — decide retry policy here
        const asError = err instanceof Error ? err : new Error(String(err))

        if (asError instanceof HttpError) {
          const retryable = matchesStatus(asError.status, this.retry.statusCodes)
          // When limit is 0, retry unlimited times
          // When limit is 1, no retries (only initial attempt)
          // When limit is 2, 1 retry (initial + 1 retry)
          const shouldRetry = limit === 0 ? true : attempt < limit
          if (retryable && shouldRetry) {
            attemptErrors.push(asError)
            const delayMs = Math.min(this.retry.delay(attempt), this.retry.backoffLimit)
            await sleep(delayMs)
            continue
          }

          if (attemptErrors.length > 0) {
            attemptErrors.push(asError)
            const elapsed = Date.now() - overallStart
            const aggregate = new AggregateError(attemptErrors, 'All retry attempts failed')
            const finalError = new Error(
              `HTTP request failed after ${attempt} attempts over ${elapsed}ms for ${method} ${url}`,
              { cause: aggregate }
            )
            throw finalError
          }

          // No prior attempts, not retryable -> surface the HttpError
          throw asError
        }

        // Non-HTTP (e.g., network) error
        // When limit is 0, retry unlimited times
        // When limit is 1, no retries (only initial attempt)
        // When limit is 2, 1 retry (initial + 1 retry)
        const shouldRetry = limit === 0 ? true : attempt < limit
        if (shouldRetry) {
          attemptErrors.push(asError)
          const delayMs = Math.min(this.retry.delay(attempt), this.retry.backoffLimit)
          await sleep(delayMs)
          continue
        }

        // Attempts exhausted — throw aggregated error with attempts and duration
        attemptErrors.push(asError)
        const elapsed = Date.now() - overallStart
        const aggregate = new AggregateError(attemptErrors, 'All retry attempts failed')
        const finalError = new Error(
          `HTTP request failed after ${attempt} attempts over ${elapsed}ms for ${method} ${url}`,
          { cause: aggregate }
        )
        throw finalError
      }
    }
  }
}
