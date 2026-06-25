/**
 * Live V2 job management (e2e) tests — get, getFile, delete.
 *
 * Each test starts a live session, streams a short audio clip, waits for
 * the session to end, then exercises the HTTP job-management method.
 */

const { GladiaClient } = require('@gladiaio/sdk')
const { parseAudioFile, sendAudioFile } = require('@gladiaio/sdk-e2e-javascript-fixtures')
const assert = require('node:assert')
const { test } = require('node:test')

const AUDIO_FILE = 'short_split_infinity_16k.wav'

/**
 * Run a full live session and return the job ID once the session has ended.
 */
async function runLiveSession() {
  const audioData = parseAudioFile(AUDIO_FILE)
  const client = new GladiaClient()
  const liveSession = client.liveV2().startSession({
    ...audioData.audioConfig,
    language_config: { languages: ['en'] },
  })

  const endPromise = new Promise((resolve) => {
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

/**
 * Poll until the live job reaches a terminal status (done or error).
 * The API only allows deletion once post-processing has finished.
 */
async function waitForTerminalJobStatus(
  client,
  jobId,
  { intervalMs = 1000, timeoutMs = 60_000 } = {}
) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const result = await client.get(jobId)
    if (result.status === 'done' || result.status === 'error') {
      return result
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  throw new Error(`Timed out waiting for job ${jobId} to reach terminal status`)
}

test('get: returns live job metadata after session ends', async () => {
  const jobId = await runLiveSession()
  const client = new GladiaClient().liveV2()
  const result = await client.get(jobId)
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
  await waitForTerminalJobStatus(client, jobId)
  const deleted = await client.delete(jobId)
  assert.strictEqual(deleted, true)
})

test('delete: throws with status 404 when job does not exist', async () => {
  const client = new GladiaClient().liveV2()
  const nonexistentId = '00000000-0000-0000-0000-000000000000'
  await assert.rejects(
    async () => client.delete(nonexistentId),
    (err) => err.status === 404
  )
})
