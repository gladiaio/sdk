/**
 * Live V2 job management (e2e) tests — get, getFile, delete.
 *
 * Each test starts a live session, streams a short audio clip, waits for
 * the session to end, then exercises the HTTP job-management method.
 */

import { GladiaClient, type LiveV2Response } from '@gladiaio/sdk'
import { parseAudioFile, sendAudioFile } from '@gladiaio/sdk-e2e-javascript-fixtures'
import assert from 'node:assert'
import { test } from 'vitest'

const AUDIO_FILE = 'short_split_infinity_16k.wav'

/**
 * Run a full live session and return the job ID once the session has ended.
 */
async function runLiveSession(): Promise<string> {
  const audioData = parseAudioFile(AUDIO_FILE)
  const client = new GladiaClient()
  const liveSession = client.liveV2().startSession({
    ...audioData.audioConfig,
    language_config: { languages: ['en'] },
  })

  const endPromise = new Promise<void>((resolve) => {
    liveSession.once('ended', () => resolve())
  })
  liveSession.once('error', (error) => console.error(error))

  await sendAudioFile(audioData, liveSession, 50)
  liveSession.stopRecording()
  await endPromise

  const jobId = await liveSession.getSessionId()
  assert(jobId, 'expected a session id after the session ended')
  return jobId
}

test('get: returns live job metadata after session ends', async () => {
  const jobId = await runLiveSession()
  const client = new GladiaClient().liveV2()
  const result: LiveV2Response = await client.get(jobId)
  assert.strictEqual(result.id, jobId)
  assert(
    result.status === 'done' || result.status === 'processing',
    `unexpected status: ${result.status}`
  )
  assert.strictEqual(result.kind, 'live')
})

test('getFile: returns audio bytes with RIFF header', async () => {
  const jobId = await runLiveSession()
  const client = new GladiaClient().liveV2()
  const fileBytes = await client.getFile(jobId)
  assert(fileBytes instanceof ArrayBuffer)
  assert(fileBytes.byteLength > 0)
  const header = new Uint8Array(fileBytes, 0, 4)
  assert.strictEqual(String.fromCharCode(...header), 'RIFF')
})

test('delete: returns true on success (HTTP 202)', async () => {
  const jobId = await runLiveSession()
  const client = new GladiaClient().liveV2()
  const deleted = await client.delete(jobId)
  assert.strictEqual(deleted, true)
})

test('delete: throws with status 404 when job does not exist', async () => {
  const client = new GladiaClient().liveV2()
  const nonexistentId = '00000000-0000-0000-0000-000000000000'
  await assert.rejects(
    async () => client.delete(nonexistentId),
    (err: unknown) => (err as { status?: number }).status === 404
  )
})
