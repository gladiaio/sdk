import { getEnv } from './iso-env.js'

export async function initFetch(): Promise<typeof fetch> {
  if (getEnv('VITEST_WORKER_ID')) {
    return fetch
  }

  if (!(typeof process !== 'undefined' && !!(process.versions as any)?.node)) {
    return fetch
  }

  try {
    // For Node based undici fetch, we disable the timeout
    const { fetch: uFetch, Agent } = await import('undici')
    const agent = new Agent({
      connectTimeout: Number.MAX_SAFE_INTEGER,
      connect: { timeout: Number.MAX_SAFE_INTEGER },
      headersTimeout: Number.MAX_SAFE_INTEGER,
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
