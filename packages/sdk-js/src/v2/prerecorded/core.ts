/**
 * Shared core logic for Pre-recorded V2 client.
 */

import type { PreRecordedV2InitTranscriptionRequest } from './generated-types.js'
import type { PreRecordedV2TranscribeOptions } from './transcribe-request.js'

/** Pattern for upload id (e.g. from audio_metadata.id): UUID with optional hyphens */
const UPLOAD_ID_PATTERN = /^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$/

export function isWebUrl(path: string): boolean {
  try {
    const url = new URL(path)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isUploadId(value: string): boolean {
  return value.length > 0 && UPLOAD_ID_PATTERN.test(value.trim())
}

/**
 * Build the init request body for transcribe(file, options).
 * Merges optional options with audio_url (options must not require audio_url when using TranscribeOptions).
 */
export function prepareTranscribeInitBody(
  options: PreRecordedV2TranscribeOptions | PreRecordedV2InitTranscriptionRequest | Record<string, unknown> | null | undefined,
  audioUrl: string
): PreRecordedV2InitTranscriptionRequest {
  if (options == null) {
    return { audio_url: audioUrl }
  }
  return { ...options, audio_url: audioUrl } as PreRecordedV2InitTranscriptionRequest
}
