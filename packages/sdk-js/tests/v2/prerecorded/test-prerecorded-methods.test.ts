/**
 * Unit tests for PreRecordedV2Client API methods (uploadFile, initiate, get, getFile, poll, etc.).
 * These tests mock the HTTP layer: no API key or real audio is required.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InternalGladiaClientOptions } from '../../../src/internal_types.js'
import { PreRecordedV2Client } from '../../../src/v2/prerecorded/client.js'
import type {
  PreRecordedV2InitTranscriptionRequest,
  PreRecordedV2InitTranscriptionResponse,
  PreRecordedV2Response,
} from '../../../src/v2/prerecorded/generated-types.js'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockDelete = vi.fn()

vi.mock('../../../src/network/httpClient.js', () => ({
  HttpClient: vi.fn().mockImplementation(function (this: any) {
    this.get = mockGet
    this.post = mockPost
    this.delete = mockDelete
    return this
  }),
}))

const mockReadFileSync = vi.fn()
vi.mock('fs', () => ({
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
}))

function defaultOptions(overrides?: Partial<InternalGladiaClientOptions>): InternalGladiaClientOptions {
  return {
    apiUrl: 'https://api.gladia.io',
    httpHeaders: { 'x-gladia-version': 'SdkJavascript/0.0.0' },
    httpRetry: {
      maxAttempts: 2,
      statusCodes: [408, 413, 429, [500, 599]],
      delay: () => 100,
    },
    httpTimeout: 10_000,
    wsRetry: {
      maxAttemptsPerConnection: 5,
      closeCodes: [
        [1002, 4399],
        [4500, 9999],
      ],
      delay: () => 100,
      maxConnections: 0,
    },
    wsTimeout: 10_000,
    ...overrides,
  }
}

function uploadResponseJson(audioUrl = 'https://api.gladia.io/v2/upload/abc-123', uploadId = 'abc-123') {
  return {
    audio_url: audioUrl,
    audio_metadata: {
      id: uploadId,
      filename: 'test.wav',
      extension: 'wav',
      size: 1024,
      audio_duration: 5.0,
      number_of_channels: 1,
    },
  }
}

function initResponseJson(jobId = 'job-456', resultUrl = 'https://api.gladia.io/v2/pre-recorded/job-456') {
  return { id: jobId, result_url: resultUrl }
}

function jobResponseJson(
  jobId = 'job-456',
  status: string = 'done',
  requestId = 'req-1',
  version = 1,
  createdAt = '2025-01-01T00:00:00Z',
  errorCode: number | null = null
) {
  return {
    id: jobId,
    request_id: requestId,
    version,
    status,
    created_at: createdAt,
    kind: 'pre-recorded',
    error_code: errorCode,
    file: null,
    request_params: null,
    result: null,
  }
}

describe('PreRecordedV2Client methods', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({})
    mockPost.mockResolvedValue({})
    mockDelete.mockResolvedValue(undefined)
    mockReadFileSync.mockReturnValue(Buffer.from('audio bytes'))
  })

  describe('uploadFile', () => {
    it('returns synthetic response for web URL without calling POST', async () => {
      const client = new PreRecordedV2Client(defaultOptions())
      const url = 'https://example.com/audio.wav'
      const result = await client.uploadFile(url)

      expect(mockPost).not.toHaveBeenCalled()
      expect(result.audio_url).toBe(url)
      expect(result.audio_metadata.filename).toBe('audio_url')
      expect(result.audio_metadata.id).toBe('')
    })

    it('calls POST /v2/upload with FormData when given a file path', async () => {
      const payload = uploadResponseJson()
      mockPost.mockResolvedValue(payload)

      const client = new PreRecordedV2Client(defaultOptions())
      const result = await client.uploadFile('/tmp/test.wav')

      expect(mockPost).toHaveBeenCalledTimes(1)
      expect(mockPost.mock.calls[0][0]).toBe('/v2/upload')
      expect((mockPost.mock.calls[0][1] as any).body).toBeInstanceOf(FormData)
      expect(result.audio_url).toBe(payload.audio_url)
      expect(result.audio_metadata.id).toBe(payload.audio_metadata.id)
    })

    it('with Blob: appends blob and posts to /v2/upload', async () => {
      mockPost.mockResolvedValue(uploadResponseJson())
      const blob = new Blob(['data'], { type: 'audio/wav' })
      const client = new PreRecordedV2Client(defaultOptions())

      await client.uploadFile(blob)

      expect(mockReadFileSync).not.toHaveBeenCalled()
      expect(mockPost).toHaveBeenCalledWith('/v2/upload', expect.objectContaining({ body: expect.any(FormData) }))
      const formData = (mockPost.mock.calls[0][1] as any).body as FormData
      const uploaded = formData.get('audio')
      expect(uploaded).toBeInstanceOf(Blob)
      expect((uploaded as Blob).size).toBe(blob.size)
      expect((uploaded as Blob).type).toBe(blob.type)
    })
  })

  describe('initiate', () => {
    it('initiate: calls POST /v2/pre-recorded with JSON body', async () => {
      const initResp = initResponseJson()
      mockPost.mockResolvedValue(initResp)

      const client = new PreRecordedV2Client(defaultOptions())
      const body: PreRecordedV2InitTranscriptionRequest = { audio_url: 'https://uploaded/audio' }
      const result = await client.initiate(body)

      expect(mockPost).toHaveBeenCalledWith('/v2/pre-recorded', {
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
      })
      expect(result.id).toBe(initResp.id)
      expect(result.result_url).toBe(initResp.result_url)
    })
  })

  describe('get', () => {
    it('calls GET /v2/pre-recorded/:jobId', async () => {
      const jobId = 'job-789'
      const job = jobResponseJson(jobId, 'done')
      mockGet.mockResolvedValue(job)

      const client = new PreRecordedV2Client(defaultOptions())
      const result = await client.get(jobId)

      expect(mockGet).toHaveBeenCalledWith(`/v2/pre-recorded/${jobId}`)
      expect(result.id).toBe(jobId)
      expect(result.status).toBe('done')
    })
  })

  describe('delete', () => {
    it('calls DELETE /v2/pre-recorded/:jobId', async () => {
      const jobId = 'job-delete-me'
      const client = new PreRecordedV2Client(defaultOptions())
      await client.delete(jobId)
      expect(mockDelete).toHaveBeenCalledWith(`/v2/pre-recorded/${jobId}`)
    })
  })

  describe('getFile', () => {
    it('calls GET /v2/pre-recorded/:jobId/file and returns ArrayBuffer', async () => {
      const buffer = new ArrayBuffer(16)
      mockGet.mockResolvedValue(new Response(buffer))

      const client = new PreRecordedV2Client(defaultOptions())
      const result = await client.getFile('job-file')

      expect(mockGet).toHaveBeenCalledWith('/v2/pre-recorded/job-file/file')
      expect(result).toBeInstanceOf(ArrayBuffer)
      expect(new Uint8Array(result)).toEqual(new Uint8Array(buffer))
    })
  })

  describe('poll', () => {
    it('returns when status is done', async () => {
      const job = jobResponseJson('job-poll', 'done')
      mockGet.mockResolvedValue(job)

      const client = new PreRecordedV2Client(defaultOptions())
      const result = await client.poll('job-poll', { interval: 10, timeout: 120_000 })

      expect(mockGet).toHaveBeenCalledWith('/v2/pre-recorded/job-poll')
      expect(result.status).toBe('done')
    })

    it('throws when status is error', async () => {
      const job = jobResponseJson('job-err', 'error', 'req-1', 1, '2025-01-01T00:00:00Z', 500)
      mockGet.mockResolvedValue(job)

      const client = new PreRecordedV2Client(defaultOptions())
      await expect(client.poll('job-err', { interval: 10, timeout: 1000 })).rejects.toThrow(
        /job-err.*500/
      )
    })

    it('throws when timeout is exceeded', async () => {
      mockGet.mockResolvedValue(jobResponseJson('job-timeout', 'processing'))

      const client = new PreRecordedV2Client(defaultOptions())
      await expect(
        client.poll('job-timeout', { interval: 5, timeout: 15 })
      ).rejects.toThrow(/did not complete within 15ms/)
    })
  })

  describe('initiateAndPoll', () => {
    it('calls initiate then poll with returned id', async () => {
      const initResp = initResponseJson('job-cp')
      const jobResp = jobResponseJson('job-cp', 'done')
      mockPost.mockResolvedValue(initResp)
      mockGet.mockResolvedValue(jobResp)

      const client = new PreRecordedV2Client(defaultOptions())
      const opts: PreRecordedV2InitTranscriptionRequest = { audio_url: 'https://example.com/a.wav' }
      const result = await client.initiateAndPoll(opts, { interval: 10, timeout:120_000 })

      expect(mockPost).toHaveBeenCalledTimes(1)
      expect(mockGet).toHaveBeenCalledWith('/v2/pre-recorded/job-cp')
      expect(result.id).toBe('job-cp')
      expect(result.status).toBe('done')
    })
  })

  describe('transcribe', () => {
    it('calls uploadFile then initiateAndPoll when given file + options', async () => {
      const uploadPayload = uploadResponseJson('https://api.gladia.io/v2/upload/up-1')
      const initResp = initResponseJson('job-t2')
      const jobResp = jobResponseJson('job-t2', 'done')
      mockPost
        .mockResolvedValueOnce(uploadPayload)
        .mockResolvedValueOnce(initResp)
      mockGet.mockResolvedValue(jobResp)

      const client = new PreRecordedV2Client(defaultOptions())
      const blob = new Blob(['audio'])
      const result = await client.transcribe(blob, { language: 'en' }, { interval: 10, timeout: 120_000 })

      expect(mockPost).toHaveBeenCalledTimes(2)
      expect(mockPost.mock.calls[0][0]).toBe('/v2/upload')
      expect(mockPost.mock.calls[1][0]).toBe('/v2/pre-recorded')
      expect(result.status).toBe('done')
    })

    it('skips upload when file is a web URL and uses it as audio_url', async () => {
      const audioUrl = 'https://example.com/speech.wav'
      const initResp = initResponseJson('job-url')
      const jobResp = jobResponseJson('job-url', 'done')
      mockPost.mockResolvedValueOnce(initResp)
      mockGet.mockResolvedValue(jobResp)

      const client = new PreRecordedV2Client(defaultOptions())
      const result = await client.transcribe(audioUrl, { language: 'en' }, { interval: 10, timeout: 120_000 })

      expect(mockPost).toHaveBeenCalledTimes(1)
      expect(mockPost.mock.calls[0][0]).toBe('/v2/pre-recorded')
      const body = JSON.parse((mockPost.mock.calls[0][1] as any).body)
      expect(body.audio_url).toBe(audioUrl)
      expect(result.status).toBe('done')
    })

    it('skips upload when file is an upload id (UUID) and uses it as audio_url', async () => {
      const uploadId = '550e8400-e29b-41d4-a716-446655440000'
      const initResp = initResponseJson('job-uuid')
      const jobResp = jobResponseJson('job-uuid', 'done')
      mockPost.mockResolvedValueOnce(initResp)
      mockGet.mockResolvedValue(jobResp)

      const client = new PreRecordedV2Client(defaultOptions())
      const result = await client.transcribe(uploadId, { language: 'fr' }, { interval: 10, timeout: 120_000 })

      expect(mockPost).toHaveBeenCalledTimes(1)
      expect(mockPost.mock.calls[0][0]).toBe('/v2/pre-recorded')
      const body = JSON.parse((mockPost.mock.calls[0][1] as any).body)
      expect(body.audio_url).toBe(uploadId)
      expect(result.status).toBe('done')
    })

    it('accepts PreRecordedV2TranscribeRequest object and uses file, options, interval, timeout', async () => {
      const initResp = initResponseJson('job-req')
      const jobResp = jobResponseJson('job-req', 'done')
      mockPost.mockResolvedValueOnce(initResp)
      mockGet.mockResolvedValue(jobResp)

      const client = new PreRecordedV2Client(defaultOptions())
      const result = await client.transcribe({
        file: 'https://example.com/audio.mp3',
        options: { language: 'de' },
        interval: 50,
        timeout: 5_000,
      })

      expect(mockPost).toHaveBeenCalledTimes(1)
      const body = JSON.parse((mockPost.mock.calls[0][1] as any).body)
      expect(body.audio_url).toBe('https://example.com/audio.mp3')
      expect(body.language).toBe('de')
      expect(result.status).toBe('done')
    })
  })
})
