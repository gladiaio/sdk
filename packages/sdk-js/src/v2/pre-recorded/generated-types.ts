/*
 * This file is auto-generated. Do not edit manually.
 * Generated from OpenAPI schema.
 */

// Shared Types Types
export interface PreRecordedV2AudioUploadMetadata {
  /** Uploaded audio file ID */
  id: string
  /** Uploaded audio filename */
  filename: string
  /** Uploaded audio source */
  source?: string
  /** Uploaded audio detected extension */
  extension: string
  /** Uploaded audio size */
  size: number
  /** Uploaded audio duration */
  audio_duration: number
  /** Uploaded audio channel numbers */
  number_of_channels: number
}

export type PreRecordedV2TranscriptionLanguageCode =
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
  | 'zh'

export interface PreRecordedV2CustomVocabularyEntry {
  /** The text used to replace in the transcription. */
  value: string
  /** The global intensity of the feature. */
  intensity?: number
  /** The pronunciations used in the transcription. */
  pronunciations?: Array<string>
  /** Specify the language in which it will be pronounced when sound comparison occurs. Default to transcription language. */
  language?: PreRecordedV2TranscriptionLanguageCode
}

export interface PreRecordedV2CustomVocabularyConfig {
  /** Specific vocabulary list to feed the transcription model with. Each item can be a string or an object with the following properties: value, intensity, pronunciations, language. */
  vocabulary: Array<PreRecordedV2CustomVocabularyEntry | string>
  /** Default intensity for the custom vocabulary */
  default_intensity?: number
}

export interface PreRecordedV2CodeSwitchingConfig {
  /** Specify the languages you want to use when detecting multiple languages */
  languages?: Array<PreRecordedV2TranscriptionLanguageCode>
}

export type PreRecordedV2CallbackMethod = 'POST' | 'PUT'

export interface PreRecordedV2CallbackConfig {
  /** The URL to be called with the result of the transcription */
  url: string
  /** The HTTP method to be used. Allowed values are `POST` or `PUT` (default: `POST`) */
  method?: PreRecordedV2CallbackMethod
}

export type PreRecordedV2SubtitlesFormat = 'srt' | 'vtt'

export type PreRecordedV2SubtitlesStyle = 'default' | 'compliance'

export interface PreRecordedV2SubtitlesConfig {
  /** Subtitles formats you want your transcription to be formatted to */
  formats?: Array<PreRecordedV2SubtitlesFormat>
  /** Minimum duration of a subtitle in seconds */
  minimum_duration?: number
  /** Maximum duration of a subtitle in seconds */
  maximum_duration?: number
  /** Maximum number of characters per row in a subtitle */
  maximum_characters_per_row?: number
  /** Maximum number of rows per caption */
  maximum_rows_per_caption?: number
  /** Style of the subtitles. Compliance mode refers to : https://loc.gov/preservation/digital/formats//fdd/fdd000569.shtml#:~:text=SRT%20files%20are%20basic%20text,alongside%2C%20example%3A%20%22MyVideo123  */
  style?: PreRecordedV2SubtitlesStyle
}

export interface PreRecordedV2DiarizationConfig {
  /** Exact number of speakers in the audio */
  number_of_speakers?: number
  /** Minimum number of speakers in the audio */
  min_speakers?: number
  /** Maximum number of speakers in the audio */
  max_speakers?: number
}

export type PreRecordedV2TranslationLanguageCode =
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
  | 'zh'

export type PreRecordedV2TranslationModel = 'base' | 'enhanced'

export interface PreRecordedV2TranslationConfig {
  /** Target language in `iso639-1` format you want the transcription translated to */
  target_languages: Array<PreRecordedV2TranslationLanguageCode>
  /** Model you want the translation model to use to translate */
  model?: PreRecordedV2TranslationModel
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

export type PreRecordedV2SummaryType = 'general' | 'bullet_points' | 'concise'

export interface PreRecordedV2SummarizationConfig {
  /** The type of summarization to apply */
  type?: PreRecordedV2SummaryType
}

export interface PreRecordedV2CustomSpellingConfig {
  /** The list of spelling applied on the audio transcription */
  spelling_dictionary: Record<string, Array<string>>
}

export interface PreRecordedV2StructuredDataExtractionConfig {
  /** The list of classes to extract from the audio transcription */
  classes: Array<Array<any>>
}

export interface PreRecordedV2AudioToLlmListConfig {
  /** The list of prompts applied on the audio transcription */
  prompts: Array<Array<any>>
}

export interface PreRecordedV2LanguageConfig {
  /** If one language is set, it will be used for the transcription. Otherwise, language will be auto-detected by the model. */
  languages?: Array<PreRecordedV2TranscriptionLanguageCode>
  /** If true, language will be auto-detected on each utterance. Otherwise, language will be auto-detected on first utterance and then used for the rest of the transcription. If one language is set, this option will be ignored. */
  code_switching?: boolean
}

export interface PreRecordedV2FileResponse {
  /** The file id */
  id: string
  /** The name of the uploaded file */
  filename: string | null
  /** The link used to download the file if audio_url was used */
  source: string | null
  /** Duration of the audio file */
  audio_duration: number | null
  /** Number of channels in the audio file */
  number_of_channels: number | null
}

export interface PreRecordedV2RequestParamsResponse {
  /** **[Deprecated]** Context to feed the transcription model with for possible better accuracy */
  context_prompt?: string
  /** **[Beta]** Can be either boolean to enable custom_vocabulary for this audio or an array with specific vocabulary list to feed the transcription model with */
  custom_vocabulary?: boolean
  /** **[Beta]** Custom vocabulary configuration, if `custom_vocabulary` is enabled */
  custom_vocabulary_config?: PreRecordedV2CustomVocabularyConfig
  /** **[Deprecated]** Use `language_config` instead. Detect the language from the given audio */
  detect_language?: boolean
  /** **[Deprecated]** Use `language_config` instead.Detect multiple languages in the given audio */
  enable_code_switching?: boolean
  /** **[Deprecated]** Use `language_config` instead. Specify the configuration for code switching */
  code_switching_config?: PreRecordedV2CodeSwitchingConfig
  /** **[Deprecated]** Use `language_config` instead. Set the spoken language for the given audio (ISO 639 standard) */
  language?: PreRecordedV2TranscriptionLanguageCode
  /** **[Deprecated]** Use `callback`/`callback_config` instead. Callback URL we will do a `POST` request to with the result of the transcription */
  callback_url?: string
  /** Enable callback for this transcription. If true, the `callback_config` property will be used to customize the callback behaviour */
  callback?: boolean
  /** Customize the callback behaviour (url and http method) */
  callback_config?: PreRecordedV2CallbackConfig
  /** Enable subtitles generation for this transcription */
  subtitles?: boolean
  /** Configuration for subtitles generation if `subtitles` is enabled */
  subtitles_config?: PreRecordedV2SubtitlesConfig
  /** Enable speaker recognition (diarization) for this audio */
  diarization?: boolean
  /** Speaker recognition configuration, if `diarization` is enabled */
  diarization_config?: PreRecordedV2DiarizationConfig
  /** **[Beta]** Enable translation for this audio */
  translation?: boolean
  /** **[Beta]** Translation configuration, if `translation` is enabled */
  translation_config?: PreRecordedV2TranslationConfig
  /** **[Beta]** Enable summarization for this audio */
  summarization?: boolean
  /** **[Beta]** Summarization configuration, if `summarization` is enabled */
  summarization_config?: PreRecordedV2SummarizationConfig
  /** **[Alpha]** Enable moderation for this audio */
  moderation?: boolean
  /** **[Alpha]** Enable named entity recognition for this audio */
  named_entity_recognition?: boolean
  /** **[Alpha]** Enable chapterization for this audio */
  chapterization?: boolean
  /** **[Alpha]** Enable names consistency for this audio */
  name_consistency?: boolean
  /** **[Alpha]** Enable custom spelling for this audio */
  custom_spelling?: boolean
  /** **[Alpha]** Custom spelling configuration, if `custom_spelling` is enabled */
  custom_spelling_config?: PreRecordedV2CustomSpellingConfig
  /** **[Alpha]** Enable structured data extraction for this audio */
  structured_data_extraction?: boolean
  /** **[Alpha]** Structured data extraction configuration, if `structured_data_extraction` is enabled */
  structured_data_extraction_config?: PreRecordedV2StructuredDataExtractionConfig
  /** Enable sentiment analysis for this audio */
  sentiment_analysis?: boolean
  /** **[Alpha]** Enable audio to llm processing for this audio */
  audio_to_llm?: boolean
  /** **[Alpha]** Audio to llm configuration, if `audio_to_llm` is enabled */
  audio_to_llm_config?: PreRecordedV2AudioToLlmListConfig
  /** Enable sentences for this audio */
  sentences?: boolean
  /** **[Alpha]** Allows to change the output display_mode for this audio. The output will be reordered, creating new utterances when speakers overlapped */
  display_mode?: boolean
  /** **[Alpha]** Use enhanced punctuation for this audio */
  punctuation_enhanced?: boolean
  /** Specify the language configuration */
  language_config?: PreRecordedV2LanguageConfig
  audio_url: string | null
}

export interface PreRecordedV2TranscriptionMetadata {
  /** Duration of the transcribed audio file */
  audio_duration: number
  /** Number of distinct channels in the transcribed audio file */
  number_of_distinct_channels: number
  /** Billed duration in seconds (audio_duration * number_of_distinct_channels) */
  billing_time: number
  /** Duration of the transcription in seconds */
  transcription_time: number
}

export interface PreRecordedV2AddonError {
  /** Status code of the addon error */
  status_code: number
  /** Reason of the addon error */
  exception: string
  /** Detailed message of the addon error */
  message: string
}

export interface PreRecordedV2Sentences {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: PreRecordedV2AddonError | null
  /** If `sentences` has been enabled, transcription as sentences. */
  results: Array<string> | null
}

export interface PreRecordedV2Subtitle {
  /** Format of the current subtitle */
  format: PreRecordedV2SubtitlesFormat
  /** Transcription on the asked subtitle format */
  subtitles: string
}

export interface PreRecordedV2Word {
  /** Spoken word */
  word: string
  /** Start timestamps in seconds of the spoken word */
  start: number
  /** End timestamps in seconds of the spoken word */
  end: number
  /** Confidence on the transcribed word (1 = 100% confident) */
  confidence: number
}

export interface PreRecordedV2Utterance {
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
  words: Array<PreRecordedV2Word>
  /** Transcription for this utterance */
  text: string
  /** Spoken language in this utterance */
  language: PreRecordedV2TranscriptionLanguageCode
}

export interface PreRecordedV2Transcription {
  /** All transcription on text format without any other information */
  full_transcript: string
  /** All the detected languages in the audio sorted from the most detected to the less detected */
  languages: Array<PreRecordedV2TranscriptionLanguageCode>
  /** If `sentences` has been enabled, sentences results */
  sentences?: Array<PreRecordedV2Sentences>
  /** If `subtitles` has been enabled, subtitles results */
  subtitles?: Array<PreRecordedV2Subtitle>
  /** Transcribed speech utterances present in the audio */
  utterances: Array<PreRecordedV2Utterance>
}

export interface PreRecordedV2TranslationResult {
  /** Contains the error details of the failed addon */
  error: PreRecordedV2AddonError | null
  /** All transcription on text format without any other information */
  full_transcript: string
  /** All the detected languages in the audio sorted from the most detected to the less detected */
  languages: Array<PreRecordedV2TranslationLanguageCode>
  /** If `sentences` has been enabled, sentences results for this translation */
  sentences?: Array<PreRecordedV2Sentences>
  /** If `subtitles` has been enabled, subtitles results for this translation */
  subtitles?: Array<PreRecordedV2Subtitle>
  /** Transcribed speech utterances present in the audio */
  utterances: Array<PreRecordedV2Utterance>
}

export interface PreRecordedV2Translation {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: PreRecordedV2AddonError | null
  /** List of translated transcriptions, one for each `target_languages` */
  results: Array<PreRecordedV2TranslationResult> | null
}

export interface PreRecordedV2Summarization {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: PreRecordedV2AddonError | null
  /** If `summarization` has been enabled, summary of the transcription */
  results: string | null
}

export interface PreRecordedV2Moderation {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: PreRecordedV2AddonError | null
  /** If `moderation` has been enabled, moderated transcription */
  results: string | null
}

export interface PreRecordedV2NamedEntityRecognition {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: PreRecordedV2AddonError | null
  /** If `named_entity_recognition` has been enabled, the detected entities. */
  entity: string
}

export interface PreRecordedV2NamesConsistency {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: PreRecordedV2AddonError | null
  /** If `name_consistency` has been enabled, Gladia will improve the consistency of the names across the transcription */
  results: string
}

export interface PreRecordedV2SpeakerReidentification {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: PreRecordedV2AddonError | null
  /** If `speaker_reidentification` has been enabled, results of the AI speaker reidentification. */
  results: string
}

export interface PreRecordedV2StructuredDataExtraction {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: PreRecordedV2AddonError | null
  /** If `structured_data_extraction` has been enabled, results of the AI structured data extraction for the defined classes. */
  results: string
}

export interface PreRecordedV2SentimentAnalysis {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: PreRecordedV2AddonError | null
  /** If `sentiment_analysis` has been enabled, Gladia will analyze the sentiments and emotions of the audio */
  results: string
}

export interface PreRecordedV2AudioToLlmResult {
  /** The prompt used */
  prompt: string | null
  /** The result of the AI analysis */
  response: string | null
}

export interface PreRecordedV2AudioToLlm {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: PreRecordedV2AddonError | null
  /** The result from a specific prompt */
  results: PreRecordedV2AudioToLlmResult | null
}

export interface PreRecordedV2AudioToLlmList {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: PreRecordedV2AddonError | null
  /** If `audio_to_llm` has been enabled, results of the AI custom analysis */
  results: Array<PreRecordedV2AudioToLlm> | null
}

export interface PreRecordedV2DisplayMode {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: PreRecordedV2AddonError | null
  /** If `display_mode` has been enabled, proposes an alternative display output. */
  results: Array<string> | null
}

export interface PreRecordedV2Chapterization {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: PreRecordedV2AddonError | null
  /** If `chapterization` has been enabled, will generate chapters name for different parts of the given audio. */
  results: Record<string, any>
}

export interface PreRecordedV2Diarization {
  /** The audio intelligence model succeeded to get a valid output */
  success: boolean
  /** The audio intelligence model returned an empty value */
  is_empty: boolean
  /** Time audio intelligence model took to complete the task */
  exec_time: number
  /** `null` if `success` is `true`. Contains the error details of the failed model */
  error: PreRecordedV2AddonError | null
  /** [Deprecated] If `diarization` has been enabled, the diarization result will appear here */
  results: Array<PreRecordedV2Utterance>
}

export interface PreRecordedV2TranscriptionResult {
  /** Metadata for the given transcription & audio file */
  metadata: PreRecordedV2TranscriptionMetadata
  /** Transcription of the audio speech */
  transcription?: PreRecordedV2Transcription
  /** If `translation` has been enabled, translation of the audio speech transcription */
  translation?: PreRecordedV2Translation
  /** If `summarization` has been enabled, summarization of the audio speech transcription */
  summarization?: PreRecordedV2Summarization
  /** If `moderation` has been enabled, moderation of the audio speech transcription */
  moderation?: PreRecordedV2Moderation
  /** If `named_entity_recognition` has been enabled, the detected entities */
  named_entity_recognition?: PreRecordedV2NamedEntityRecognition
  /** If `name_consistency` has been enabled, Gladia will improve consistency of the names accross the transcription */
  name_consistency?: PreRecordedV2NamesConsistency
  /** If `speaker_reidentification` has been enabled, results of the AI speaker reidentification. */
  speaker_reidentification?: PreRecordedV2SpeakerReidentification
  /** If `structured_data_extraction` has been enabled, structured data extraction results */
  structured_data_extraction?: PreRecordedV2StructuredDataExtraction
  /** If `sentiment_analysis` has been enabled, sentiment analysis of the audio speech transcription */
  sentiment_analysis?: PreRecordedV2SentimentAnalysis
  /** If `audio_to_llm` has been enabled, audio to llm results of the audio speech transcription */
  audio_to_llm?: PreRecordedV2AudioToLlmList
  /** If `sentences` has been enabled, sentences of the audio speech transcription. Deprecated: content will move to the `transcription` object. */
  sentences?: PreRecordedV2Sentences
  /** If `display_mode` has been enabled, the output will be reordered, creating new utterances when speakers overlapped */
  display_mode?: PreRecordedV2DisplayMode
  /** If `chapterization` has been enabled, will generate chapters name for different parts of the given audio. */
  chapterization?: PreRecordedV2Chapterization
  /** If `diarization` has been requested and an error has occurred, the result will appear here */
  diarization?: PreRecordedV2Diarization
}

// Upload Types
/** Upload request body */
export interface PreRecordedV2UploadRequest {
  /** The URL of the audio or video file to be uploaded. */
  audio_url?: string
}

export interface PreRecordedV2AudioUploadResponse {
  /** Uploaded audio file Gladia URL */
  audio_url: string
  /** Uploaded audio file detected metadata */
  audio_metadata: PreRecordedV2AudioUploadMetadata
}

// Init Session Types
export interface PreRecordedV2InitTranscriptionRequest {
  /** **[Deprecated]** Context to feed the transcription model with for possible better accuracy */
  context_prompt?: string
  /** **[Beta]** Can be either boolean to enable custom_vocabulary for this audio or an array with specific vocabulary list to feed the transcription model with */
  custom_vocabulary?: boolean
  /** **[Beta]** Custom vocabulary configuration, if `custom_vocabulary` is enabled */
  custom_vocabulary_config?: PreRecordedV2CustomVocabularyConfig
  /** **[Deprecated]** Use `language_config` instead. Detect the language from the given audio */
  detect_language?: boolean
  /** **[Deprecated]** Use `language_config` instead.Detect multiple languages in the given audio */
  enable_code_switching?: boolean
  /** **[Deprecated]** Use `language_config` instead. Specify the configuration for code switching */
  code_switching_config?: PreRecordedV2CodeSwitchingConfig
  /** **[Deprecated]** Use `language_config` instead. Set the spoken language for the given audio (ISO 639 standard) */
  language?: PreRecordedV2TranscriptionLanguageCode
  /** **[Deprecated]** Use `callback`/`callback_config` instead. Callback URL we will do a `POST` request to with the result of the transcription */
  callback_url?: string
  /** Enable callback for this transcription. If true, the `callback_config` property will be used to customize the callback behaviour */
  callback?: boolean
  /** Customize the callback behaviour (url and http method) */
  callback_config?: PreRecordedV2CallbackConfig
  /** Enable subtitles generation for this transcription */
  subtitles?: boolean
  /** Configuration for subtitles generation if `subtitles` is enabled */
  subtitles_config?: PreRecordedV2SubtitlesConfig
  /** Enable speaker recognition (diarization) for this audio */
  diarization?: boolean
  /** Speaker recognition configuration, if `diarization` is enabled */
  diarization_config?: PreRecordedV2DiarizationConfig
  /** **[Beta]** Enable translation for this audio */
  translation?: boolean
  /** **[Beta]** Translation configuration, if `translation` is enabled */
  translation_config?: PreRecordedV2TranslationConfig
  /** **[Beta]** Enable summarization for this audio */
  summarization?: boolean
  /** **[Beta]** Summarization configuration, if `summarization` is enabled */
  summarization_config?: PreRecordedV2SummarizationConfig
  /** **[Alpha]** Enable moderation for this audio */
  moderation?: boolean
  /** **[Alpha]** Enable named entity recognition for this audio */
  named_entity_recognition?: boolean
  /** **[Alpha]** Enable chapterization for this audio */
  chapterization?: boolean
  /** **[Alpha]** Enable names consistency for this audio */
  name_consistency?: boolean
  /** **[Alpha]** Enable custom spelling for this audio */
  custom_spelling?: boolean
  /** **[Alpha]** Custom spelling configuration, if `custom_spelling` is enabled */
  custom_spelling_config?: PreRecordedV2CustomSpellingConfig
  /** **[Alpha]** Enable structured data extraction for this audio */
  structured_data_extraction?: boolean
  /** **[Alpha]** Structured data extraction configuration, if `structured_data_extraction` is enabled */
  structured_data_extraction_config?: PreRecordedV2StructuredDataExtractionConfig
  /** Enable sentiment analysis for this audio */
  sentiment_analysis?: boolean
  /** **[Alpha]** Enable audio to llm processing for this audio */
  audio_to_llm?: boolean
  /** **[Alpha]** Audio to llm configuration, if `audio_to_llm` is enabled */
  audio_to_llm_config?: PreRecordedV2AudioToLlmListConfig
  /** Custom metadata you can attach to this transcription */
  custom_metadata?: Record<string, any>
  /** Enable sentences for this audio */
  sentences?: boolean
  /** **[Alpha]** Allows to change the output display_mode for this audio. The output will be reordered, creating new utterances when speakers overlapped */
  display_mode?: boolean
  /** **[Alpha]** Use enhanced punctuation for this audio */
  punctuation_enhanced?: boolean
  /** Specify the language configuration */
  language_config?: PreRecordedV2LanguageConfig
  /** URL to a Gladia file or to an external audio or video file */
  audio_url: string
}

export interface PreRecordedV2InitTranscriptionResponse {
  /** Id of the job */
  id: string
  /** Prebuilt URL with your transcription `id` to fetch the result */
  result_url: string
}

// Result Types
export interface PreRecordedV2Response {
  /** Id of the job */
  id: string
  /** Debug id */
  request_id: string
  /** API version */
  version: number
  /** "queued": the job has been queued. "processing": the job is being processed. "done": the job has been processed and the result is available. "error": an error occurred during the job's processing. */
  status: 'queued' | 'processing' | 'done' | 'error'
  /** Creation date */
  created_at: string
  /** Completion date when status is "done" or "error" */
  completed_at?: string | null
  /** Custom metadata given in the initial request */
  custom_metadata?: Record<string, any>
  /** HTTP status code of the error if status is "error" */
  error_code?: number | null
  /** For debugging purposes, send data that could help to identify issues */
  post_session_metadata: object
  kind: 'pre-recorded'
  /** The file data you uploaded. Can be null if status is "error" */
  file?: PreRecordedV2FileResponse | null
  /** Parameters used for this pre-recorded transcription. Can be null if status is "error" */
  request_params?: PreRecordedV2RequestParamsResponse | null
  /** Pre-recorded transcription's result when status is "done" */
  result?: PreRecordedV2TranscriptionResult | null
}
