import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InternalGladiaClientOptions } from '../../internal_types.js'
import { HttpClient } from '../../network/httpClient.js'
import { WebSocketClient, WS_STATES } from '../../network/wsClient.js'
import { LiveV2Client } from './client.js'
import type {
  LiveV2CallbackConfig,
  LiveV2InitRequest,
  LiveV2LanguageConfig,
  LiveV2MessagesConfig,
  LiveV2PostProcessingConfig,
  LiveV2PreProcessingConfig,
  LiveV2RealtimeProcessingConfig,
} from './generated-types.js'

function makeOptions(
  overrides: Partial<InternalGladiaClientOptions> = {}
): InternalGladiaClientOptions {
  return {
    apiKey: 'test-key',
    apiUrl: 'https://api.gladia.io',
    httpHeaders: { 'x-gladia-key': 'test-key' },
    httpRetry: { maxAttempts: 1, statusCodes: [], delay: () => 0 },
    httpTimeout: 10_000,
    wsRetry: {
      maxAttemptsPerConnection: 1,
      closeCodes: [],
      delay: () => 0,
      maxConnections: 1,
    },
    wsTimeout: 10_000,
    prerecordedTimeouts: {
      transcribe: 7_200_000,
      poll: 7_200_000,
      createAndPoll: 7_200_000,
      uploadFile: 300_000,
      getFile: 300_000,
      create: 60_000,
      delete: 60_000,
      get: 10_000,
      list: 10_000,
    },
    liveTimeouts: {
      get: 10_000,
      delete: 60_000,
      getFile: 300_000,
      list: 10_000,
    },
    ...overrides,
  } as InternalGladiaClientOptions
}

describe('LiveV2Client.startSession region wiring', () => {
  let postSpy: ReturnType<typeof vi.spyOn>
  let createSessionSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.restoreAllMocks()

    postSpy = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({
      id: 'created-session-id',
      url: 'wss://api.gladia.io/v2/live/ws?token=created',
      created_at: '2026-06-25T09:00:00Z',
    })

    createSessionSpy = vi.spyOn(WebSocketClient.prototype, 'createSession').mockReturnValue({
      readyState: WS_STATES.CONNECTING,
      onconnecting: null,
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
      send: vi.fn(),
      close: vi.fn(),
    } as never)
  })

  async function tick(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  it('passes region from GladiaClient options through startSession to POST /v2/live', async () => {
    const client = new LiveV2Client(makeOptions({ region: 'us-west' }))
    const session = client.startSession({ sample_rate: 16000 })

    await tick()

    expect(postSpy).toHaveBeenCalledTimes(1)
    expect(postSpy).toHaveBeenCalledWith(
      '/v2/live?region=us-west',
      expect.objectContaining({
        body: expect.stringContaining('"sample_rate":16000'),
      })
    )
    expect(createSessionSpy).toHaveBeenCalledWith('wss://api.gladia.io/v2/live/ws?token=created')
    expect(await session.getSessionId()).toBe('created-session-id')

    session.endSession()
  })

  it('does not put region on POST /v2/live when region is unset', async () => {
    const client = new LiveV2Client(makeOptions())
    const session = client.startSession({ sample_rate: 16000 })

    await tick()

    expect(postSpy).toHaveBeenCalledWith(
      '/v2/live',
      expect.objectContaining({
        body: expect.stringContaining('"sample_rate":16000'),
      })
    )

    session.endSession()
  })

  it('sends every init option, known or not, unchanged to POST /v2/live', async () => {
    // Every known option is set: `Required<...>` flags a new option added to the generated types
    // and not covered here. The request body must then match the options exactly.
    const knownOptions = {
      encoding: 'wav/pcm',
      bit_depth: 16,
      sample_rate: 16000,
      channels: 1,
      custom_metadata: { user: 'test' },
      model: 'solaria-1',
      endpointing: 0.3,
      maximum_duration_without_endpointing: 5,
      language_config: {
        languages: ['en', 'fr'],
        code_switching: true,
      } satisfies Required<LiveV2LanguageConfig>,
      pre_processing: {
        audio_enhancer: true,
        speech_threshold: 0.6,
      } satisfies Required<LiveV2PreProcessingConfig>,
      realtime_processing: {
        custom_vocabulary: true,
        custom_vocabulary_config: {
          vocabulary: ['Gladia', { value: 'Solaria', intensity: 0.5, pronunciations: ['solaria'] }],
          default_intensity: 0.4,
        },
        custom_spelling: true,
        custom_spelling_config: { spelling_dictionary: { SQL: ['sequel'] } },
        translation: true,
        translation_config: {
          target_languages: ['es'],
          model: 'enhanced',
          match_original_utterances: true,
          lipsync: true,
          context_adaptation: true,
          context: 'A meeting',
          informal: false,
        },
        named_entity_recognition: true,
        sentiment_analysis: true,
      } satisfies Required<LiveV2RealtimeProcessingConfig>,
      post_processing: {
        summarization: true,
        summarization_config: { type: 'bullet_points' },
        chapterization: true,
      } satisfies Required<LiveV2PostProcessingConfig>,
      messages_config: {
        receive_partial_transcripts: true,
        receive_final_transcripts: true,
        receive_speech_events: true,
        receive_pre_processing_events: true,
        receive_realtime_processing_events: true,
        receive_post_processing_events: true,
        receive_acknowledgments: false,
        receive_errors: true,
        receive_lifecycle_events: true,
      } satisfies Required<LiveV2MessagesConfig>,
      callback: true,
      callback_config: {
        url: 'https://example.com/callback',
        receive_partial_transcripts: true,
        receive_final_transcripts: true,
        receive_speech_events: true,
        receive_pre_processing_events: true,
        receive_realtime_processing_events: true,
        receive_post_processing_events: true,
        receive_acknowledgments: true,
        receive_errors: true,
        receive_lifecycle_events: true,
      } satisfies Required<LiveV2CallbackConfig>,
    } satisfies Required<LiveV2InitRequest>

    // Options the SDK doesn't know (yet) must be passed through too, at any depth
    const options = {
      ...knownOptions,
      model: 'solaria-3-fast',
      pii: { mode: 'mask', entities: ['EMAIL'] },
      end_of_turn: { threshold: 0.5 },
      realtime_processing: {
        ...knownOptions.realtime_processing,
        named_entity_recognition: { threshold: 0.5 },
        unknown_nested_option: 1,
      },
    } as unknown as LiveV2InitRequest

    const client = new LiveV2Client(makeOptions())
    const session = client.startSession(options)

    await tick()

    expect(postSpy).toHaveBeenCalledTimes(1)
    const [, { body }] = postSpy.mock.calls[0] as [string, { body: string }]
    expect(JSON.parse(body)).toEqual({
      ...options,
      // Forced on for resume, the only difference allowed
      messages_config: { ...knownOptions.messages_config, receive_acknowledgments: true },
    })

    session.endSession()
  })

  it('types the Gladia Enterprise options and sends them as they are', async () => {
    // `finals` is typed (no cast): a typo is a compile error, the value goes through untouched
    const client = new LiveV2Client(makeOptions())
    const session = client.startSession({ encoding: 'wav/pcm', finals: 'sentence' })

    await tick()

    expect(postSpy).toHaveBeenCalledTimes(1)
    const [, { body }] = postSpy.mock.calls[0] as [string, { body: string }]
    expect(JSON.parse(body)).toEqual({
      encoding: 'wav/pcm',
      finals: 'sentence',
      messages_config: { receive_acknowledgments: true },
    })

    session.endSession()
  })
})
