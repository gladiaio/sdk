/**
 * Pre-recorded V2 async (e2e) tests — one test per client method.
 */

import {
  GladiaClient,
  type PreRecordedV2InitTranscriptionRequest,
  type PreRecordedV2TranscriptionLanguageCode,
} from '@gladiaio/sdk'
import { getDataFile } from '@gladiaio/sdk-e2e-javascript-fixtures'
import assert from 'node:assert'
import { test } from 'vitest'

const AUDIO_FILE = 'short_split_infinity_16k.wav'
const POLL_INTERVAL_MS = 2_000
const POLL_TIMEOUT_MS = 180_000
const YOUTUBE_VIDEO_URL = 'https://www.youtube.com/watch?v=DYyY8Nh3TQE'
/** Longer timeout for YouTube/video processing. */
const YOUTUBE_POLL_TIMEOUT_MS = 600_000
/** E2E: upload/API calls can be slow; use a longer HTTP timeout than default (10s). */
const E2E_HTTP_TIMEOUT_MS = 90_000

function audioPath(): string {
  return getDataFile(AUDIO_FILE)
}

function createClient(): ReturnType<GladiaClient['preRecordedV2']> {
  return new GladiaClient({ httpTimeout: E2E_HTTP_TIMEOUT_MS }).preRecordedV2()
}

function initOptions(audioUrl: string): PreRecordedV2InitTranscriptionRequest {
  return {
    audio_url: audioUrl,
    language_config: {
      languages: ['en' as PreRecordedV2TranscriptionLanguageCode],
    },
  }
}

function transcribeOptions(): {
  language_config: { languages: PreRecordedV2TranscriptionLanguageCode[] }
} {
  return {
    language_config: {
      languages: ['en' as PreRecordedV2TranscriptionLanguageCode],
    },
  }
}

test('uploadFile: returns audio_url and metadata', async () => {
  const client = createClient()
  const upload = await client.uploadFile(audioPath())
  assert(upload.audio_url)
  assert(upload.audio_metadata.audio_duration >= 0)
})

test('uploadFile: URL throws (expected file path)', async () => {
  const client = createClient()
  await assert.rejects(
    async () => client.uploadFile(YOUTUBE_VIDEO_URL),
    (err: unknown) => {
      assert(err instanceof Error)
      assert((err as Error).message.includes('file path') && (err as Error).message.includes('URL'))
      return true
    }
  )
})

test('create: returns job id and result_url', async () => {
  const client = createClient()
  const upload = await client.uploadFile(audioPath())
  const initResp = await client.create(initOptions(upload.audio_url))
  assert(initResp.id)
  assert(initResp.result_url)
})

test('poll: returns done result', async () => {
  const client = createClient()
  const upload = await client.uploadFile(audioPath())
  const initResp = await client.create(initOptions(upload.audio_url))
  const result = await client.poll(initResp.id, {
    interval: POLL_INTERVAL_MS,
    timeout: POLL_TIMEOUT_MS,
  })
  assert.strictEqual(result.status, 'done')
  assert.strictEqual(result.id, initResp.id)
})

test('get: returns job by id', async () => {
  const client = createClient()
  const upload = await client.uploadFile(audioPath())
  const initResp = await client.create(initOptions(upload.audio_url))
  await client.poll(initResp.id, {
    interval: POLL_INTERVAL_MS,
    timeout: POLL_TIMEOUT_MS,
  })
  const getResult = await client.get(initResp.id)
  assert.strictEqual(getResult.status, 'done')
  assert(getResult.result != null)
})

test('delete: returns true on success (HTTP 202)', async () => {
  const client = createClient()
  const upload = await client.uploadFile(audioPath())
  const initResp = await client.create(initOptions(upload.audio_url))
  await client.poll(initResp.id, {
    interval: POLL_INTERVAL_MS,
    timeout: POLL_TIMEOUT_MS,
  })
  const deleted = await client.delete(initResp.id)
  assert.strictEqual(deleted, true)
})

test('delete: throws with status 404 when job does not exist', async () => {
  const client = createClient()
  const nonexistentId = '00000000-0000-0000-0000-000000000000'
  await assert.rejects(
    async () => client.delete(nonexistentId),
    (err: unknown) => (err as { status?: number }).status === 404
  )
})

test('getFile: returns audio bytes', async () => {
  const client = createClient()
  const upload = await client.uploadFile(audioPath())
  const options = initOptions(upload.audio_url)
  const initResp = await client.create(options)
  const result = await client.poll(initResp.id, {
    interval: POLL_INTERVAL_MS,
    timeout: POLL_TIMEOUT_MS,
  })
  assert.strictEqual(result.status, 'done')
  const fileBytes = await client.getFile(result.id)
  assert(fileBytes instanceof ArrayBuffer)
  assert(fileBytes.byteLength > 0)
  const header = new Uint8Array(fileBytes, 0, 4)
  assert.strictEqual(String.fromCharCode(...header), 'RIFF')
})

test('transcribe: local file only (no options) → upload + create + poll returns done', async () => {
  const client = createClient()
  const result = await client.transcribe(audioPath(), undefined, {
    interval: POLL_INTERVAL_MS,
    timeout: POLL_TIMEOUT_MS,
  })
  assert.strictEqual(result.status, 'done')
  assert(result.result != null)
  assert(result.result.transcription != null)
})

test('transcribe: local file + options → upload + create + poll returns done with transcript', async () => {
  const client = createClient()
  const result = await client.transcribe(audioPath(), transcribeOptions(), {
    interval: POLL_INTERVAL_MS,
    timeout: POLL_TIMEOUT_MS,
  })
  assert.strictEqual(result.status, 'done')
  assert(result.result != null)
  assert(result.result.transcription != null)
  const full = result.result.transcription.full_transcript.trim()
  assert.match(full, /^\s*split infinity\p{P}*\s*$/iu)
})

test('transcribe: file + options as plain object (e.g. sentiment_analysis) → returns done', async () => {
  const client = createClient()
  const options = {
    language_config: { languages: ['en' as PreRecordedV2TranscriptionLanguageCode] },
    sentiment_analysis: true,
  }
  const result = await client.transcribe(audioPath(), options, {
    interval: POLL_INTERVAL_MS,
    timeout: POLL_TIMEOUT_MS,
  })
  assert.strictEqual(result.status, 'done')
  assert(result.result != null)
  assert(result.result.transcription != null)
})

test('transcribe: URL → direct create + poll (no upload) returns done with non-empty transcript', async () => {
  const client = createClient()
  const result = await client.transcribe(YOUTUBE_VIDEO_URL, transcribeOptions(), {
    interval: POLL_INTERVAL_MS,
    timeout: YOUTUBE_POLL_TIMEOUT_MS,
  })
  assert.strictEqual(result.status, 'done')
  assert(result.result != null)
  assert(result.result.transcription != null)
  const full = (result.result.transcription.full_transcript || '').trim()
  assert(full.length > 0, 'expected non-empty full_transcript')
})

test('createAndPoll: returns done result', async () => {
  const client = createClient()
  const upload = await client.uploadFile(audioPath())
  const options = initOptions(upload.audio_url)
  const result = await client.createAndPoll(options, {
    interval: POLL_INTERVAL_MS,
    timeout: POLL_TIMEOUT_MS,
  })
  assert.strictEqual(result.status, 'done')
  assert(result.result != null)
})
