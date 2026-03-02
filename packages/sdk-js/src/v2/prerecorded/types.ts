import type { PreRecordedV2InitTranscriptionRequest } from './generated-types.js'

/**
 * Transcription options for `transcribe()`.
 * Same as `PreRecordedV2InitTranscriptionRequest` but without `audio_url`;
 * the audio is provided via the `file` argument to `transcribe()`.
 */
export type PreRecordedV2TranscriptionOptions = Omit<
  PreRecordedV2InitTranscriptionRequest,
  'audio_url'
>
