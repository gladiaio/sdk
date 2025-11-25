import { getEnv } from '../helpers.js';

const MAX_TIMEOUT = 2147483647;

export async function initFetch(): Promise<typeof fetch> {
  if (getEnv('VITEST_WORKER_ID')) {
    return fetch
  }

  if (!(typeof process !== 'undefined' && !!(process.versions as any)?.node)) {
    return fetch
  }

  try {
    // For Node based undici fetch, we disable the timeout
    // @ts-expect-error undici is an optional dependency
    const { fetch: uFetch, Agent } = await import('undici')
    const agent = new Agent({
      connectTimeout: MAX_TIMEOUT,
      connect: { timeout: MAX_TIMEOUT },
      headersTimeout: MAX_TIMEOUT,
      bodyTimeout: 0,
    })
    return (url: string | URL | Request, init?: RequestInit | undefined) => {
      return uFetch(url, {
        ...init,
        dispatcher: agent,
      })
    }
  } catch {
    return fetch
  }
}
