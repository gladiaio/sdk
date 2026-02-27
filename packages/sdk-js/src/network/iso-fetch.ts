import { getEnv } from '../helpers.js'

// Max safe integer in 32-bit environment
const MAX_TIMEOUT = 2147483647

export async function initFetch(): Promise<typeof fetch> {
  if (getEnv('VITEST_WORKER_ID')) {
    return fetch
  }

  if (!(typeof process !== 'undefined' && !!(process.versions as any)?.node)) {
    return fetch
  }

  try {
    const { Agent, setGlobalDispatcher } = await import('undici')
    const agent = new Agent({
      connectTimeout: MAX_TIMEOUT,
      connect: { timeout: MAX_TIMEOUT },
      headersTimeout: MAX_TIMEOUT,
      bodyTimeout: 0,
    })
    setGlobalDispatcher(agent)
    // Return Node.js's built-in fetch (which now uses the agent above),
    // so its own FormData is recognized and Content-Type is set correctly.
    return fetch
  } catch {
    return fetch
  }
}
