/**
 * Request types for the transcribe (upload + initiate + poll) flow.
 */

import type { PreRecordedV2InitTranscriptionRequest } from './generated-types.js'

/**
 * Transcription options for the transcribe flow (no audio_url; it is derived from file).
 */
export type PreRecordedV2TranscribeOptions = Omit<
  PreRecordedV2InitTranscriptionRequest,
  'audio_url'
>

/**
 * End-to-end transcribe request: file + options (audio_url is derived from file).
 */
export interface PreRecordedV2TranscribeRequest {
  /** Audio source: path, URL, upload id, or File/Blob. Local files and blobs are uploaded. */
  file: string | File | Blob
  /** Transcription options (language, diarization, etc.). Must not include audio_url. */
  options?: PreRecordedV2TranscribeOptions | null
  /** Milliseconds between polling attempts. */
  interval?: number
  /** Maximum milliseconds to wait before throwing. undefined = wait indefinitely. */
  timeout?: number
}
