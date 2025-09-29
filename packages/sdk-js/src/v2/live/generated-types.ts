/*
 * This file is auto-generated. Do not edit manually.
 * Generated from OpenAPI schema.
 */

// Shared Types Types
export type LiveV2Encoding = 'wav/pcm' | 'wav/alaw' | 'wav/ulaw'

export type LiveV2BitDepth = 8 | 16 | 24 | 32

export type LiveV2SampleRate = 8000 | 16000 | 32000 | 44100 | 48000

export type LiveV2Model = 'solaria-1' | 'solaria-2'

export type LiveV2TranscriptionLanguageCode =
  | 'af'
  | 'am'
  | 'ar'
  | 'as'
  | 'az'
  | 'ba'
  | 'be'
  | 'bg'
  | 'bn'
  | 'bo'
  | 'br'
  | 'bs'
  | 'ca'
  | 'cs'
  | 'cy'
  | 'da'
  | 'de'
  | 'el'
  | 'en'
  | 'es'
  | 'et'
  | 'eu'
  | 'fa'
  | 'fi'
  | 'fo'
  | 'fr'
  | 'gl'
  | 'gu'
  | 'ha'
  | 'haw'
  | 'he'
  | 'hi'
  | 'hr'
  | 'ht'
  | 'hu'
  | 'hy'
  | 'id'
  | 'is'
  | 'it'
  | 'ja'
  | 'jw'
  | 'ka'
  | 'kk'
  | 'km'
  | 'kn'
  | 'ko'
  | 'la'
  | 'lb'
  | 'ln'
  | 'lo'
  | 'lt'
  | 'lv'
  | 'mg'
  | 'mi'
  | 'mk'
  | 'ml'
  | 'mn'
  | 'mr'
  | 'ms'
  | 'mt'
  | 'my'
  | 'ne'
  | 'nl'
  | 'nn'
  | 'no'
  | 'oc'
  | 'pa'
  | 'pl'
  | 'ps'
  | 'pt'
  | 'ro'
  | 'ru'
  | 'sa'
  | 'sd'
  | 'si'
  | 'sk'
  | 'sl'
  | 'sn'
  | 'so'
  | 'sq'
  | 'sr'
  | 'su'
  | 'sv'
  | 'sw'
  | 'ta'
  | 'te'
  | 'tg'
  | 'th'
  | 'tk'
  | 'tl'
  | 'tr'
  | 'tt'
  | 'uk'
  | 'ur'
  | 'uz'
  | 'vi'
  | 'yi'
  | 'yo'
  | 'yue'
  | 'zh'

export interface LiveV2LanguageConfig {
  /** If one language is set, it will be used for the transcription. Otherwise, language will be auto-detected by the model. */
  languages?: Array<LiveV2TranscriptionLanguageCode>
  /** If true, language will be auto-detected on each utterance. Otherwise, language will be auto-detected on first utterance and then used for the rest of the transcription. If one language is set, this option will be ignored. */
  code_switching?: boolean
}

export interface LiveV2PreProcessingConfig {
  /** If true, apply pre-processing to the audio stream to enhance the quality. */
  audio_enhancer?: boolean
  /** Sensitivity configuration for Speech Threshold. A value close to 1 will apply stricter thresholds, making it less likely to detect background sounds as speech. */
  speech_threshold?: number
}

export interface LiveV2CustomVocabularyEntry {
  /** The text used to replace in the transcription. */
  value: string
  /** The global intensity of the feature. */
  intensity?: number
  /** The pronunciations used in the transcription. */
  pronunciations?: Array<string>
  /** Specify the language in which it will be pronounced when sound comparison occurs. Default to transcription language. */
  language?: LiveV2TranscriptionLanguageCode
}

export interface LiveV2CustomVocabularyConfig {
  /** Specific vocabulary list to feed the transcription model with. Each item can be a string or an object with the following properties: value, intensity, pronunciations, language. */
  vocabulary: Array<LiveV2CustomVocabularyEntry | string>
  /** Default intensity for the custom vocabulary */
  default_intensity?: number
}

export interface LiveV2CustomSpellingConfig {
  /** The list of spelling applied on the audio transcription */
  spelling_dictionary: Record<string, Array<string>>
}

export type LiveV2TranslationLanguageCode =
  | 'af'
  | 'am'
  | 'ar'
  | 'as'
  | 'az'
  | 'ba'
  | 'be'
  | 'bg'
  | 'bn'
  | 'bo'
  | 'br'
  | 'bs'
  | 'ca'
  | 'cs'
  | 'cy'
  | 'da'
  | 'de'
  | 'el'
  | 'en'
  | 'es'
  | 'et'
  | 'eu'
  | 'fa'
  | 'fi'
  | 'fo'
  | 'fr'
  | 'gl'
  | 'gu'
  | 'ha'
  | 'haw'
  | 'he'
  | 'hi'
  | 'hr'
  | 'ht'
  | 'hu'
  | 'hy'
  | 'id'
  | 'is'
  | 'it'
  | 'ja'
  | 'jw'
  | 'ka'
  | 'kk'
  | 'km'
  | 'kn'
  | 'ko'
  | 'la'
  | 'lb'
  | 'ln'
  | 'lo'
  | 'lt'
  | 'lv'
  | 'mg'
  | 'mi'
  | 'mk'
  | 'ml'
  | 'mn'
  | 'mr'
  | 'ms'
  | 'mt'
  | 'my'
  | 'ne'
  | 'nl'
  | 'nn'
  | 'no'
  | 'oc'
  | 'pa'
  | 'pl'
  | 'ps'
  | 'pt'
  | 'ro'
  | 'ru'
  | 'sa'
  | 'sd'
  | 'si'
  | 'sk'
  | 'sl'
  | 'sn'
  | 'so'
  | 'sq'
  | 'sr'
  | 'su'
  | 'sv'
  | 'sw'
  | 'ta'
  | 'te'
  | 'tg'
  | 'th'
  | 'tk'
  | 'tl'
  | 'tr'
  | 'tt'
  | 'uk'
  | 'ur'
  | 'uz'
  | 'vi'
  | 'wo'
  | 'yi'
  | 'yo'
  | 'yue'
  | 'zh'

export type LiveV2TranslationModel = 'base' | 'enhanced'

export interface LiveV2TranslationConfig {
  /** Target language in `iso639-1` format you want the transcription translated to */
  target_languages: Array<LiveV2TranslationLanguageCode>
  /** Model you want the translation model to use to translate */
  model?: LiveV2TranslationModel
  /** Align translated utterances with the original ones */
  match_original_utterances?: boolean
  /** Whether to apply lipsync to the translated transcription.  */
  lipsync?: boolean
  /** Enables or disables context-aware translation features that allow the model to adapt translations based on provided context. */
  context_adaptation?: boolean
  /** Context information to improve translation accuracy */
  context?: string
  /** Forces the translation to use informal language forms when available in the target language. */
  informal?: boolean
}

export interface LiveV2RealtimeProcessingConfig {
  /** If true, enable custom vocabulary for the transcription. */
  custom_vocabulary?: boolean
  /** Custom vocabulary configuration, if `custom_vocabulary` is enabled */
  custom_vocabulary_config?: LiveV2CustomVocabularyConfig
  /** If true, enable custom spelling for the transcription. */
  custom_spelling?: boolean
  /** Custom spelling configuration, if `custom_spelling` is enabled */
  custom_spelling_config?: LiveV2CustomSpellingConfig
  /** If true, enable translation for the transcription */
  translation?: boolean
  /** Translation configuration, if `translation` is enabled */
  translation_config?: LiveV2TranslationConfig
  /** If true, enable named entity recognition for the transcription. */
  named_entity_recognition?: boolean
  /** If true, enable sentiment analysis for the transcription. */
  sentiment_analysis?: boolean
}

export type LiveV2SummaryType = 'general' | 'bullet_points' | 'concise'

export interface LiveV2SummarizationConfig {
  /** The type of summarization to apply */
  type?: LiveV2SummaryType
}

export interface LiveV2PostProcessingConfig {
  /** If true, generates summarization for the whole transcription. */
  summarization?: boolean
  /** Summarization configuration, if `summarization` is enabled */
  summarization_config?: LiveV2SummarizationConfig
  /** If true, generates chapters for the whole transcription. */
  chapterization?: boolean
}

export interface LiveV2MessagesConfig {
  /** If true, partial transcript will be sent to websocket. */
  receive_partial_transcripts?: boolean
  /** If true, final transcript will be sent to websocket. */
  receive_final_transcripts?: boolean
  /** If true, begin and end speech events will be sent to websocket. */
  receive_speech_events?: boolean
  /** If true, pre-processing events will be sent to websocket. */
  receive_pre_processing_events?: boolean
  /** If true, realtime processing events will be sent to websocket. */
  receive_realtime_processing_events?: boolean
  /** If true, post-processing events will be sent to websocket. */
  receive_post_processing_events?: boolean
  /** If true, acknowledgments will be sent to websocket. */
  receive_acknowledgments?: boolean
  /** If true, errors will be sent to websocket. */
  receive_errors?: boolean
  /** If true, lifecycle events will be sent to websocket. */
  receive_lifecycle_events?: boolean
}

export interface LiveV2CallbackConfig {
  /** URL on which we will do a `POST` request with configured messages */
  url?: string
  /** If true, partial transcript will be sent to the defined callback. */
  receive_partial_transcripts?: boolean
  /** If true, final transcript will be sent to the defined callback. */
  receive_final_transcripts?: boolean
  /** If true, begin and end speech events will be sent to the defined callback. */
  receive_speech_events?: boolean
  /** If true, pre-processing events will be sent to the defined callback. */
  receive_pre_processing_events?: boolean
  /** If true, realtime processing events will be sent to the defined callback. */
  receive_realtime_processing_events?: boolean
  /** If true, post-processing events will be sent to the defined callback. */
  receive_post_processing_events?: boolean
  /** If true, acknowledgments will be sent to the defined callback. */
  receive_acknowledgments?: boolean
  /** If true, errors will be sent to the defined callback. */
  receive_errors?: boolean
  /** If true, lifecycle events will be sent to the defined callback. */
  receive_lifecycle_events?: boolean
}

export interface LiveV2Error {
  /** The error message */
  message: string
}

export interface LiveV2AudioChunkAckData {
  /** Range in bytes length of the audio chunk (relative to the whole session) */
  byte_range: Array<number>
  /** Range in seconds of the audio chunk (relative to the whole session) */
  time_range: Array<number>
}

export interface LiveV2EndRecordingMessageData {
  /** Total audio duration in seconds */
  recording_duration: number
}

export interface LiveV2Word {
  /** Spoken word */
  word: string
  /** Start timestamps in seconds of the spoken word */
  start: number
  /** End timestamps in seconds of the spoken word */
  end: number
  /** Confidence on the transcribed word (1 = 100% confident) */
  confidence: number
}

export interface LiveV2Utterance {
  /** Start timestamp in seconds of this utterance */
  start: number
  /** End timestamp in seconds of this utterance */
  end: number
  /** Confidence on the transcribed utterance (1 = 100% confident) */
  confidence: number
  /** Audio channel of where this utterance has been transcribed from */
  channel: number
  /** If `diarization` enabled, speaker identification number */
  speaker?: number
  /** List of words of the utterance, split by timestamp */
  words: Array<LiveV2Word>
  /** Transcription for this utterance */
  text: string
  /** Spoken language in this utterance */
  language: LiveV2TranscriptionLanguageCode
}

export interface LiveV2TranslationData {
  /** Id of the utterance used for this result */
  utterance_id: string
  /** The transcribed utterance */
  utterance: LiveV2Utterance
  /** The original language in `iso639-1` or `iso639-2` format depending on the language */
  original_language: LiveV2TranscriptionLanguageCode
  /** The target language in `iso639-1` or `iso639-2` format depending on the language */
  target_language: LiveV2TranslationLanguageCode
  /** The translated utterance */
  translated_utterance: LiveV2Utterance
}

export interface LiveV2NamedEntityRecognitionResult {
  entity_type: string
  text: string
  start: number
  end: number
}

export interface LiveV2NamedEntityRecognitionData {
  /** Id of the utterance used for this result */
  utterance_id: string
  /** The transcribed utterance */
  utterance: LiveV2Utterance
  /** The NER results */
  results: Array<LiveV2NamedEntityRecognitionResult>
}

export interface LiveV2ChapterizationSentence {
  sentence: string
  start: number
  end: number
  words: Array<LiveV2Word>
}

export interface LiveV2PostChapterizationResult {
  abstractive_summary?: string
  extractive_summary?: string
  summary?: string
  headline: string
  gist: string
  keywords: Array<string>
  start: number
  end: number
  sentences: Array<LiveV2ChapterizationSentence>
  text: string
}

export interface LiveV2PostChapterizationMessageData {
  /** The chapters */
  results: Array<LiveV2PostChapterizationResult>
}

export interface LiveV2TranscriptionMetadata {
  /** Duration of the transcribed audio file */
  audio_duration: number
  /** Number of distinct channels in the transcribed audio file */
  number_of_distinct_channels: number
  /** Billed duration in seconds (audio_duration * number_of_distinct_channels) */
  billing_time: number
  /** Duration of the transcription in seconds */
  transcription_time: number
}

export interface LiveV2AddonError {
  /** Status code of the addon error */
  status_code: number
  /** Reason of the addon error */
  exception: string
  /** Detailed message of the addon error */
  message: string
}

export interface LiveV2Sentences {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: LiveV2AddonError | null
  /** If `sentences` has been enabled, transcription as sentences. */
  results: Array<string> | null
}

export type LiveV2SubtitlesFormat = 'srt' | 'vtt'

export interface LiveV2Subtitle {
  /** Format of the current subtitle */
  format: LiveV2SubtitlesFormat
  /** Transcription on the asked subtitle format */
  subtitles: string
}

export interface LiveV2Transcription {
  /** All transcription on text format without any other information */
  full_transcript: string
  /** All the detected languages in the audio sorted from the most detected to the less detected */
  languages: Array<LiveV2TranscriptionLanguageCode>
  /** If `sentences` has been enabled, sentences results */
  sentences?: Array<LiveV2Sentences>
  /** If `subtitles` has been enabled, subtitles results */
  subtitles?: Array<LiveV2Subtitle>
  /** Transcribed speech utterances present in the audio */
  utterances: Array<LiveV2Utterance>
}

export interface LiveV2TranslationResult {
  /** Contains the error details of the failed addon */
  error: LiveV2AddonError | null
  /** All transcription on text format without any other information */
  full_transcript: string
  /** All the detected languages in the audio sorted from the most detected to the less detected */
  languages: Array<LiveV2TranslationLanguageCode>
  /** If `sentences` has been enabled, sentences results for this translation */
  sentences?: Array<LiveV2Sentences>
  /** If `subtitles` has been enabled, subtitles results for this translation */
  subtitles?: Array<LiveV2Subtitle>
  /** Transcribed speech utterances present in the audio */
  utterances: Array<LiveV2Utterance>
}

export interface LiveV2Translation {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: LiveV2AddonError | null
  /** List of translated transcriptions, one for each `target_languages` */
  results: Array<LiveV2TranslationResult> | null
}

export interface LiveV2Summarization {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: LiveV2AddonError | null
  /** If `summarization` has been enabled, summary of the transcription */
  results: string | null
}

export interface LiveV2NamedEntityRecognition {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: LiveV2AddonError | null
  /** If `named_entity_recognition` has been enabled, the detected entities. */
  entity: string
}

export interface LiveV2SentimentAnalysis {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: LiveV2AddonError | null
  /** If `sentiment_analysis` has been enabled, Gladia will analyze the sentiments and emotions of the audio */
  results: string
}

export interface LiveV2Chapterization {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: LiveV2AddonError | null
  /** If `chapterization` has been enabled, will generate chapters name for different parts of the given audio. */
  results: Record<string, any>
}

export interface LiveV2TranscriptionResult {
  /** Metadata for the given transcription & audio file */
  metadata: LiveV2TranscriptionMetadata
  /** Transcription of the audio speech */
  transcription?: LiveV2Transcription
  /** If `translation` has been enabled, translation of the audio speech transcription */
  translation?: LiveV2Translation
  /** If `summarization` has been enabled, summarization of the audio speech transcription */
  summarization?: LiveV2Summarization
  /** If `named_entity_recognition` has been enabled, the detected entities */
  named_entity_recognition?: LiveV2NamedEntityRecognition
  /** If `sentiment_analysis` has been enabled, sentiment analysis of the audio speech transcription */
  sentiment_analysis?: LiveV2SentimentAnalysis
  /** If `chapterization` has been enabled, will generate chapters name for different parts of the given audio. */
  chapterization?: LiveV2Chapterization
}

export interface LiveV2PostSummarizationMessageData {
  /** The summarization */
  results: string
}

export interface LiveV2SentimentAnalysisResult {
  sentiment: string
  emotion: string
  text: string
  start: number
  end: number
  channel: number
}

export interface LiveV2SentimentAnalysisData {
  /** Id of the utterance used for this result */
  utterance_id: string
  /** The transcribed utterance */
  utterance: LiveV2Utterance
  /** The sentiment analysis results */
  results: Array<LiveV2SentimentAnalysisResult>
}

export interface LiveV2StopRecordingAckData {
  /** Total audio duration in seconds */
  recording_duration: number
  /** Audio duration left to process in seconds */
  recording_left_to_process: number
}

export interface LiveV2TranscriptMessageData {
  /** Id of the utterance */
  id: string
  /** Flag to indicate if the transcript is final or not */
  is_final: boolean
  /** The transcribed utterance */
  utterance: LiveV2Utterance
}

export interface LiveV2SpeechMessageData {
  /** Timestamp in seconds of the speech event */
  time: number
  /** Channel of the speech event */
  channel: number
}

export interface LiveV2EventPayload {
  /** Id of the job */
  id: string
}

// Init Session Types
export interface LiveV2InitRequest {
  /** The encoding format of the audio stream. Supported formats: 
- PCM: 8, 16, 24, and 32 bits 
- A-law: 8 bits 
- μ-law: 8 bits 

Note: No need to add WAV headers to raw audio as the API supports both formats. */
  encoding?: LiveV2Encoding
  /** The bit depth of the audio stream */
  bit_depth?: LiveV2BitDepth
  /** The sample rate of the audio stream */
  sample_rate?: LiveV2SampleRate
  /** The number of channels of the audio stream */
  channels?: number
  /** Custom metadata you can attach to this live transcription */
  custom_metadata?: Record<string, any>
  /** The model used to process the audio. "solaria-1" is used by default. */
  model?: LiveV2Model
  /** The endpointing duration in seconds. Endpointing is the duration of silence which will cause an utterance to be considered as finished */
  endpointing?: number
  /** The maximum duration in seconds without endpointing. If endpointing is not detected after this duration, current utterance will be considered as finished */
  maximum_duration_without_endpointing?: number
  /** Specify the language configuration */
  language_config?: LiveV2LanguageConfig
  /** Specify the pre-processing configuration */
  pre_processing?: LiveV2PreProcessingConfig
  /** Specify the realtime processing configuration */
  realtime_processing?: LiveV2RealtimeProcessingConfig
  /** Specify the post-processing configuration */
  post_processing?: LiveV2PostProcessingConfig
  /** Specify the websocket messages configuration */
  messages_config?: LiveV2MessagesConfig
  /** If true, messages will be sent to configured url. */
  callback?: boolean
  /** Specify the callback configuration */
  callback_config?: LiveV2CallbackConfig
}

export interface LiveV2InitResponse {
  /** Id of the job */
  id: string
  /** Creation date */
  created_at: string
  /** The websocket url to connect to for sending audio data. The url will contain the temporary token to authenticate the session. */
  url: string
}

// WebSocket Messages Types
export interface LiveV2AudioChunkAckMessage {
  /** Id of the live session */
  session_id: string
  /** Date of creation of the message. The date is formatted as an ISO 8601 string */
  created_at: string
  /** Flag to indicate if the action was successfully acknowledged */
  acknowledged: boolean
  /** Error message if the action was not successfully acknowledged */
  error: LiveV2Error | null
  type: 'audio_chunk'
  /** The message data. "null" if the action was not successfully acknowledged */
  data: LiveV2AudioChunkAckData | null
}

export interface LiveV2EndRecordingMessage {
  /** Id of the live session */
  session_id: string
  /** Date of creation of the message. The date is formatted as an ISO 8601 string */
  created_at: string
  type: 'end_recording'
  /** The message data */
  data: LiveV2EndRecordingMessageData
}

export interface LiveV2EndSessionMessage {
  /** Id of the live session */
  session_id: string
  /** Date of creation of the message. The date is formatted as an ISO 8601 string */
  created_at: string
  type: 'end_session'
}

export interface LiveV2TranslationMessage {
  /** Id of the live session */
  session_id: string
  /** Date of creation of the message. The date is formatted as an ISO 8601 string */
  created_at: string
  /** Error message if the addon failed */
  error: LiveV2Error | null
  type: 'translation'
  /** The message data. "null" if the addon failed */
  data: LiveV2TranslationData | null
}

export interface LiveV2NamedEntityRecognitionMessage {
  /** Id of the live session */
  session_id: string
  /** Date of creation of the message. The date is formatted as an ISO 8601 string */
  created_at: string
  /** Error message if the addon failed */
  error: LiveV2Error | null
  type: 'named_entity_recognition'
  /** The message data. "null" if the addon failed */
  data: LiveV2NamedEntityRecognitionData | null
}

export interface LiveV2PostChapterizationMessage {
  /** Id of the live session */
  session_id: string
  /** Date of creation of the message. The date is formatted as an ISO 8601 string */
  created_at: string
  /** Error message if the addon failed */
  error: LiveV2Error | null
  type: 'post_chapterization'
  /** The message data. "null" if the addon failed */
  data: LiveV2PostChapterizationMessageData | null
}

export interface LiveV2PostFinalTranscriptMessage {
  /** Id of the live session */
  session_id: string
  /** Date of creation of the message. The date is formatted as an ISO 8601 string */
  created_at: string
  type: 'post_final_transcript'
  /** The message data */
  data: LiveV2TranscriptionResult
}

export interface LiveV2PostSummarizationMessage {
  /** Id of the live session */
  session_id: string
  /** Date of creation of the message. The date is formatted as an ISO 8601 string */
  created_at: string
  /** Error message if the addon failed */
  error: LiveV2Error | null
  type: 'post_summarization'
  /** The message data. "null" if the addon failed */
  data: LiveV2PostSummarizationMessageData | null
}

export interface LiveV2PostTranscriptMessage {
  /** Id of the live session */
  session_id: string
  /** Date of creation of the message. The date is formatted as an ISO 8601 string */
  created_at: string
  type: 'post_transcript'
  /** The message data */
  data: LiveV2Transcription
}

export interface LiveV2SentimentAnalysisMessage {
  /** Id of the live session */
  session_id: string
  /** Date of creation of the message. The date is formatted as an ISO 8601 string */
  created_at: string
  /** Error message if the addon failed */
  error: LiveV2Error | null
  type: 'sentiment_analysis'
  /** The message data. "null" if the addon failed */
  data: LiveV2SentimentAnalysisData | null
}

export interface LiveV2StartRecordingMessage {
  /** Id of the live session */
  session_id: string
  /** Date of creation of the message. The date is formatted as an ISO 8601 string */
  created_at: string
  type: 'start_recording'
}

export interface LiveV2StartSessionMessage {
  /** Id of the live session */
  session_id: string
  /** Date of creation of the message. The date is formatted as an ISO 8601 string */
  created_at: string
  type: 'start_session'
}

export interface LiveV2StopRecordingAckMessage {
  /** Id of the live session */
  session_id: string
  /** Date of creation of the message. The date is formatted as an ISO 8601 string */
  created_at: string
  /** Flag to indicate if the action was successfully acknowledged */
  acknowledged: boolean
  /** Error message if the action was not successfully acknowledged */
  error: LiveV2Error | null
  type: 'stop_recording'
  /** The message data. "null" if the action was not successfully acknowledged */
  data: LiveV2StopRecordingAckData | null
}

export interface LiveV2TranscriptMessage {
  /** Id of the live session */
  session_id: string
  /** Date of creation of the message. The date is formatted as an ISO 8601 string */
  created_at: string
  type: 'transcript'
  /** The message data */
  data: LiveV2TranscriptMessageData
}

export interface LiveV2SpeechStartMessage {
  /** Id of the live session */
  session_id: string
  /** Date of creation of the message. The date is formatted as an ISO 8601 string */
  created_at: string
  type: 'speech_start'
  /** The message data */
  data: LiveV2SpeechMessageData
}

export interface LiveV2SpeechEndMessage {
  /** Id of the live session */
  session_id: string
  /** Date of creation of the message. The date is formatted as an ISO 8601 string */
  created_at: string
  type: 'speech_end'
  /** The message data */
  data: LiveV2SpeechMessageData
}

// Union of all websocket messages
export type LiveV2WebSocketMessage =
  | LiveV2AudioChunkAckMessage
  | LiveV2EndRecordingMessage
  | LiveV2EndSessionMessage
  | LiveV2TranslationMessage
  | LiveV2NamedEntityRecognitionMessage
  | LiveV2PostChapterizationMessage
  | LiveV2PostFinalTranscriptMessage
  | LiveV2PostSummarizationMessage
  | LiveV2PostTranscriptMessage
  | LiveV2SentimentAnalysisMessage
  | LiveV2StartRecordingMessage
  | LiveV2StartSessionMessage
  | LiveV2StopRecordingAckMessage
  | LiveV2TranscriptMessage
  | LiveV2SpeechStartMessage
  | LiveV2SpeechEndMessage

// Callback Messages Types
export interface LiveV2CallbackAudioChunkAckMessage {
  /** Id of the job */
  id: string
  event: 'live.audio_chunk'
  /** The live message payload as sent to the WebSocket */
  payload: LiveV2AudioChunkAckMessage
}

export interface LiveV2CallbackEndRecordingMessage {
  /** Id of the job */
  id: string
  event: 'live.end_recording'
  /** The live message payload as sent to the WebSocket */
  payload: LiveV2EndRecordingMessage
}

export interface LiveV2CallbackEndSessionMessage {
  /** Id of the job */
  id: string
  event: 'live.end_session'
  /** The live message payload as sent to the WebSocket */
  payload: LiveV2EndSessionMessage
}

export interface LiveV2CallbackTranslationMessage {
  /** Id of the job */
  id: string
  event: 'live.translation'
  /** The live message payload as sent to the WebSocket */
  payload: LiveV2TranslationMessage
}

export interface LiveV2CallbackNamedEntityRecognitionMessage {
  /** Id of the job */
  id: string
  event: 'live.named_entity_recognition'
  /** The live message payload as sent to the WebSocket */
  payload: LiveV2NamedEntityRecognitionMessage
}

export interface LiveV2CallbackPostChapterizationMessage {
  /** Id of the job */
  id: string
  event: 'live.post_chapterization'
  /** The live message payload as sent to the WebSocket */
  payload: LiveV2PostChapterizationMessage
}

export interface LiveV2CallbackPostFinalTranscriptMessage {
  /** Id of the job */
  id: string
  event: 'live.post_final_transcript'
  /** The live message payload as sent to the WebSocket */
  payload: LiveV2PostFinalTranscriptMessage
}

export interface LiveV2CallbackPostSummarizationMessage {
  /** Id of the job */
  id: string
  event: 'live.post_summarization'
  /** The live message payload as sent to the WebSocket */
  payload: LiveV2PostSummarizationMessage
}

export interface LiveV2CallbackPostTranscriptMessage {
  /** Id of the job */
  id: string
  event: 'live.post_transcript'
  /** The live message payload as sent to the WebSocket */
  payload: LiveV2PostTranscriptMessage
}

export interface LiveV2CallbackSentimentAnalysisMessage {
  /** Id of the job */
  id: string
  event: 'live.sentiment_analysis'
  /** The live message payload as sent to the WebSocket */
  payload: LiveV2SentimentAnalysisMessage
}

export interface LiveV2CallbackStartRecordingMessage {
  /** Id of the job */
  id: string
  event: 'live.start_recording'
  /** The live message payload as sent to the WebSocket */
  payload: LiveV2StartRecordingMessage
}

export interface LiveV2CallbackStartSessionMessage {
  /** Id of the job */
  id: string
  event: 'live.start_session'
  /** The live message payload as sent to the WebSocket */
  payload: LiveV2StartSessionMessage
}

export interface LiveV2CallbackStopRecordingAckMessage {
  /** Id of the job */
  id: string
  event: 'live.stop_recording'
  /** The live message payload as sent to the WebSocket */
  payload: LiveV2StopRecordingAckMessage
}

export interface LiveV2CallbackTranscriptMessage {
  /** Id of the job */
  id: string
  event: 'live.transcript'
  /** The live message payload as sent to the WebSocket */
  payload: LiveV2TranscriptMessage
}

export interface LiveV2CallbackSpeechStartMessage {
  /** Id of the job */
  id: string
  event: 'live.speech_start'
  /** The live message payload as sent to the WebSocket */
  payload: LiveV2SpeechStartMessage
}

export interface LiveV2CallbackSpeechEndMessage {
  /** Id of the job */
  id: string
  event: 'live.speech_end'
  /** The live message payload as sent to the WebSocket */
  payload: LiveV2SpeechEndMessage
}

// Union of all callback messages
export type LiveV2CallbackMessage =
  | LiveV2CallbackAudioChunkAckMessage
  | LiveV2CallbackEndRecordingMessage
  | LiveV2CallbackEndSessionMessage
  | LiveV2CallbackTranslationMessage
  | LiveV2CallbackNamedEntityRecognitionMessage
  | LiveV2CallbackPostChapterizationMessage
  | LiveV2CallbackPostFinalTranscriptMessage
  | LiveV2CallbackPostSummarizationMessage
  | LiveV2CallbackPostTranscriptMessage
  | LiveV2CallbackSentimentAnalysisMessage
  | LiveV2CallbackStartRecordingMessage
  | LiveV2CallbackStartSessionMessage
  | LiveV2CallbackStopRecordingAckMessage
  | LiveV2CallbackTranscriptMessage
  | LiveV2CallbackSpeechStartMessage
  | LiveV2CallbackSpeechEndMessage

// Webhook Messages Types
export interface LiveV2WebhookStartSessionMessage {
  event: 'live.start_session'
  payload: LiveV2EventPayload
}

export interface LiveV2WebhookStartRecordingMessage {
  event: 'live.start_recording'
  payload: LiveV2EventPayload
}

export interface LiveV2WebhookEndRecordingMessage {
  event: 'live.end_recording'
  payload: LiveV2EventPayload
}

export interface LiveV2WebhookEndSessionMessage {
  event: 'live.end_session'
  payload: LiveV2EventPayload
}

// Union of all webhook messages
export type LiveV2WebhookMessage =
  | LiveV2WebhookStartSessionMessage
  | LiveV2WebhookStartRecordingMessage
  | LiveV2WebhookEndRecordingMessage
  | LiveV2WebhookEndSessionMessage
