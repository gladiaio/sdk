/**
 * Integration tests for LiveV2Client against the real API.
 * Run with GLADIA_API_KEY set. Optional: GLADIA_TEST_AUDIO_PATH for sending live audio.
 */

import { describe, expect, it } from 'vitest'
import { GladiaClient } from '../../src/client.js'
import type { LiveV2InitRequest } from '../../src/v2/live/generated-types.js'
import { getApiKey, getApiUrl, getAudioPath } from './helpers.js'

const requiresApiKey = () => !!getApiKey()

async function waitForSessionId(session: { getSessionId(): Promise<string> }, timeoutMs = 15_000): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const id = await session.getSessionId()
    if (id) return id
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('Session did not get session_id in time')
}

describe('Live integration', () => {
  function client() {
    const key = getApiKey()
    if (!key) throw new Error('GLADIA_API_KEY not set')
    return new GladiaClient({
      apiKey: key,
      apiUrl: getApiUrl(),
    }).liveV2()
  }

  it.skipIf(!requiresApiKey())('startSession with default options returns session with session_id', async () => {
    const c = client()
    const opts: LiveV2InitRequest = {}
    const session = c.startSession(opts)
    try {
      const sessionId = await waitForSessionId(session)
      expect(sessionId).toBeDefined()
      expect(session.sessionId).toBe(sessionId)
      expect(['starting', 'started', 'connecting', 'connected']).toContain(session.status)
    } finally {
      session.endSession()
    }
  })

  it.skipIf(!requiresApiKey())('startSession with encoding and sample_rate', async () => {
    const c = client()
    const opts: LiveV2InitRequest = {
      encoding: 'wav/pcm',
      sample_rate: 16000,
      channels: 1,
    }
    const session = c.startSession(opts)
    try {
      const sessionId = await waitForSessionId(session)
      expect(sessionId).toBeDefined()
    } finally {
      session.endSession()
    }
  })

  it.skipIf(!requiresApiKey())('get returns session data', async () => {
    const c = client()
    const session = c.startSession({})
    let sessionId: string
    try {
      sessionId = await waitForSessionId(session)
    } finally {
      session.endSession()
    }
    const result = await c.get(sessionId)
    expect(typeof result).toBe('object')
    expect(result.id === sessionId || 'id' in result).toBe(true)
  })

  it.skipIf(!requiresApiKey())('listTranscriptions returns dict', async () => {
    const c = client()
    const result = await c.listTranscriptions()
    expect(typeof result).toBe('object')
  })

  it.skipIf(!requiresApiKey())('listTranscriptions with limit', async () => {
    const c = client()
    const result = await c.listTranscriptions(10)
    expect(typeof result).toBe('object')
    const data = result.data ?? result.items ?? []
    if (Array.isArray(data)) expect(data.length).toBeLessThanOrEqual(10)
  })

  it.skipIf(!requiresApiKey() || !getAudioPath())(
    'startSession, send audio, stopRecording',
    async () => {
      const path = getAudioPath()
      if (!path) return
      const fs = await import('fs')
      const c = client()
      const opts: LiveV2InitRequest = {
        encoding: 'wav/pcm',
        sample_rate: 16000,
        channels: 1,
      }
      const session = c.startSession(opts)
      let sessionId: string
      try {
        sessionId = await waitForSessionId(session)
        expect(sessionId).toBeDefined()
        const buf = fs.readFileSync(path)
        const chunk = buf.subarray(0, Math.min(8192, buf.length))
        if (chunk.length) session.sendAudio(chunk)
        session.stopRecording()
        await new Promise((r) => setTimeout(r, 1000))
      } finally {
        session.endSession()
      }
      const data = await c.get(sessionId!)
      expect(typeof data).toBe('object')
    }
  )
})
