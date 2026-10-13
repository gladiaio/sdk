export function deepMergeObjects<T extends Record<string, unknown>>(
  obj1: T,
  obj2: Record<string, unknown> | undefined
): T {
  obj1 = { ...obj1 }
  if (!obj2) return obj1

  for (const [key, value] of Object.entries(obj2)) {
    if (value == null) continue

    if (obj1[key] && typeof obj1[key] === 'object' && typeof value === 'object') {
      // @ts-expect-error T is generic, it cannot handle this case
      obj1[key] = deepMergeObjects(obj1[key], value)
    } else {
      // @ts-expect-error T is generic, it cannot handle this case
      obj1[key] = value
    }
  }
  return obj1
}

export function getEnv<T extends string>(envVariableName: string, defaultValue: T): T
export function getEnv<T extends string>(envVariableName: string): T | undefined
export function getEnv<T extends string>(envVariableName: string, defaultValue?: T): T | undefined {
  if (typeof process === 'undefined' || typeof process.env === 'undefined') {
    return defaultValue
  }
  return (process.env[envVariableName] ?? defaultValue) as T | undefined
}

/**
 * Join `baseUrl` and `url`, keeping the base path as a prefix.
 *
 * Absolute `url` values are returned unchanged. Otherwise the paths are concatenated (unlike
 * `new URL(url, baseUrl)`, where `/v2/live` would replace a proxy prefix such as `/gladia`) and
 * the query strings of both are kept.
 */
export function buildUrl(baseUrl: string | URL, url: string | URL): URL {
  if (url instanceof URL || /^(https?|wss?):\/\//i.test(url)) {
    return new URL(url)
  }

  const base = new URL(baseUrl)
  // Only the path, query and fragment of a relative url are used
  const relative = new URL(url, 'http://localhost')
  const result = new URL(base)
  result.pathname = `${base.pathname.replace(/\/+$/, '')}/${relative.pathname.replace(/^\/+/, '')}`
  result.search = [base.search.slice(1), relative.search.slice(1)].filter(Boolean).join('&')
  result.hash = relative.hash || base.hash
  return result
}

export async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function isSharedArrayBuffer(
  audio: ArrayBufferLike | Buffer<ArrayBufferLike> | ArrayLike<number>
): audio is SharedArrayBuffer {
  return typeof SharedArrayBuffer !== 'undefined' && audio instanceof SharedArrayBuffer
}

export function toUint8Array(
  audio: ArrayBufferLike | Buffer<ArrayBufferLike> | ArrayLike<number>
): Uint8Array {
  if (isSharedArrayBuffer(audio)) {
    return new Uint8Array(audio)
  }
  return new Uint8Array(audio)
}

export function concatArrayBuffer(
  buffer1?: Uint8Array | null,
  buffer2?: Uint8Array | null
): Uint8Array {
  const newBuffer = new Uint8Array((buffer1?.byteLength ?? 0) + (buffer2?.byteLength ?? 0))
  if (buffer1) {
    newBuffer.set(new Uint8Array(buffer1), 0)
  }
  if (buffer2) {
    newBuffer.set(new Uint8Array(buffer2), buffer1?.byteLength ?? 0)
  }
  return newBuffer
}
