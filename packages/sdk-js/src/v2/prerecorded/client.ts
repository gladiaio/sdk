import { readFileSync } from 'fs'
import { basename } from 'path'
import { sleep } from '../../helpers.js'
import type { InternalGladiaClientOptions } from '../../internal_types.js'
import { HttpClient } from '../../network/httpClient.js'
import { isUploadId, isWebUrl, prepareTranscribeInitBody } from './core.js'
import type {
  PreRecordedV2AudioUploadResponse,
  PreRecordedV2InitTranscriptionRequest,
  PreRecordedV2InitTranscriptionResponse,
  PreRecordedV2Response,
} from './generated-types.js'
import type { PreRecordedV2TranscribeOptions, PreRecordedV2TranscribeRequest } from './transcribe-request.js'

/**
 * Client used to interact with Gladia Pre-Recorded Speech-To-Text API.
 */
export class PreRecordedV2Client {
  private httpClient: HttpClient

  constructor(options: InternalGladiaClientOptions) {
    const httpBaseUrl = new URL(options.apiUrl)
    httpBaseUrl.protocol = httpBaseUrl.protocol.replace(/^ws/, 'http')
    this.httpClient = new HttpClient({
      baseUrl: httpBaseUrl,
      headers: options.httpHeaders,
      ...(options.region ? { queryParams: { region: options.region } } : {}),
      retry: options.httpRetry,
      timeout: options.httpTimeout,
    })
  }

  /**
   * Upload a local audio/video file and return its Gladia URL.
   * If `file` is a web URL (http/https), returns immediately with that URL (no upload).
   *
   * @param file - A file path (string), `File`, `Blob`, or a web URL (string).
   * @returns The upload response containing `audio_url` and `audio_metadata`.
   */
  async uploadFile(file: string | File | Blob): Promise<PreRecordedV2AudioUploadResponse> {
    if (typeof file === 'string' && isWebUrl(file)) {
      return {
        audio_url: file,
        audio_metadata: {
          id: '',
          filename: 'audio_url',
          extension: '',
          size: 0,
          audio_duration: 0,
          number_of_channels: 0,
        },
      }
    }

    const formData = new FormData()

    if (typeof file === 'string') {
      const fileBuffer = readFileSync(file)
      const filename = basename(file)
      const blob = new Blob([fileBuffer], { type: 'application/octet-stream' })
      formData.append('audio', blob, filename)
    } else {
      formData.append('audio', file)
    }

    return this.httpClient.post<PreRecordedV2AudioUploadResponse>('/v2/upload', {
      body: formData,
    })
  }

  /**
   * Initiate a new pre-recorded transcription job.
   *
   * @param options - The transcription request parameters including `audio_url`.
   * @returns A response containing the job `id` and `result_url` to poll.
   */
  async initiate(
    options: PreRecordedV2InitTranscriptionRequest
  ): Promise<PreRecordedV2InitTranscriptionResponse> {
    return this.httpClient.post<PreRecordedV2InitTranscriptionResponse>('/v2/pre-recorded', {
      body: JSON.stringify(options),
      headers: { 'content-type': 'application/json' },
    })
  }

  /**
   * Get a pre-recorded transcription job by ID.
   *
   * @param jobId - The UUID of the transcription job.
   * @returns The full job response including status and result if done.
   */
  async get(jobId: string): Promise<PreRecordedV2Response> {
    return this.httpClient.get<PreRecordedV2Response>(`/v2/pre-recorded/${jobId}`)
  }

  /**
   * Delete a pre-recorded transcription job.
   *
   * @param jobId - The UUID of the transcription job to delete.
   */
  async delete(jobId: string): Promise<void> {
    await this.httpClient.delete(`/v2/pre-recorded/${jobId}`)
  }

  /**
   * Download the audio file for a pre-recorded transcription job.
   *
   * @param jobId - The UUID of the transcription job.
   * @returns The raw audio file as an `ArrayBuffer`.
   */
  async getFile(jobId: string): Promise<ArrayBuffer> {
    const response = await this.httpClient.get<Response>(`/v2/pre-recorded/${jobId}/file`)
    return response.arrayBuffer()
  }

  /**
   * Poll a pre-recorded transcription job until it completes.
   *
   * Repeatedly fetches the job status until it reaches `"done"` or `"error"`.
   *
   * @param jobId - The UUID of the transcription job.
   * @param interval - Milliseconds between polling attempts (default: 3000).
   * @param timeout - Maximum milliseconds to wait before throwing. `undefined` means wait indefinitely.
   * @returns The completed job response.
   * @throws If the job status is `"error"` or the timeout is exceeded.
   */
  async poll(
    jobId: string,
    { interval = 3_000, timeout }: { interval?: number; timeout?: number } = {}
  ): Promise<PreRecordedV2Response> {
    const start = Date.now()
    while (true) {
      const result = await this.get(jobId)
      if (result.status === 'done') {
        return result
      }
      if (result.status === 'error') {
        throw new Error(`Pre-recorded job ${jobId} failed with error code: ${result.error_code}`)
      }
      if (timeout !== undefined && Date.now() - start >= timeout) {
        throw new Error(`Pre-recorded job ${jobId} did not complete within ${timeout}ms`)
      }
      await sleep(interval)
    }
  }

  /**
   * Initiate a pre-recorded transcription job and poll until completion.
   *
   * Convenience method that combines `initiate` and `poll`.
   *
   * @param options - The transcription request parameters including `audio_url`.
   * @param interval - Milliseconds between polling attempts (default: 3000).
   * @param timeout - Maximum milliseconds to wait before throwing.
   * @returns The completed job response.
   */
  async initiateAndPoll(
    options: PreRecordedV2InitTranscriptionRequest,
    { interval = 3_000, timeout }: { interval?: number; timeout?: number } = {}
  ): Promise<PreRecordedV2Response> {
    const initResponse = await this.initiate(options)
    return this.poll(initResponse.id, { interval, timeout })
  }

  /**
   * End-to-end flow: upload file (if needed), initiate a pre-recorded transcription, and poll until completion.
   * If `file` is a web URL or an upload id (UUID), no upload is performed.
   *
   * @param fileOrRequest - Either the audio source (path, URL, upload id, File, or Blob) or a single `PreRecordedV2TranscribeRequest` object.
   * @param options - Optional transcription parameters (without `audio_url`). Ignored when first arg is `PreRecordedV2TranscribeRequest`.
   * @param pollOptions - Optional `interval` (ms) and `timeout` (ms). Ignored when first arg is `PreRecordedV2TranscribeRequest`.
   * @returns The completed job response.
   */
  async transcribe(
    fileOrRequest:
      | string
      | File
      | Blob
      | PreRecordedV2TranscribeRequest,
    options?: PreRecordedV2TranscribeOptions | PreRecordedV2InitTranscriptionRequest | null,
    pollOptions?: { interval?: number; timeout?: number }
  ): Promise<PreRecordedV2Response> {
    let file: string | File | Blob
    let opts: PreRecordedV2TranscribeOptions | PreRecordedV2InitTranscriptionRequest | Record<string, unknown> | null | undefined
    let interval = 3_000
    let timeout: number | undefined

    if (
      typeof fileOrRequest === 'object' &&
      fileOrRequest !== null &&
      'file' in fileOrRequest &&
      (typeof (fileOrRequest as PreRecordedV2TranscribeRequest).file === 'string' ||
        (fileOrRequest as PreRecordedV2TranscribeRequest).file instanceof File ||
        (fileOrRequest as PreRecordedV2TranscribeRequest).file instanceof Blob)
    ) {
      const req = fileOrRequest as PreRecordedV2TranscribeRequest
      file = req.file
      opts = req.options ?? undefined
      interval = req.interval ?? 3_000
      timeout = req.timeout
    } else {
      file = fileOrRequest as string | File | Blob
      opts = options ?? undefined
      interval = pollOptions?.interval ?? 3_000
      timeout = pollOptions?.timeout
    }

    let audioUrl: string
    if (typeof file === 'string' && (isWebUrl(file) || isUploadId(file))) {
      audioUrl = file
    } else {
      const uploadResponse = await this.uploadFile(file)
      audioUrl = uploadResponse.audio_url
    }

    const body = prepareTranscribeInitBody(opts, audioUrl)
    return this.initiateAndPoll(body, { interval, timeout })
  }
}
