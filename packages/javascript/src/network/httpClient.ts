import { mergeHeaders } from '../helpers.js'
import type { Headers, HttpRetryOptions } from '../types.js'
import { initFetch } from './iso-fetch.js'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export class HttpError extends Error {
  readonly method: HttpMethod
  readonly status: number
  readonly url: string
  readonly id?: string
  readonly requestId?: string
  readonly responseBody?: string | Record<string, any>
  readonly responseHeaders?: Headers

  constructor(
    {
      message,
      method,
      id,
      requestId,
      responseBody,
      url,
      status,
      headers,
    }: {
      message: string
      method: HttpMethod
      url: string
      status: number
      id?: string | undefined
      requestId?: string | undefined
      responseBody?: string | Record<string, any>
      headers?: Headers
    },
    options?: { cause?: unknown }
  ) {
    super(message, options)
    this.name = 'HttpError'
    this.method = method
    this.url = url
    this.status = status
    this.id = id
    this.requestId = requestId
    this.responseBody = responseBody
    this.responseHeaders = headers
  }
}

async function createHttpError(
  method: HttpMethod,
  url: string | URL,
  response: Response,
  options?: { cause?: unknown }
) {
  let message: string | undefined
  let requestId: string | undefined
  let id: string | undefined
  let responseBody: string | Record<string, any> | undefined
  let headers: Headers | undefined
  try {
    id = response.headers.get('x-aipi-call-id') ?? undefined
    headers = Object.fromEntries(response.headers.entries())
    responseBody = await response.text()
    try {
      responseBody = JSON.parse(responseBody) as Record<string, any>
      requestId = responseBody?.['request_id']
      message = responseBody?.['message']
    } catch {
      // noop
    }
  } catch {
    // noop
  }

  const messageParts = [
    message || response.statusText || 'An error occurred',
    requestId || id,
    response.status.toString(),
    `${method} ${new URL(url).pathname}`,
  ]
  return new HttpError(
    {
      method,
      message: messageParts.filter(Boolean).join(' | '),
      url: url.toString(),
      status: response.status,
      id,
      requestId,
      responseBody,
      headers,
    },
    options
  )
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
  queryParams?: Record<string, string>
  retry: Required<HttpRetryOptions>
  timeout: number
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
  private defaultQueryParams?: Record<string, string>

  private retry: Required<HttpRetryOptions>
  private timeoutMs: number
  private fetchPromise: Promise<typeof fetch>

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl
    this.defaultHeaders = options.headers
    this.defaultQueryParams = options.queryParams
    this.retry = options.retry
    this.timeoutMs = options.timeout

    // Ensure limit, backoffLimit and timeout are non-negative integers
    this.retry.limit = Math.max(0, Math.floor(this.retry.limit))
    this.retry.backoffLimit = Math.max(0, Math.floor(this.retry.backoffLimit))
    this.timeoutMs = Math.max(0, Math.floor(this.timeoutMs))

    this.fetchPromise = initFetch()
  }

  async get<ResponseType = Response>(
    url: string | URL,
    init: RequestOptions = {}
  ): Promise<ResponseType> {
    return this.request('GET', url, init)
  }

  async post<ResponseType = Response>(
    url: string | URL,
    init: RequestOptions = {}
  ): Promise<ResponseType> {
    return this.request('POST', url, init)
  }

  async put<ResponseType = Response>(
    url: string | URL,
    init: RequestOptions = {}
  ): Promise<ResponseType> {
    return this.request('PUT', url, init)
  }

  async delete<ResponseType = Response>(
    url: string | URL,
    init: RequestOptions = {}
  ): Promise<ResponseType> {
    return this.request('DELETE', url, init)
  }

  async request<ResponseType>(
    method: HttpMethod,
    url: string | URL,
    init: RequestOptions = {}
  ): Promise<ResponseType> {
    url = new URL(url, this.baseUrl)
    if (this.defaultQueryParams) {
      for (const [key, value] of Object.entries(this.defaultQueryParams)) {
        // Only set default param if it's not already present in the URL
        if (!url.searchParams.has(key)) {
          url.searchParams.set(key, value)
        }
      }
    }

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
          const httpErr = await createHttpError(method, url, response)

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

        if (response.headers.get('content-type')?.includes('application/json')) {
          return (await response.json()) as ResponseType
        }
        return response as ResponseType
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
