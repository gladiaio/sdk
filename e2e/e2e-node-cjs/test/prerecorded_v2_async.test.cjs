/**
 * Pre-recorded V2 async (e2e) tests — one test per client method.
 */

const { GladiaClient } = require('@gladiaio/sdk')
const { getDataFile } = require('@gladiaio/sdk-e2e-javascript-fixtures')
const assert = require('node:assert')
const { test } = require('node:test')

const AUDIO_FILE = 'short_split_infinity_16k.wav'
const POLL_INTERVAL_MS = 2_000
const POLL_TIMEOUT_MS = 180_000

function audioPath() {
  return getDataFile(AUDIO_FILE)
}

test('uploadFile: returns audio_url and metadata', async () => {
  const client = new GladiaClient().preRecordedV2()
  const upload = await client.uploadFile(audioPath())
  assert(upload.audio_url)
  assert(upload.audio_metadata.audio_duration >= 0)
})

test('create: returns job id and result_url', async () => {
  const client = new GladiaClient().preRecordedV2()
  const upload = await client.uploadFile(audioPath())
  const options = {
    audio_url: upload.audio_url,
    language_config: { languages: ['en'] },
  }
  const initResp = await client.create(options)
  assert(initResp.id)
  assert(initResp.result_url)
})

test('poll: returns done result', async () => {
  const client = new GladiaClient().preRecordedV2()
  const upload = await client.uploadFile(audioPath())
  const options = {
    audio_url: upload.audio_url,
    language_config: { languages: ['en'] },
  }
  const initResp = await client.create(options)
  const result = await client.poll(initResp.id, {
    interval: POLL_INTERVAL_MS,
    timeout: POLL_TIMEOUT_MS,
  })
  assert.strictEqual(result.status, 'done')
  assert.strictEqual(result.id, initResp.id)
})

test('get: returns job by id', async () => {
  const client = new GladiaClient().preRecordedV2()
  const upload = await client.uploadFile(audioPath())
  const options = {
    audio_url: upload.audio_url,
    language_config: { languages: ['en'] },
  }
  const initResp = await client.create(options)
  await client.poll(initResp.id, {
    interval: POLL_INTERVAL_MS,
    timeout: POLL_TIMEOUT_MS,
  })
  const getResult = await client.get(initResp.id)
  assert.strictEqual(getResult.status, 'done')
  assert(getResult.result != null)
})

test('delete: completes without throwing', async () => {
  const client = new GladiaClient().preRecordedV2()
  const upload = await client.uploadFile(audioPath())
  const options = {
    audio_url: upload.audio_url,
    language_config: { languages: ['en'] },
  }
  const initResp = await client.create(options)
  await client.poll(initResp.id, {
    interval: POLL_INTERVAL_MS,
    timeout: POLL_TIMEOUT_MS,
  })
  await client.delete(initResp.id)
})

test('getFile: returns audio bytes', async () => {
  const client = new GladiaClient().preRecordedV2()
  const upload = await client.uploadFile(audioPath())
  const options = {
    audio_url: upload.audio_url,
    language_config: { languages: ['en'] },
  }
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

test('transcribe: file only (no options) → upload + create + poll returns done', async () => {
  const client = new GladiaClient().preRecordedV2()
  const result = await client.transcribe(audioPath(), undefined, {
    interval: POLL_INTERVAL_MS,
    timeout: POLL_TIMEOUT_MS,
  })
  assert.strictEqual(result.status, 'done')
  assert(result.result != null)
  assert(result.result.transcription != null)
})

test('transcribe: file + options (no audio_url) → upload + create + poll returns done with transcript', async () => {
  const client = new GladiaClient().preRecordedV2()
  const options = {
    language_config: { languages: ['en'] },
  }
  const result = await client.transcribe(audioPath(), options, {
    interval: POLL_INTERVAL_MS,
    timeout: POLL_TIMEOUT_MS,
  })
  assert.strictEqual(result.status, 'done')
  assert(result.result != null)
  assert(result.result.transcription != null)
  const full = result.result.transcription.full_transcript.trim()
  assert.match(full, /^\s*split infinity\p{P}*\s*$/iu)
})

test('createAndPoll: returns done result', async () => {
  const client = new GladiaClient().preRecordedV2()
  const upload = await client.uploadFile(audioPath())
  const options = {
    audio_url: upload.audio_url,
    language_config: { languages: ['en'] },
  }
  const result = await client.createAndPoll(options, {
    interval: POLL_INTERVAL_MS,
    timeout: POLL_TIMEOUT_MS,
  })
  assert.strictEqual(result.status, 'done')
  assert(result.result != null)
})
