import { sleep } from '../../helpers.js'
import type { InternalGladiaClientOptions } from '../../internal_types.js'
import { HttpClient } from '../../network/httpClient.js'
import type {
  PreRecordedV2AudioUploadResponse,
  PreRecordedV2InitTranscriptionRequest,
  PreRecordedV2InitTranscriptionResponse,
  PreRecordedV2Response,
} from './generated-types.js'

function isUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function resolveFlowDeadlineMs(
  timeout: number | null | undefined,
  configuredMs: number
): number | null {
  if (timeout === null) return null
  if (timeout !== undefined) return timeout
  return configuredMs
}

/**
 * Client used to interact with Gladia Pre-Recorded Speech-To-Text API.
 */
export class PreRecordedV2Client {
  private httpClient: HttpClient
  private readonly prerecordedTimeouts: InternalGladiaClientOptions['prerecordedTimeouts']

  constructor(options: InternalGladiaClientOptions) {
    const httpBaseUrl = new URL(options.apiUrl)
    httpBaseUrl.protocol = httpBaseUrl.protocol.replace(/^ws/, 'http')
    this.prerecordedTimeouts = options.prerecordedTimeouts
    this.httpClient = new HttpClient({
      baseUrl: httpBaseUrl,
      headers: options.httpHeaders,
      ...(options.region ? { queryParams: { region: options.region } } : {}),
      retry: options.httpRetry,
      timeout: options.httpTimeout,
    })
  }

  /**
   * Upload a local file and return an audio URL for transcription.
   *
   * @param audio_url - A file path (string), `File`, or `Blob`. When a string, it must be a local file path; URLs are not accepted.
   * @returns The upload response containing `audio_url` and `audio_metadata`.
   * @throws Error if `audio_url` is a string that is a URL (use a local file path, File, or Blob instead).
   */
  async uploadFile(audio_url: string | File | Blob): Promise<PreRecordedV2AudioUploadResponse> {
    if (typeof audio_url === 'string' && isUrl(audio_url)) {
      throw new Error(
        'Expected a file path; URLs are not accepted by uploadFile. Use a local file path, File, or Blob.'
      )
    }

    const formData = new FormData()

    if (typeof audio_url === 'string') {
      if (typeof process === 'undefined' || !process.versions?.node) {
        throw new Error(
          'Upload by file path is only supported in Node.js. In the browser, use a File or Blob.'
        )
      }
      const { readFileSync } = await import('fs')
      const { basename } = await import('path')
      const fileBuffer = readFileSync(audio_url)
      const filename = basename(audio_url)
      const blob = new Blob([fileBuffer], { type: 'application/octet-stream' })
      formData.append('audio', blob, filename)
    } else {
      formData.append('audio', audio_url)
    }

    return this.httpClient.post<PreRecordedV2AudioUploadResponse>('/v2/upload', {
      body: formData,
      requestTimeout: this.prerecordedTimeouts.uploadFile,
    })
  }

  /**
   * Create a new pre-recorded transcription job.
   *
   * @see https://docs.gladia.io/api-reference/v2/pre-recorded/init
   * @param options - The transcription request parameters including `audio_url`.
   * @returns A response containing the job `id` and `result_url` to poll.
   */
  async create(
    options: PreRecordedV2InitTranscriptionRequest
  ): Promise<PreRecordedV2InitTranscriptionResponse> {
    return this.httpClient.post<PreRecordedV2InitTranscriptionResponse>('/v2/pre-recorded', {
      body: JSON.stringify(options),
      headers: { 'content-type': 'application/json' },
      requestTimeout: this.prerecordedTimeouts.create,
    })
  }

  /**
   * Create a new pre-recorded transcription job with an untyped request (e.g. raw JSON).
   * Prefer {@link create} for type-safe requests.
   *
   * @see https://docs.gladia.io/api-reference/v2/pre-recorded/init
   * @param options - Raw request object (must include `audio_url` at runtime).
   * @returns A response containing the job `id` and `result_url` to poll.
   */
  async createUntyped(
    options: Record<string, unknown>
  ): Promise<PreRecordedV2InitTranscriptionResponse> {
    return this.httpClient.post<PreRecordedV2InitTranscriptionResponse>('/v2/pre-recorded', {
      body: JSON.stringify(options),
      headers: { 'content-type': 'application/json' },
      requestTimeout: this.prerecordedTimeouts.create,
    })
  }

  /**
   * Get a pre-recorded transcription job by ID.
   *
   * @param jobId - The UUID of the transcription job.
   * @returns The full job response including status and result if done.
   */
  async get(jobId: string): Promise<PreRecordedV2Response> {
    return this.httpClient.get<PreRecordedV2Response>(`/v2/pre-recorded/${jobId}`, {
      requestTimeout: this.prerecordedTimeouts.get,
    })
  }

  /**
   * Delete a pre-recorded transcription job.
   *
   * @param jobId - The UUID of the transcription job to delete.
   * @returns `true` if the job was deleted successfully (HTTP 202), `false` if the server responded with another 2xx status.
   * @throws When the server responds with an error HTTP status (e.g. 404).
   */
  async delete(jobId: string): Promise<boolean> {
    const response = await this.httpClient.delete<Response>(`/v2/pre-recorded/${jobId}`, {
      rawResponse: true,
      requestTimeout: this.prerecordedTimeouts.delete,
    })
    return response.status === 202
  }

  /**
   * Download the audio file for a pre-recorded transcription job.
   *
   * @param jobId - The UUID of the transcription job.
   * @returns The raw audio file as an `ArrayBuffer`.
   */
  async getFile(jobId: string): Promise<ArrayBuffer> {
    const response = await this.httpClient.get<Response>(`/v2/pre-recorded/${jobId}/file`, {
      requestTimeout: this.prerecordedTimeouts.getFile,
    })
    return response.arrayBuffer()
  }

  /**
   * Poll a pre-recorded transcription job until it completes.
   *
   * Repeatedly fetches the job status until it reaches `"done"` or `"error"`.
   *
   * @param jobId - The UUID of the transcription job.
   * @param interval - Milliseconds between polling attempts (default: 3000).
   * @param timeout - Maximum milliseconds to wait before throwing. Omitted uses
   *   `GladiaClientOptions.prerecordedTimeouts.poll`. `null` means no deadline.
   * @returns The completed job response.
   * @throws If the job status is `"error"` or the timeout is exceeded.
   */
  async poll(
    jobId: string,
    { interval = 3_000, timeout }: { interval?: number; timeout?: number | null } = {}
  ): Promise<PreRecordedV2Response> {
    const start = Date.now()
    const deadlineMs = resolveFlowDeadlineMs(timeout, this.prerecordedTimeouts.poll)
    while (true) {
      const result = await this.get(jobId)
      if (result.status === 'done') {
        return result
      }
      if (result.status === 'error') {
        throw new Error(`Pre-recorded job ${jobId} failed with error code: ${result.error_code}`)
      }
      if (deadlineMs !== null && Date.now() - start >= deadlineMs) {
        throw new Error(`Pre-recorded job ${jobId} did not complete within ${deadlineMs}ms`)
      }
      await sleep(interval)
    }
  }

  /**
   * Create a pre-recorded transcription job and poll until completion.
   *
   * Convenience method that combines `create` and `poll`.
   *
   * @see https://docs.gladia.io/api-reference/v2/pre-recorded/init
   * @see https://docs.gladia.io/api-reference/v2/pre-recorded/get
   * @param options - The transcription request parameters including `audio_url`.
   * @param interval - Milliseconds between polling attempts (default: 3000).
   * @param timeout - Maximum milliseconds to wait before throwing. Omitted uses
   *   `GladiaClientOptions.prerecordedTimeouts.createAndPoll`. `null` means no deadline.
   * @returns The completed job response.
   */
  async createAndPoll(
    options: PreRecordedV2InitTranscriptionRequest,
    { interval = 3_000, timeout }: { interval?: number; timeout?: number | null } = {}
  ): Promise<PreRecordedV2Response> {
    const initResponse = await this.create(options)
    return this.poll(initResponse.id, {
      interval,
      timeout: resolveFlowDeadlineMs(timeout, this.prerecordedTimeouts.createAndPoll),
    })
  }

  /**
   * Create a pre-recorded transcription job with an untyped request and poll until completion.
   * Prefer {@link createAndPoll} for type-safe requests.
   *
   * @see https://docs.gladia.io/api-reference/v2/pre-recorded/init
   * @see https://docs.gladia.io/api-reference/v2/pre-recorded/get
   * @param options - Raw request object (must include `audio_url` at runtime).
   * @param interval - Milliseconds between polling attempts (default: 3000).
   * @param timeout - Maximum milliseconds to wait before throwing. Omitted uses
   *   `GladiaClientOptions.prerecordedTimeouts.createAndPoll`. `null` means no deadline.
   * @returns The completed job response.
   */
  async createAndPollUntyped(
    options: Record<string, unknown>,
    { interval = 3_000, timeout }: { interval?: number; timeout?: number | null } = {}
  ): Promise<PreRecordedV2Response> {
    const initResponse = await this.createUntyped(options)
    return this.poll(initResponse.id, {
      interval,
      timeout: resolveFlowDeadlineMs(timeout, this.prerecordedTimeouts.createAndPoll),
    })
  }

  /**
   * Upload a local file or use a URL (YouTube, S3, etc.) and transcribe it, polling until completion.
   *
   * Convenience method that combines `uploadFile` (when `audio_url` is a path or File/Blob), `create`, and `poll`.
   * When `audio_url` is a string URL, skips upload and calls create with that URL directly.
   *
   * @param audio_url - A file path (string), URL (string), `File`, or `Blob`. When a string, can be either a local file path or an http(s) URL.
   * @param options - Optional transcription options (typed; `audio_url` is set from the uploaded/URL audio).
   * @param interval - Milliseconds between polling attempts (default: 3000).
   * @param timeout - Maximum milliseconds for polling after the job is submitted. Omitted uses
   *   `GladiaClientOptions.prerecordedTimeouts.transcribe`. `null` means no deadline.
   * @returns The completed job response.
   */
  async transcribe(
    audio_url: string | File | Blob,
    options?: Omit<PreRecordedV2InitTranscriptionRequest, 'audio_url'>,
    { interval = 3_000, timeout }: { interval?: number; timeout?: number | null } = {}
  ): Promise<PreRecordedV2Response> {
    const uploadResponse =
      typeof audio_url === 'string' && isUrl(audio_url)
        ? audio_url
        : await this.uploadFile(audio_url)
    const jobAudioUrl =
      typeof uploadResponse === 'string' ? uploadResponse : uploadResponse.audio_url
    return this.createAndPoll(
      { ...(options ?? {}), audio_url: jobAudioUrl },
      {
        interval,
        timeout: resolveFlowDeadlineMs(timeout, this.prerecordedTimeouts.transcribe),
      }
    )
  }

  /**
   * Transcribe audio with untyped options (e.g. raw JSON). Prefer {@link transcribe} for type-safe options.
   *
   * @see https://docs.gladia.io/api-reference/v2/upload/audio-file
   * @see https://docs.gladia.io/api-reference/v2/pre-recorded/init
   * @see https://docs.gladia.io/api-reference/v2/pre-recorded/get
   * @param audio_url - A file path (string), URL (string), `File`, or `Blob`.
   * @param options - Optional raw request options (merged with `audio_url` from upload/URL).
   * @param interval - Milliseconds between polling attempts (default: 3000).
   * @param timeout - Maximum milliseconds for polling after the job is submitted. Omitted uses
   *   `GladiaClientOptions.prerecordedTimeouts.transcribe`. `null` means no deadline.
   * @returns The completed job response.
   */
  async transcribeUntyped(
    audio_url: string | File | Blob,
    options?: Record<string, unknown>,
    { interval = 3_000, timeout }: { interval?: number; timeout?: number | null } = {}
  ): Promise<PreRecordedV2Response> {
    const uploadResponse =
      typeof audio_url === 'string' && isUrl(audio_url)
        ? audio_url
        : await this.uploadFile(audio_url)
    const jobAudioUrl =
      typeof uploadResponse === 'string' ? uploadResponse : uploadResponse.audio_url
    return this.createAndPollUntyped(
      { ...(options ?? {}), audio_url: jobAudioUrl },
      {
        interval,
        timeout: resolveFlowDeadlineMs(timeout, this.prerecordedTimeouts.transcribe),
      }
    )
  }
}
