/**
 * Integration tests for PreRecordedV2Client against the real API.
 * Run with GLADIA_API_KEY and GLADIA_TEST_AUDIO_PATH or GLADIA_TEST_AUDIO_URL set.
 */

import { describe, expect, it } from 'vitest'
import { GladiaClient } from '../../src/client.js'
import {
  getApiKey,
  getAudioPath,
  getAudioUrl,
  hasAudioSource,
  getApiUrl,
} from './helpers.js'

const requiresApiKey = () => !!getApiKey()
const requiresAudio = () => hasAudioSource()

describe('PreRecorded integration', () => {
  function client() {
    const key = getApiKey()
    if (!key) throw new Error('GLADIA_API_KEY not set')
    return new GladiaClient({
      apiKey: key,
      apiUrl: getApiUrl(),
    }).preRecordedV2()
  }

  it.skipIf(!requiresApiKey() || !requiresAudio())(
    'uploadFile with path returns valid response',
    async () => {
      const path = getAudioPath()
      if (!path) return
      const c = client()
      const result = await c.uploadFile(path)
      expect(result.audio_url).toBeDefined()
      expect(result.audio_metadata?.id).toBeDefined()
      expect(result.audio_metadata?.filename).toBeDefined()
    }
  )

  // Note: JS SDK uploadFile(string) expects a file path; URL shortcut is not implemented.

  it.skipIf(!requiresApiKey() || !requiresAudio())(
    'initiate with minimal options returns id and result_url',
    async () => {
      const c = client()
      const path = getAudioPath()
      const url = getAudioUrl()
      let audioUrl: string
      if (path) {
        const upload = await c.uploadFile(path)
        audioUrl = upload.audio_url
      } else if (url) {
        audioUrl = url
      } else {
        return
      }
      const result = await c.initiate({ audio_url: audioUrl })
      expect(result.id).toBeDefined()
      expect(result.result_url).toBeDefined()
    }
  )

  it.skipIf(!requiresApiKey() || !requiresAudio())(
    'get returns job with expected fields',
    async () => {
      const c = client()
      const path = getAudioPath()
      const url = getAudioUrl()
      let audioUrl: string
      if (path) {
        const upload = await c.uploadFile(path)
        audioUrl = upload.audio_url
      } else if (url) {
        audioUrl = url
      } else {
        return
      }
      const createResp = await c.initiate({ audio_url: audioUrl })
      const result = await c.get(createResp.id)
      expect(result.id).toBe(createResp.id)
      expect(['queued', 'processing', 'done', 'error']).toContain(result.status)
      expect(result.request_id).toBeDefined()
      expect(result.created_at).toBeDefined()
      expect(result.kind).toBe('pre-recorded')
    }
  )

  it.skipIf(!requiresApiKey() || !requiresAudio())(
    'poll eventually returns done or error',
    async () => {
      const c = client()
      const path = getAudioPath()
      const url = getAudioUrl()
      let audioUrl: string
      if (path) {
        const upload = await c.uploadFile(path)
        audioUrl = upload.audio_url
      } else if (url) {
        audioUrl = url
      } else {
        return
      }
      const createResp = await c.initiate({ audio_url: audioUrl })
      const result = await c.poll(createResp.id, { interval: 2000, timeout: 120_000 })
      expect(['done', 'error']).toContain(result.status)
      expect(result.id).toBe(createResp.id)
    },
    130_000
  )

  it.skipIf(!requiresApiKey() || !requiresAudio())(
    'initiateAndPoll returns completed result',
    async () => {
      const c = client()
      const path = getAudioPath()
      const url = getAudioUrl()
      let audioUrl: string
      if (path) {
        const upload = await c.uploadFile(path)
        audioUrl = upload.audio_url
      } else if (url) {
        audioUrl = url
      } else {
        return
      }
      const result = await c.initiateAndPoll(
        { audio_url: audioUrl },
        { interval: 2000, timeout: 120_000 }
      )
      expect(['done', 'error']).toContain(result.status)
      expect(result.id).toBeDefined()
      if (result.status === 'done' && result.result) {
        expect(result.result.transcription).toBeDefined()
      }
    },
    130_000
  )

  it.skipIf(!requiresApiKey() || !requiresAudio())(
    'transcribe with file uploads and returns completed result',
    async () => {
      const path = getAudioPath()
      if (!path) return
      const c = client()
      const result = await c.transcribe(
        path,
        { language: 'en' },
        { interval: 2000, timeout: 120_000 }
      )
      expect(['done', 'error']).toContain(result.status)
      expect(result.id).toBeDefined()
    },
    130_000
  )
})
