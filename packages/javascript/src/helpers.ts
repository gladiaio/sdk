import type { Headers } from './types.js'

export function mergeHeaders(
  ...headers: (Headers | undefined)[]
): Record<string, string | string[]> {
  if (!headers.length) return {}

  return headers.reduce<Record<string, string | string[]>>((acc, cur) => {
    if (Array.isArray(cur)) {
      return { ...acc, ...Object.fromEntries(cur) }
    }
    return { ...acc, ...cur }
  }, {})
}
