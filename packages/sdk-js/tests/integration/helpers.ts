/**
 * Helpers and env checks for integration tests.
 * Skip when GLADIA_API_KEY or audio source is not set.
 */

export function getApiKey(): string | undefined {
  return typeof process !== 'undefined' ? process.env.GLADIA_API_KEY : undefined
}

export function getAudioPath(): string | undefined {
  const raw = typeof process !== 'undefined' ? process.env.GLADIA_TEST_AUDIO_PATH : undefined
  if (!raw) return undefined
  try {
    const fs = require('fs')
    return fs.existsSync(raw) && fs.statSync(raw).isFile() ? raw : undefined
  } catch {
    return undefined
  }
}

export function getAudioUrl(): string | undefined {
  const raw = typeof process !== 'undefined' ? process.env.GLADIA_TEST_AUDIO_URL : undefined
  if (!raw || (!raw.startsWith('http://') && !raw.startsWith('https://'))) return undefined
  return raw
}

export function hasAudioSource(): boolean {
  return getAudioPath() != null || getAudioUrl() != null
}

export function requiresApiKey(): boolean {
  return !!getApiKey()
}

export function getApiUrl(): string {
  return typeof process !== 'undefined' && process.env.GLADIA_API_URL
    ? process.env.GLADIA_API_URL
    : 'https://api.gladia.io'
}
