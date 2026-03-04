import { readFileSync } from 'fs'
import { basename } from 'path'
import { sleep } from '../../helpers.js'
import type { InternalGladiaClientOptions } from '../../internal_types.js'
import { HttpClient } from '../../network/httpClient.js'
import type {
  PreRecordedV2AudioUploadResponse,
  PreRecordedV2InitTranscriptionRequest,
  PreRecordedV2InitTranscriptionResponse,
  PreRecordedV2Response,
} from './generated-types.js'

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
   *
   * @param file - A file path (string), `File`, or `Blob`.
   * @returns The upload response containing `audio_url` and `audio_metadata`.
   */
  async uploadFile(file: string | File | Blob): Promise<PreRecordedV2AudioUploadResponse> {
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
   * Create a new pre-recorded transcription job.
   *
   * @param options - The transcription request parameters including `audio_url`.
   * @returns A response containing the job `id` and `result_url` to poll.
   */
  async create(
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
   * @returns `true` if the job was deleted successfully (HTTP 202), `false` otherwise.
   */
  async delete(jobId: string): Promise<boolean> {
    const response = await this.httpClient.delete<Response>(`/v2/pre-recorded/${jobId}`)
    return response.status === 202
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
   * Create a pre-recorded transcription job and poll until completion.
   *
   * Convenience method that combines `create` and `poll`.
   *
   * @param options - The transcription request parameters including `audio_url`.
   * @param interval - Milliseconds between polling attempts (default: 3000).
   * @param timeout - Maximum milliseconds to wait before throwing.
   * @returns The completed job response.
   */
  async createAndPoll(
    options: PreRecordedV2InitTranscriptionRequest,
    { interval = 3_000, timeout }: { interval?: number; timeout?: number } = {}
  ): Promise<PreRecordedV2Response> {
    const initResponse = await this.create(options)
    return this.poll(initResponse.id, { interval, timeout })
  }

  /**
   * Upload a local audio file and transcribe it, polling until completion.
   *
   * Convenience method that combines `uploadFile`, `create`, and `poll`.
   *
   * @param file - A file path (string), `File`, or `Blob` to upload and transcribe.
   * @param options - The transcription request parameters (without `audio_url`).
   * @param interval - Milliseconds between polling attempts (default: 3000).
   * @param timeout - Maximum milliseconds to wait before throwing.
   * @returns The completed job response.
   */
  async transcribe(
    file: string | File | Blob,
    options: Omit<PreRecordedV2InitTranscriptionRequest, 'audio_url'>,
    { interval = 3_000, timeout }: { interval?: number; timeout?: number } = {}
  ): Promise<PreRecordedV2Response> {
    const uploadResponse = await this.uploadFile(file)
    return this.createAndPoll(
      { ...options, audio_url: uploadResponse.audio_url },
      { interval, timeout }
    )
  }
}
