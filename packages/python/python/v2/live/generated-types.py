# This file is auto-generated. Do not edit manually.
# Generated from OpenAPI schema.
from typing import Any, Literal, TypedDict

# Shared Types Types
LiveV2Encoding = Literal["wav/pcm", "wav/alaw", "wav/ulaw"]

LiveV2BitDepth = 8 | 16 | 24 | 32

LiveV2SampleRate = 8000 | 16000 | 32000 | 44100 | 48000

LiveV2Model = Literal["solaria-1"]

LiveV2TranscriptionLanguageCode = Literal[
  "af",
  "am",
  "ar",
  "as",
  "az",
  "ba",
  "be",
  "bg",
  "bn",
  "bo",
  "br",
  "bs",
  "ca",
  "cs",
  "cy",
  "da",
  "de",
  "el",
  "en",
  "es",
  "et",
  "eu",
  "fa",
  "fi",
  "fo",
  "fr",
  "gl",
  "gu",
  "ha",
  "haw",
  "he",
  "hi",
  "hr",
  "ht",
  "hu",
  "hy",
  "id",
  "is",
  "it",
  "ja",
  "jw",
  "ka",
  "kk",
  "km",
  "kn",
  "ko",
  "la",
  "lb",
  "ln",
  "lo",
  "lt",
  "lv",
  "mg",
  "mi",
  "mk",
  "ml",
  "mn",
  "mr",
  "ms",
  "mt",
  "my",
  "ne",
  "nl",
  "nn",
  "no",
  "oc",
  "pa",
  "pl",
  "ps",
  "pt",
  "ro",
  "ru",
  "sa",
  "sd",
  "si",
  "sk",
  "sl",
  "sn",
  "so",
  "sq",
  "sr",
  "su",
  "sv",
  "sw",
  "ta",
  "te",
  "tg",
  "th",
  "tk",
  "tl",
  "tr",
  "tt",
  "uk",
  "ur",
  "uz",
  "vi",
  "yi",
  "yo",
  "yue",
  "zh",
]


class LiveV2LanguageConfig(TypedDict):
  # If one language is set, it will be used for the transcription. Otherwise, language will be
  # auto-detected by the model.
  languages: list[LiveV2TranscriptionLanguageCode] | None
  # If true, language will be auto-detected on each utterance. Otherwise, language will be
  # auto-detected on first utterance and then used for the rest of the transcription. If one
  # language is set, this option will be ignored.
  code_switching: bool | None


class LiveV2PreProcessingConfig(TypedDict):
  # If true, apply pre-processing to the audio stream to enhance the quality.
  audio_enhancer: bool | None
  # Sensitivity configuration for Speech Threshold. A value close to 1 will apply stricter
  # thresholds, making it less likely to detect background sounds as speech.
  speech_threshold: float | None


class LiveV2CustomVocabularyEntry(TypedDict):
  # The text used to replace in the transcription.
  value: str
  # The global intensity of the feature.
  intensity: float | None
  # The pronunciations used in the transcription.
  pronunciations: list[str] | None
  # Specify the language in which it will be pronounced when sound comparison occurs. Default to
  # transcription language.
  language: LiveV2TranscriptionLanguageCode | None


class LiveV2CustomVocabularyConfig(TypedDict):
  # Specific vocabulary list to feed the transcription model with. Each item can be a string or an
  # object with the following properties: value, intensity, pronunciations, language.
  vocabulary: list[LiveV2CustomVocabularyEntry | str]
  # Default intensity for the custom vocabulary
  default_intensity: float | None


class LiveV2CustomSpellingConfig(TypedDict):
  # The list of spelling applied on the audio transcription
  spelling_dictionary: dict[str, list[str]]


LiveV2TranslationLanguageCode = Literal[
  "af",
  "am",
  "ar",
  "as",
  "az",
  "ba",
  "be",
  "bg",
  "bn",
  "bo",
  "br",
  "bs",
  "ca",
  "cs",
  "cy",
  "da",
  "de",
  "el",
  "en",
  "es",
  "et",
  "eu",
  "fa",
  "fi",
  "fo",
  "fr",
  "gl",
  "gu",
  "ha",
  "haw",
  "he",
  "hi",
  "hr",
  "ht",
  "hu",
  "hy",
  "id",
  "is",
  "it",
  "ja",
  "jw",
  "ka",
  "kk",
  "km",
  "kn",
  "ko",
  "la",
  "lb",
  "ln",
  "lo",
  "lt",
  "lv",
  "mg",
  "mi",
  "mk",
  "ml",
  "mn",
  "mr",
  "ms",
  "mt",
  "my",
  "ne",
  "nl",
  "nn",
  "no",
  "oc",
  "pa",
  "pl",
  "ps",
  "pt",
  "ro",
  "ru",
  "sa",
  "sd",
  "si",
  "sk",
  "sl",
  "sn",
  "so",
  "sq",
  "sr",
  "su",
  "sv",
  "sw",
  "ta",
  "te",
  "tg",
  "th",
  "tk",
  "tl",
  "tr",
  "tt",
  "uk",
  "ur",
  "uz",
  "vi",
  "wo",
  "yi",
  "yo",
  "yue",
  "zh",
]

LiveV2TranslationModel = Literal["base", "enhanced"]


class LiveV2TranslationConfig(TypedDict):
  # Target language in `iso639-1` format you want the transcription translated to
  target_languages: list[LiveV2TranslationLanguageCode]
  # Model you want the translation model to use to translate
  model: LiveV2TranslationModel | None
  # Align translated utterances with the original ones
  match_original_utterances: bool | None
  # Whether to apply lipsync to the translated transcription.
  lipsync: bool | None
  # Enables or disables context-aware translation features that allow the model to adapt
  # translations based on provided context.
  context_adaptation: bool | None
  # Context information to improve translation accuracy
  context: str | None
  # Forces the translation to use informal language forms when available in the target language.
  informal: bool | None


class LiveV2RealtimeProcessingConfig(TypedDict):
  # If true, enable custom vocabulary for the transcription.
  custom_vocabulary: bool | None
  # Custom vocabulary configuration, if `custom_vocabulary` is enabled
  custom_vocabulary_config: LiveV2CustomVocabularyConfig | None
  # If true, enable custom spelling for the transcription.
  custom_spelling: bool | None
  # Custom spelling configuration, if `custom_spelling` is enabled
  custom_spelling_config: LiveV2CustomSpellingConfig | None
  # If true, enable translation for the transcription
  translation: bool | None
  # Translation configuration, if `translation` is enabled
  translation_config: LiveV2TranslationConfig | None
  # If true, enable named entity recognition for the transcription.
  named_entity_recognition: bool | None
  # If true, enable sentiment analysis for the transcription.
  sentiment_analysis: bool | None


LiveV2SummaryType = Literal["general", "bullet_points", "concise"]


class LiveV2SummarizationConfig(TypedDict):
  # The type of summarization to apply
  type: LiveV2SummaryType | None


class LiveV2PostProcessingConfig(TypedDict):
  # If true, generates summarization for the whole transcription.
  summarization: bool | None
  # Summarization configuration, if `summarization` is enabled
  summarization_config: LiveV2SummarizationConfig | None
  # If true, generates chapters for the whole transcription.
  chapterization: bool | None


class LiveV2MessagesConfig(TypedDict):
  # If true, partial transcript will be sent to websocket.
  receive_partial_transcripts: bool | None
  # If true, final transcript will be sent to websocket.
  receive_final_transcripts: bool | None
  # If true, begin and end speech events will be sent to websocket.
  receive_speech_events: bool | None
  # If true, pre-processing events will be sent to websocket.
  receive_pre_processing_events: bool | None
  # If true, realtime processing events will be sent to websocket.
  receive_realtime_processing_events: bool | None
  # If true, post-processing events will be sent to websocket.
  receive_post_processing_events: bool | None
  # If true, acknowledgments will be sent to websocket.
  receive_acknowledgments: bool | None
  # If true, errors will be sent to websocket.
  receive_errors: bool | None
  # If true, lifecycle events will be sent to websocket.
  receive_lifecycle_events: bool | None


class LiveV2CallbackConfig(TypedDict):
  # URL on which we will do a `POST` request with configured messages
  url: str | None
  # If true, partial transcript will be sent to the defined callback.
  receive_partial_transcripts: bool | None
  # If true, final transcript will be sent to the defined callback.
  receive_final_transcripts: bool | None
  # If true, begin and end speech events will be sent to the defined callback.
  receive_speech_events: bool | None
  # If true, pre-processing events will be sent to the defined callback.
  receive_pre_processing_events: bool | None
  # If true, realtime processing events will be sent to the defined callback.
  receive_realtime_processing_events: bool | None
  # If true, post-processing events will be sent to the defined callback.
  receive_post_processing_events: bool | None
  # If true, acknowledgments will be sent to the defined callback.
  receive_acknowledgments: bool | None
  # If true, errors will be sent to the defined callback.
  receive_errors: bool | None
  # If true, lifecycle events will be sent to the defined callback.
  receive_lifecycle_events: bool | None


class LiveV2Error(TypedDict):
  # The error message
  message: str


class LiveV2AudioChunkAckData(TypedDict):
  # Range in bytes length of the audio chunk (relative to the whole session)
  byte_range: list[int]
  # Range in seconds of the audio chunk (relative to the whole session)
  time_range: list[float]


class LiveV2EndRecordingMessageData(TypedDict):
  # Total audio duration in seconds
  recording_duration: float


class LiveV2Word(TypedDict):
  # Spoken word
  word: str
  # Start timestamps in seconds of the spoken word
  start: float
  # End timestamps in seconds of the spoken word
  end: float
  # Confidence on the transcribed word (1 = 100% confident)
  confidence: float


class LiveV2Utterance(TypedDict):
  # Start timestamp in seconds of this utterance
  start: float
  # End timestamp in seconds of this utterance
  end: float
  # Confidence on the transcribed utterance (1 = 100% confident)
  confidence: float
  # Audio channel of where this utterance has been transcribed from
  channel: int
  # If `diarization` enabled, speaker identification number
  speaker: int | None
  # List of words of the utterance, split by timestamp
  words: list[LiveV2Word]
  # Transcription for this utterance
  text: str
  # Spoken language in this utterance
  language: LiveV2TranscriptionLanguageCode


class LiveV2TranslationData(TypedDict):
  # Id of the utterance used for this result
  utterance_id: str
  # The transcribed utterance
  utterance: LiveV2Utterance
  # The original language in `iso639-1` or `iso639-2` format depending on the language
  original_language: LiveV2TranscriptionLanguageCode
  # The target language in `iso639-1` or `iso639-2` format depending on the language
  target_language: LiveV2TranslationLanguageCode
  # The translated utterance
  translated_utterance: LiveV2Utterance


class LiveV2NamedEntityRecognitionResult(TypedDict):
  entity_type: str
  text: str
  start: float
  end: float


class LiveV2NamedEntityRecognitionData(TypedDict):
  # Id of the utterance used for this result
  utterance_id: str
  # The transcribed utterance
  utterance: LiveV2Utterance
  # The NER results
  results: list[LiveV2NamedEntityRecognitionResult]


class LiveV2ChapterizationSentence(TypedDict):
  sentence: str
  start: float
  end: float
  words: list[LiveV2Word]


class LiveV2PostChapterizationResult(TypedDict):
  abstractive_summary: str | None
  extractive_summary: str | None
  summary: str | None
  headline: str
  gist: str
  keywords: list[str]
  start: float
  end: float
  sentences: list[LiveV2ChapterizationSentence]
  text: str


class LiveV2PostChapterizationMessageData(TypedDict):
  # The chapters
  results: list[LiveV2PostChapterizationResult]


class LiveV2TranscriptionMetadata(TypedDict):
  # Duration of the transcribed audio file
  audio_duration: float
  # Number of distinct channels in the transcribed audio file
  number_of_distinct_channels: int
  # Billed duration in seconds (audio_duration * number_of_distinct_channels)
  billing_time: float
  # Duration of the transcription in seconds
  transcription_time: float


class LiveV2AddonError(TypedDict):
  # Status code of the addon error
  status_code: int
  # Reason of the addon error
  exception: str
  # Detailed message of the addon error
  message: str


class LiveV2Sentences(TypedDict):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: LiveV2AddonError
  # If `sentences` has been enabled, transcription as sentences.
  results: list[str]


LiveV2SubtitlesFormat = Literal["srt", "vtt"]


class LiveV2Subtitle(TypedDict):
  # Format of the current subtitle
  format: LiveV2SubtitlesFormat
  # Transcription on the asked subtitle format
  subtitles: str


class LiveV2Transcription(TypedDict):
  # All transcription on text format without any other information
  full_transcript: str
  # All the detected languages in the audio sorted from the most detected to the less detected
  languages: list[LiveV2TranscriptionLanguageCode]
  # If `sentences` has been enabled, sentences results
  sentences: list[LiveV2Sentences] | None
  # If `subtitles` has been enabled, subtitles results
  subtitles: list[LiveV2Subtitle] | None
  # Transcribed speech utterances present in the audio
  utterances: list[LiveV2Utterance]


class LiveV2TranslationResult(TypedDict):
  # Contains the error details of the failed addon
  error: LiveV2AddonError
  # All transcription on text format without any other information
  full_transcript: str
  # All the detected languages in the audio sorted from the most detected to the less detected
  languages: list[LiveV2TranslationLanguageCode]
  # If `sentences` has been enabled, sentences results for this translation
  sentences: list[LiveV2Sentences] | None
  # If `subtitles` has been enabled, subtitles results for this translation
  subtitles: list[LiveV2Subtitle] | None
  # Transcribed speech utterances present in the audio
  utterances: list[LiveV2Utterance]


class LiveV2Translation(TypedDict):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: LiveV2AddonError
  # List of translated transcriptions, one for each `target_languages`
  results: list[LiveV2TranslationResult]


class LiveV2Summarization(TypedDict):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: LiveV2AddonError
  # If `summarization` has been enabled, summary of the transcription
  results: str


class LiveV2NamedEntityRecognition(TypedDict):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: LiveV2AddonError
  # If `named_entity_recognition` has been enabled, the detected entities.
  entity: str


class LiveV2SentimentAnalysis(TypedDict):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: LiveV2AddonError
  # If `sentiment_analysis` has been enabled, Gladia will analyze the sentiments and emotions of
  # the audio
  results: str


class LiveV2Chapterization(TypedDict):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: LiveV2AddonError
  # If `chapterization` has been enabled, will generate chapters name for different parts of the
  # given audio.
  results: dict[str, Any]


class LiveV2TranscriptionResult(TypedDict):
  # Metadata for the given transcription & audio file
  metadata: LiveV2TranscriptionMetadata
  # Transcription of the audio speech
  transcription: LiveV2Transcription | None
  # If `translation` has been enabled, translation of the audio speech transcription
  translation: LiveV2Translation | None
  # If `summarization` has been enabled, summarization of the audio speech transcription
  summarization: LiveV2Summarization | None
  # If `named_entity_recognition` has been enabled, the detected entities
  named_entity_recognition: LiveV2NamedEntityRecognition | None
  # If `sentiment_analysis` has been enabled, sentiment analysis of the audio speech transcription
  sentiment_analysis: LiveV2SentimentAnalysis | None
  # If `chapterization` has been enabled, will generate chapters name for different parts of the
  # given audio.
  chapterization: LiveV2Chapterization | None


class LiveV2PostSummarizationMessageData(TypedDict):
  # The summarization
  results: str


class LiveV2SentimentAnalysisResult(TypedDict):
  sentiment: str
  emotion: str
  text: str
  start: float
  end: float
  channel: float


class LiveV2SentimentAnalysisData(TypedDict):
  # Id of the utterance used for this result
  utterance_id: str
  # The transcribed utterance
  utterance: LiveV2Utterance
  # The sentiment analysis results
  results: list[LiveV2SentimentAnalysisResult]


class LiveV2StopRecordingAckData(TypedDict):
  # Total audio duration in seconds
  recording_duration: float
  # Audio duration left to process in seconds
  recording_left_to_process: float


class LiveV2TranscriptMessageData(TypedDict):
  # Id of the utterance
  id: str
  # Flag to indicate if the transcript is final or not
  is_final: bool
  # The transcribed utterance
  utterance: LiveV2Utterance


class LiveV2SpeechMessageData(TypedDict):
  # Timestamp in seconds of the speech event
  time: float
  # Channel of the speech event
  channel: float


class LiveV2EventPayload(TypedDict):
  # Id of the job
  id: str


# Init Session Types
class LiveV2InitRequest(TypedDict):
  # The encoding format of the audio stream. Supported formats:
  # - PCM: 8, 16, 24, and 32 bits
  # - A-law: 8 bits
  # - μ-law: 8 bits
  #
  # Note: No need to add WAV headers to raw audio as the API supports both formats.
  encoding: LiveV2Encoding | None
  # The bit depth of the audio stream
  bit_depth: LiveV2BitDepth | None
  # The sample rate of the audio stream
  sample_rate: LiveV2SampleRate | None
  # The number of channels of the audio stream
  channels: int | None
  # Custom metadata you can attach to this live transcription
  custom_metadata: dict[str, Any] | None
  # The model used to process the audio. "solaria-1" is used by default.
  model: LiveV2Model | None
  # The endpointing duration in seconds. Endpointing is the duration of silence which will cause
  # an utterance to be considered as finished
  endpointing: float | None
  # The maximum duration in seconds without endpointing. If endpointing is not detected after this
  # duration, current utterance will be considered as finished
  maximum_duration_without_endpointing: float | None
  # Specify the language configuration
  language_config: LiveV2LanguageConfig | None
  # Specify the pre-processing configuration
  pre_processing: LiveV2PreProcessingConfig | None
  # Specify the realtime processing configuration
  realtime_processing: LiveV2RealtimeProcessingConfig | None
  # Specify the post-processing configuration
  post_processing: LiveV2PostProcessingConfig | None
  # Specify the websocket messages configuration
  messages_config: LiveV2MessagesConfig | None
  # If true, messages will be sent to configured url.
  callback: bool | None
  # Specify the callback configuration
  callback_config: LiveV2CallbackConfig | None


class LiveV2InitResponse(TypedDict):
  # Id of the job
  id: str
  # Creation date
  created_at: str
  # The websocket url to connect to for sending audio data. The url will contain the temporary
  # token to authenticate the session.
  url: str


# WebSocket Messages Types
class LiveV2AudioChunkAckMessage(TypedDict):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  # Flag to indicate if the action was successfully acknowledged
  acknowledged: bool
  # Error message if the action was not successfully acknowledged
  error: LiveV2Error
  type: Literal["audio_chunk"]
  # The message data. "null" if the action was not successfully acknowledged
  data: LiveV2AudioChunkAckData


class LiveV2EndRecordingMessage(TypedDict):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["end_recording"]
  # The message data
  data: LiveV2EndRecordingMessageData


class LiveV2EndSessionMessage(TypedDict):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["end_session"]


class LiveV2TranslationMessage(TypedDict):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  # Error message if the addon failed
  error: LiveV2Error
  type: Literal["translation"]
  # The message data. "null" if the addon failed
  data: LiveV2TranslationData


class LiveV2NamedEntityRecognitionMessage(TypedDict):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  # Error message if the addon failed
  error: LiveV2Error
  type: Literal["named_entity_recognition"]
  # The message data. "null" if the addon failed
  data: LiveV2NamedEntityRecognitionData


class LiveV2PostChapterizationMessage(TypedDict):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  # Error message if the addon failed
  error: LiveV2Error
  type: Literal["post_chapterization"]
  # The message data. "null" if the addon failed
  data: LiveV2PostChapterizationMessageData


class LiveV2PostFinalTranscriptMessage(TypedDict):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["post_final_transcript"]
  # The message data
  data: LiveV2TranscriptionResult


class LiveV2PostSummarizationMessage(TypedDict):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  # Error message if the addon failed
  error: LiveV2Error
  type: Literal["post_summarization"]
  # The message data. "null" if the addon failed
  data: LiveV2PostSummarizationMessageData


class LiveV2PostTranscriptMessage(TypedDict):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["post_transcript"]
  # The message data
  data: LiveV2Transcription


class LiveV2SentimentAnalysisMessage(TypedDict):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  # Error message if the addon failed
  error: LiveV2Error
  type: Literal["sentiment_analysis"]
  # The message data. "null" if the addon failed
  data: LiveV2SentimentAnalysisData


class LiveV2StartRecordingMessage(TypedDict):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["start_recording"]


class LiveV2StartSessionMessage(TypedDict):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["start_session"]


class LiveV2StopRecordingAckMessage(TypedDict):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  # Flag to indicate if the action was successfully acknowledged
  acknowledged: bool
  # Error message if the action was not successfully acknowledged
  error: LiveV2Error
  type: Literal["stop_recording"]
  # The message data. "null" if the action was not successfully acknowledged
  data: LiveV2StopRecordingAckData


class LiveV2TranscriptMessage(TypedDict):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["transcript"]
  # The message data
  data: LiveV2TranscriptMessageData


class LiveV2SpeechStartMessage(TypedDict):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["speech_start"]
  # The message data
  data: LiveV2SpeechMessageData


class LiveV2SpeechEndMessage(TypedDict):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["speech_end"]
  # The message data
  data: LiveV2SpeechMessageData


# Union of all websocket messages
LiveV2WebSocketMessage = (
  LiveV2AudioChunkAckMessage
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
)


# Callback Messages Types
class LiveV2CallbackAudioChunkAckMessage(TypedDict):
  # Id of the job
  id: str
  event: Literal["live.audio_chunk"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2AudioChunkAckMessage


class LiveV2CallbackEndRecordingMessage(TypedDict):
  # Id of the job
  id: str
  event: Literal["live.end_recording"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2EndRecordingMessage


class LiveV2CallbackEndSessionMessage(TypedDict):
  # Id of the job
  id: str
  event: Literal["live.end_session"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2EndSessionMessage


class LiveV2CallbackTranslationMessage(TypedDict):
  # Id of the job
  id: str
  event: Literal["live.translation"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2TranslationMessage


class LiveV2CallbackNamedEntityRecognitionMessage(TypedDict):
  # Id of the job
  id: str
  event: Literal["live.named_entity_recognition"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2NamedEntityRecognitionMessage


class LiveV2CallbackPostChapterizationMessage(TypedDict):
  # Id of the job
  id: str
  event: Literal["live.post_chapterization"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2PostChapterizationMessage


class LiveV2CallbackPostFinalTranscriptMessage(TypedDict):
  # Id of the job
  id: str
  event: Literal["live.post_final_transcript"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2PostFinalTranscriptMessage


class LiveV2CallbackPostSummarizationMessage(TypedDict):
  # Id of the job
  id: str
  event: Literal["live.post_summarization"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2PostSummarizationMessage


class LiveV2CallbackPostTranscriptMessage(TypedDict):
  # Id of the job
  id: str
  event: Literal["live.post_transcript"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2PostTranscriptMessage


class LiveV2CallbackSentimentAnalysisMessage(TypedDict):
  # Id of the job
  id: str
  event: Literal["live.sentiment_analysis"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2SentimentAnalysisMessage


class LiveV2CallbackStartRecordingMessage(TypedDict):
  # Id of the job
  id: str
  event: Literal["live.start_recording"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2StartRecordingMessage


class LiveV2CallbackStartSessionMessage(TypedDict):
  # Id of the job
  id: str
  event: Literal["live.start_session"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2StartSessionMessage


class LiveV2CallbackStopRecordingAckMessage(TypedDict):
  # Id of the job
  id: str
  event: Literal["live.stop_recording"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2StopRecordingAckMessage


class LiveV2CallbackTranscriptMessage(TypedDict):
  # Id of the job
  id: str
  event: Literal["live.transcript"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2TranscriptMessage


class LiveV2CallbackSpeechStartMessage(TypedDict):
  # Id of the job
  id: str
  event: Literal["live.speech_start"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2SpeechStartMessage


class LiveV2CallbackSpeechEndMessage(TypedDict):
  # Id of the job
  id: str
  event: Literal["live.speech_end"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2SpeechEndMessage


# Union of all callback messages
LiveV2CallbackMessage = (
  LiveV2CallbackAudioChunkAckMessage
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
)


# Webhook Messages Types
class LiveV2WebhookStartSessionMessage(TypedDict):
  event: Literal["live.start_session"]
  payload: LiveV2EventPayload


class LiveV2WebhookStartRecordingMessage(TypedDict):
  event: Literal["live.start_recording"]
  payload: LiveV2EventPayload


class LiveV2WebhookEndRecordingMessage(TypedDict):
  event: Literal["live.end_recording"]
  payload: LiveV2EventPayload


class LiveV2WebhookEndSessionMessage(TypedDict):
  event: Literal["live.end_session"]
  payload: LiveV2EventPayload


# Union of all webhook messages
LiveV2WebhookMessage = (
  LiveV2WebhookStartSessionMessage
  | LiveV2WebhookStartRecordingMessage
  | LiveV2WebhookEndRecordingMessage
  | LiveV2WebhookEndSessionMessage
)
