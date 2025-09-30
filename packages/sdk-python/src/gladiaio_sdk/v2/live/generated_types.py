# This file is auto-generated. Do not edit manually.
# Generated from OpenAPI schema.
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Literal

from dataclasses_json import DataClassJsonMixin


def _filter_none(_dict: dict[str, Any]) -> dict[str, Any]:
  return {
    k: _filter_none(v) if isinstance(v, dict) else v for k, v in _dict.items() if v is not None
  }


class BaseDataClass(DataClassJsonMixin):
  def to_dict(self, encode_json: bool = True) -> dict[str, Any]:
    dict = super().to_dict(encode_json=encode_json)
    return _filter_none(dict)


# Shared Types Types
LiveV2Encoding = Literal["wav/pcm", "wav/alaw", "wav/ulaw"]

LiveV2BitDepth = Literal[8, 16, 24, 32]

LiveV2SampleRate = Literal[8000, 16000, 32000, 44100, 48000]

LiveV2Model = Literal["solaria-1", "solaria-2"]

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


@dataclass(frozen=True, slots=True)
class LiveV2LanguageConfig(BaseDataClass):
  # If one language is set, it will be used for the transcription. Otherwise, language will be
  # auto-detected by the model.
  languages: list[LiveV2TranscriptionLanguageCode] | None = None
  # If true, language will be auto-detected on each utterance. Otherwise, language will be
  # auto-detected on first utterance and then used for the rest of the transcription. If one
  # language is set, this option will be ignored.
  code_switching: bool | None = None


@dataclass(frozen=True, slots=True)
class LiveV2PreProcessingConfig(BaseDataClass):
  # If true, apply pre-processing to the audio stream to enhance the quality.
  audio_enhancer: bool | None = None
  # Sensitivity configuration for Speech Threshold. A value close to 1 will apply stricter
  # thresholds, making it less likely to detect background sounds as speech.
  speech_threshold: float | None = None


@dataclass(frozen=True, slots=True)
class LiveV2CustomVocabularyEntry(BaseDataClass):
  # The text used to replace in the transcription.
  value: str
  # The global intensity of the feature.
  intensity: float | None = None
  # The pronunciations used in the transcription.
  pronunciations: list[str] | None = None
  # Specify the language in which it will be pronounced when sound comparison occurs. Default to
  # transcription language.
  language: LiveV2TranscriptionLanguageCode | None = None


@dataclass(frozen=True, slots=True)
class LiveV2CustomVocabularyConfig(BaseDataClass):
  # Specific vocabulary list to feed the transcription model with. Each item can be a string or an
  # object with the following properties: value, intensity, pronunciations, language.
  vocabulary: list[LiveV2CustomVocabularyEntry | str]
  # Default intensity for the custom vocabulary
  default_intensity: float | None = None


@dataclass(frozen=True, slots=True)
class LiveV2CustomSpellingConfig(BaseDataClass):
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


@dataclass(frozen=True, slots=True)
class LiveV2TranslationConfig(BaseDataClass):
  # Target language in `iso639-1` format you want the transcription translated to
  target_languages: list[LiveV2TranslationLanguageCode]
  # Model you want the translation model to use to translate
  model: LiveV2TranslationModel | None = None
  # Align translated utterances with the original ones
  match_original_utterances: bool | None = None
  # Whether to apply lipsync to the translated transcription.
  lipsync: bool | None = None
  # Enables or disables context-aware translation features that allow the model to adapt
  # translations based on provided context.
  context_adaptation: bool | None = None
  # Context information to improve translation accuracy
  context: str | None = None
  # Forces the translation to use informal language forms when available in the target language.
  informal: bool | None = None


@dataclass(frozen=True, slots=True)
class LiveV2RealtimeProcessingConfig(BaseDataClass):
  # If true, enable custom vocabulary for the transcription.
  custom_vocabulary: bool | None = None
  # Custom vocabulary configuration, if `custom_vocabulary` is enabled
  custom_vocabulary_config: LiveV2CustomVocabularyConfig | None = None
  # If true, enable custom spelling for the transcription.
  custom_spelling: bool | None = None
  # Custom spelling configuration, if `custom_spelling` is enabled
  custom_spelling_config: LiveV2CustomSpellingConfig | None = None
  # If true, enable translation for the transcription
  translation: bool | None = None
  # Translation configuration, if `translation` is enabled
  translation_config: LiveV2TranslationConfig | None = None
  # If true, enable named entity recognition for the transcription.
  named_entity_recognition: bool | None = None
  # If true, enable sentiment analysis for the transcription.
  sentiment_analysis: bool | None = None


LiveV2SummaryType = Literal["general", "bullet_points", "concise"]


@dataclass(frozen=True, slots=True)
class LiveV2SummarizationConfig(BaseDataClass):
  # The type of summarization to apply
  type: LiveV2SummaryType | None = None


@dataclass(frozen=True, slots=True)
class LiveV2PostProcessingConfig(BaseDataClass):
  # If true, generates summarization for the whole transcription.
  summarization: bool | None = None
  # Summarization configuration, if `summarization` is enabled
  summarization_config: LiveV2SummarizationConfig | None = None
  # If true, generates chapters for the whole transcription.
  chapterization: bool | None = None


@dataclass(frozen=True, slots=True)
class LiveV2MessagesConfig(BaseDataClass):
  # If true, partial transcript will be sent to websocket.
  receive_partial_transcripts: bool | None = None
  # If true, final transcript will be sent to websocket.
  receive_final_transcripts: bool | None = None
  # If true, begin and end speech events will be sent to websocket.
  receive_speech_events: bool | None = None
  # If true, pre-processing events will be sent to websocket.
  receive_pre_processing_events: bool | None = None
  # If true, realtime processing events will be sent to websocket.
  receive_realtime_processing_events: bool | None = None
  # If true, post-processing events will be sent to websocket.
  receive_post_processing_events: bool | None = None
  # If true, acknowledgments will be sent to websocket.
  receive_acknowledgments: bool | None = None
  # If true, errors will be sent to websocket.
  receive_errors: bool | None = None
  # If true, lifecycle events will be sent to websocket.
  receive_lifecycle_events: bool | None = None


@dataclass(frozen=True, slots=True)
class LiveV2CallbackConfig(BaseDataClass):
  # URL on which we will do a `POST` request with configured messages
  url: str | None = None
  # If true, partial transcript will be sent to the defined callback.
  receive_partial_transcripts: bool | None = None
  # If true, final transcript will be sent to the defined callback.
  receive_final_transcripts: bool | None = None
  # If true, begin and end speech events will be sent to the defined callback.
  receive_speech_events: bool | None = None
  # If true, pre-processing events will be sent to the defined callback.
  receive_pre_processing_events: bool | None = None
  # If true, realtime processing events will be sent to the defined callback.
  receive_realtime_processing_events: bool | None = None
  # If true, post-processing events will be sent to the defined callback.
  receive_post_processing_events: bool | None = None
  # If true, acknowledgments will be sent to the defined callback.
  receive_acknowledgments: bool | None = None
  # If true, errors will be sent to the defined callback.
  receive_errors: bool | None = None
  # If true, lifecycle events will be sent to the defined callback.
  receive_lifecycle_events: bool | None = None


@dataclass(frozen=True, slots=True)
class LiveV2Error(BaseDataClass):
  # The error message
  message: str


@dataclass(frozen=True, slots=True)
class LiveV2AudioChunkAckData(BaseDataClass):
  # Range in bytes length of the audio chunk (relative to the whole session)
  byte_range: list[int]
  # Range in seconds of the audio chunk (relative to the whole session)
  time_range: list[float]


@dataclass(frozen=True, slots=True)
class LiveV2EndRecordingMessageData(BaseDataClass):
  # Total audio duration in seconds
  recording_duration: float


@dataclass(frozen=True, slots=True)
class LiveV2Word(BaseDataClass):
  # Spoken word
  word: str
  # Start timestamps in seconds of the spoken word
  start: float
  # End timestamps in seconds of the spoken word
  end: float
  # Confidence on the transcribed word (1 = 100% confident)
  confidence: float


@dataclass(frozen=True, slots=True)
class LiveV2Utterance(BaseDataClass):
  # Start timestamp in seconds of this utterance
  start: float
  # End timestamp in seconds of this utterance
  end: float
  # Confidence on the transcribed utterance (1 = 100% confident)
  confidence: float
  # Audio channel of where this utterance has been transcribed from
  channel: int
  # List of words of the utterance, split by timestamp
  words: list[LiveV2Word]
  # Transcription for this utterance
  text: str
  # Spoken language in this utterance
  language: LiveV2TranscriptionLanguageCode
  # If `diarization` enabled, speaker identification number
  speaker: int | None = None


@dataclass(frozen=True, slots=True)
class LiveV2TranslationData(BaseDataClass):
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


@dataclass(frozen=True, slots=True)
class LiveV2NamedEntityRecognitionResult(BaseDataClass):
  entity_type: str
  text: str
  start: float
  end: float


@dataclass(frozen=True, slots=True)
class LiveV2NamedEntityRecognitionData(BaseDataClass):
  # Id of the utterance used for this result
  utterance_id: str
  # The transcribed utterance
  utterance: LiveV2Utterance
  # The NER results
  results: list[LiveV2NamedEntityRecognitionResult]


@dataclass(frozen=True, slots=True)
class LiveV2ChapterizationSentence(BaseDataClass):
  sentence: str
  start: float
  end: float
  words: list[LiveV2Word]


@dataclass(frozen=True, slots=True)
class LiveV2PostChapterizationResult(BaseDataClass):
  headline: str
  gist: str
  keywords: list[str]
  start: float
  end: float
  sentences: list[LiveV2ChapterizationSentence]
  text: str
  abstractive_summary: str | None = None
  extractive_summary: str | None = None
  summary: str | None = None


@dataclass(frozen=True, slots=True)
class LiveV2PostChapterizationMessageData(BaseDataClass):
  # The chapters
  results: list[LiveV2PostChapterizationResult]


@dataclass(frozen=True, slots=True)
class LiveV2TranscriptionMetadata(BaseDataClass):
  # Duration of the transcribed audio file
  audio_duration: float
  # Number of distinct channels in the transcribed audio file
  number_of_distinct_channels: int
  # Billed duration in seconds (audio_duration * number_of_distinct_channels)
  billing_time: float
  # Duration of the transcription in seconds
  transcription_time: float


@dataclass(frozen=True, slots=True)
class LiveV2AddonError(BaseDataClass):
  # Status code of the addon error
  status_code: int
  # Reason of the addon error
  exception: str
  # Detailed message of the addon error
  message: str


@dataclass(frozen=True, slots=True)
class LiveV2Sentences(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: LiveV2AddonError | None = None
  # If `sentences` has been enabled, transcription as sentences.
  results: list[str] | None = None


LiveV2SubtitlesFormat = Literal["srt", "vtt"]


@dataclass(frozen=True, slots=True)
class LiveV2Subtitle(BaseDataClass):
  # Format of the current subtitle
  format: LiveV2SubtitlesFormat
  # Transcription on the asked subtitle format
  subtitles: str


@dataclass(frozen=True, slots=True)
class LiveV2Transcription(BaseDataClass):
  # All transcription on text format without any other information
  full_transcript: str
  # All the detected languages in the audio sorted from the most detected to the less detected
  languages: list[LiveV2TranscriptionLanguageCode]
  # Transcribed speech utterances present in the audio
  utterances: list[LiveV2Utterance]
  # If `sentences` has been enabled, sentences results
  sentences: list[LiveV2Sentences] | None = None
  # If `subtitles` has been enabled, subtitles results
  subtitles: list[LiveV2Subtitle] | None = None


@dataclass(frozen=True, slots=True)
class LiveV2TranslationResult(BaseDataClass):
  # All transcription on text format without any other information
  full_transcript: str
  # All the detected languages in the audio sorted from the most detected to the less detected
  languages: list[LiveV2TranslationLanguageCode]
  # Transcribed speech utterances present in the audio
  utterances: list[LiveV2Utterance]
  # Contains the error details of the failed addon
  error: LiveV2AddonError | None = None
  # If `sentences` has been enabled, sentences results for this translation
  sentences: list[LiveV2Sentences] | None = None
  # If `subtitles` has been enabled, subtitles results for this translation
  subtitles: list[LiveV2Subtitle] | None = None


@dataclass(frozen=True, slots=True)
class LiveV2Translation(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: LiveV2AddonError | None = None
  # List of translated transcriptions, one for each `target_languages`
  results: list[LiveV2TranslationResult] | None = None


@dataclass(frozen=True, slots=True)
class LiveV2Summarization(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: LiveV2AddonError | None = None
  # If `summarization` has been enabled, summary of the transcription
  results: str | None = None


@dataclass(frozen=True, slots=True)
class LiveV2NamedEntityRecognition(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # If `named_entity_recognition` has been enabled, the detected entities.
  entity: str
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: LiveV2AddonError | None = None


@dataclass(frozen=True, slots=True)
class LiveV2SentimentAnalysis(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # If `sentiment_analysis` has been enabled, Gladia will analyze the sentiments and emotions of
  # the audio
  results: str
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: LiveV2AddonError | None = None


@dataclass(frozen=True, slots=True)
class LiveV2Chapterization(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # If `chapterization` has been enabled, will generate chapters name for different parts of the
  # given audio.
  results: dict[str, Any]
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: LiveV2AddonError | None = None


@dataclass(frozen=True, slots=True)
class LiveV2TranscriptionResult(BaseDataClass):
  # Metadata for the given transcription & audio file
  metadata: LiveV2TranscriptionMetadata
  # Transcription of the audio speech
  transcription: LiveV2Transcription | None = None
  # If `translation` has been enabled, translation of the audio speech transcription
  translation: LiveV2Translation | None = None
  # If `summarization` has been enabled, summarization of the audio speech transcription
  summarization: LiveV2Summarization | None = None
  # If `named_entity_recognition` has been enabled, the detected entities
  named_entity_recognition: LiveV2NamedEntityRecognition | None = None
  # If `sentiment_analysis` has been enabled, sentiment analysis of the audio speech transcription
  sentiment_analysis: LiveV2SentimentAnalysis | None = None
  # If `chapterization` has been enabled, will generate chapters name for different parts of the
  # given audio.
  chapterization: LiveV2Chapterization | None = None


@dataclass(frozen=True, slots=True)
class LiveV2PostSummarizationMessageData(BaseDataClass):
  # The summarization
  results: str


@dataclass(frozen=True, slots=True)
class LiveV2SentimentAnalysisResult(BaseDataClass):
  sentiment: str
  emotion: str
  text: str
  start: float
  end: float
  channel: float


@dataclass(frozen=True, slots=True)
class LiveV2SentimentAnalysisData(BaseDataClass):
  # Id of the utterance used for this result
  utterance_id: str
  # The transcribed utterance
  utterance: LiveV2Utterance
  # The sentiment analysis results
  results: list[LiveV2SentimentAnalysisResult]


@dataclass(frozen=True, slots=True)
class LiveV2StopRecordingAckData(BaseDataClass):
  # Total audio duration in seconds
  recording_duration: float
  # Audio duration left to process in seconds
  recording_left_to_process: float


@dataclass(frozen=True, slots=True)
class LiveV2TranscriptMessageData(BaseDataClass):
  # Id of the utterance
  id: str
  # Flag to indicate if the transcript is final or not
  is_final: bool
  # The transcribed utterance
  utterance: LiveV2Utterance


@dataclass(frozen=True, slots=True)
class LiveV2SpeechMessageData(BaseDataClass):
  # Timestamp in seconds of the speech event
  time: float
  # Channel of the speech event
  channel: float


@dataclass(frozen=True, slots=True)
class LiveV2EventPayload(BaseDataClass):
  # Id of the job
  id: str


# Init Session Types
@dataclass(frozen=True, slots=True)
class LiveV2InitRequest(BaseDataClass):
  # The encoding format of the audio stream. Supported formats:
  # - PCM: 8, 16, 24, and 32 bits
  # - A-law: 8 bits
  # - μ-law: 8 bits
  #
  # Note: No need to add WAV headers to raw audio as the API supports both formats.
  encoding: LiveV2Encoding | None = None
  # The bit depth of the audio stream
  bit_depth: LiveV2BitDepth | None = None
  # The sample rate of the audio stream
  sample_rate: LiveV2SampleRate | None = None
  # The number of channels of the audio stream
  channels: int | None = None
  # Custom metadata you can attach to this live transcription
  custom_metadata: dict[str, Any] | None = None
  # The model used to process the audio. "solaria-1" is used by default.
  model: LiveV2Model | None = None
  # The endpointing duration in seconds. Endpointing is the duration of silence which will cause
  # an utterance to be considered as finished
  endpointing: float | None = None
  # The maximum duration in seconds without endpointing. If endpointing is not detected after this
  # duration, current utterance will be considered as finished
  maximum_duration_without_endpointing: float | None = None
  # Specify the language configuration
  language_config: LiveV2LanguageConfig | None = None
  # Specify the pre-processing configuration
  pre_processing: LiveV2PreProcessingConfig | None = None
  # Specify the realtime processing configuration
  realtime_processing: LiveV2RealtimeProcessingConfig | None = None
  # Specify the post-processing configuration
  post_processing: LiveV2PostProcessingConfig | None = None
  # Specify the websocket messages configuration
  messages_config: LiveV2MessagesConfig | None = None
  # If true, messages will be sent to configured url.
  callback: bool | None = None
  # Specify the callback configuration
  callback_config: LiveV2CallbackConfig | None = None


@dataclass(frozen=True, slots=True)
class LiveV2InitResponse(BaseDataClass):
  # Id of the job
  id: str
  # Creation date
  created_at: str
  # The websocket url to connect to for sending audio data. The url will contain the temporary
  # token to authenticate the session.
  url: str


# WebSocket Messages Types
@dataclass(frozen=True, slots=True)
class LiveV2AudioChunkAckMessage(BaseDataClass):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  # Flag to indicate if the action was successfully acknowledged
  acknowledged: bool
  type: Literal["audio_chunk"]
  # Error message if the action was not successfully acknowledged
  error: LiveV2Error | None = None
  # The message data. "null" if the action was not successfully acknowledged
  data: LiveV2AudioChunkAckData | None = None


@dataclass(frozen=True, slots=True)
class LiveV2EndRecordingMessage(BaseDataClass):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["end_recording"]
  # The message data
  data: LiveV2EndRecordingMessageData


@dataclass(frozen=True, slots=True)
class LiveV2EndSessionMessage(BaseDataClass):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["end_session"]


@dataclass(frozen=True, slots=True)
class LiveV2TranslationMessage(BaseDataClass):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["translation"]
  # Error message if the addon failed
  error: LiveV2Error | None = None
  # The message data. "null" if the addon failed
  data: LiveV2TranslationData | None = None


@dataclass(frozen=True, slots=True)
class LiveV2NamedEntityRecognitionMessage(BaseDataClass):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["named_entity_recognition"]
  # Error message if the addon failed
  error: LiveV2Error | None = None
  # The message data. "null" if the addon failed
  data: LiveV2NamedEntityRecognitionData | None = None


@dataclass(frozen=True, slots=True)
class LiveV2PostChapterizationMessage(BaseDataClass):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["post_chapterization"]
  # Error message if the addon failed
  error: LiveV2Error | None = None
  # The message data. "null" if the addon failed
  data: LiveV2PostChapterizationMessageData | None = None


@dataclass(frozen=True, slots=True)
class LiveV2PostFinalTranscriptMessage(BaseDataClass):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["post_final_transcript"]
  # The message data
  data: LiveV2TranscriptionResult


@dataclass(frozen=True, slots=True)
class LiveV2PostSummarizationMessage(BaseDataClass):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["post_summarization"]
  # Error message if the addon failed
  error: LiveV2Error | None = None
  # The message data. "null" if the addon failed
  data: LiveV2PostSummarizationMessageData | None = None


@dataclass(frozen=True, slots=True)
class LiveV2PostTranscriptMessage(BaseDataClass):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["post_transcript"]
  # The message data
  data: LiveV2Transcription


@dataclass(frozen=True, slots=True)
class LiveV2SentimentAnalysisMessage(BaseDataClass):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["sentiment_analysis"]
  # Error message if the addon failed
  error: LiveV2Error | None = None
  # The message data. "null" if the addon failed
  data: LiveV2SentimentAnalysisData | None = None


@dataclass(frozen=True, slots=True)
class LiveV2StartRecordingMessage(BaseDataClass):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["start_recording"]


@dataclass(frozen=True, slots=True)
class LiveV2StartSessionMessage(BaseDataClass):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["start_session"]


@dataclass(frozen=True, slots=True)
class LiveV2StopRecordingAckMessage(BaseDataClass):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  # Flag to indicate if the action was successfully acknowledged
  acknowledged: bool
  type: Literal["stop_recording"]
  # Error message if the action was not successfully acknowledged
  error: LiveV2Error | None = None
  # The message data. "null" if the action was not successfully acknowledged
  data: LiveV2StopRecordingAckData | None = None


@dataclass(frozen=True, slots=True)
class LiveV2TranscriptMessage(BaseDataClass):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["transcript"]
  # The message data
  data: LiveV2TranscriptMessageData


@dataclass(frozen=True, slots=True)
class LiveV2SpeechStartMessage(BaseDataClass):
  # Id of the live session
  session_id: str
  # Date of creation of the message. The date is formatted as an ISO 8601 string
  created_at: str
  type: Literal["speech_start"]
  # The message data
  data: LiveV2SpeechMessageData


@dataclass(frozen=True, slots=True)
class LiveV2SpeechEndMessage(BaseDataClass):
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
_WS_TYPE_TO_CLASS: dict[str, type[LiveV2WebSocketMessage]] = {
  "audio_chunk": LiveV2AudioChunkAckMessage,
  "end_recording": LiveV2EndRecordingMessage,
  "end_session": LiveV2EndSessionMessage,
  "translation": LiveV2TranslationMessage,
  "named_entity_recognition": LiveV2NamedEntityRecognitionMessage,
  "post_chapterization": LiveV2PostChapterizationMessage,
  "post_final_transcript": LiveV2PostFinalTranscriptMessage,
  "post_summarization": LiveV2PostSummarizationMessage,
  "post_transcript": LiveV2PostTranscriptMessage,
  "sentiment_analysis": LiveV2SentimentAnalysisMessage,
  "start_recording": LiveV2StartRecordingMessage,
  "start_session": LiveV2StartSessionMessage,
  "stop_recording": LiveV2StopRecordingAckMessage,
  "transcript": LiveV2TranscriptMessage,
  "speech_start": LiveV2SpeechStartMessage,
  "speech_end": LiveV2SpeechEndMessage,
}


def create_live_v2_web_socket_message_from_dict(payload: dict[str, Any]) -> LiveV2WebSocketMessage:
  message_key = payload.get("type")

  if not isinstance(message_key, str):
    raise ValueError("Missing or invalid 'type' field in websocket message payload")

  try:
    cls = _WS_TYPE_TO_CLASS[message_key]
  except KeyError as exc:
    raise ValueError(f"Unsupported websocket message type: {message_key}") from exc

  return cls.from_dict(payload)


def create_live_v2_web_socket_message_from_json(
  data: str | bytes | bytearray,
) -> LiveV2WebSocketMessage:
  parsed = json.loads(data)
  if not isinstance(parsed, dict):
    raise ValueError("websocket message JSON must represent an object")

  return create_live_v2_web_socket_message_from_dict(parsed)


# Callback Messages Types
@dataclass(frozen=True, slots=True)
class LiveV2CallbackAudioChunkAckMessage(BaseDataClass):
  # Id of the job
  id: str
  event: Literal["live.audio_chunk"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2AudioChunkAckMessage


@dataclass(frozen=True, slots=True)
class LiveV2CallbackEndRecordingMessage(BaseDataClass):
  # Id of the job
  id: str
  event: Literal["live.end_recording"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2EndRecordingMessage


@dataclass(frozen=True, slots=True)
class LiveV2CallbackEndSessionMessage(BaseDataClass):
  # Id of the job
  id: str
  event: Literal["live.end_session"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2EndSessionMessage


@dataclass(frozen=True, slots=True)
class LiveV2CallbackTranslationMessage(BaseDataClass):
  # Id of the job
  id: str
  event: Literal["live.translation"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2TranslationMessage


@dataclass(frozen=True, slots=True)
class LiveV2CallbackNamedEntityRecognitionMessage(BaseDataClass):
  # Id of the job
  id: str
  event: Literal["live.named_entity_recognition"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2NamedEntityRecognitionMessage


@dataclass(frozen=True, slots=True)
class LiveV2CallbackPostChapterizationMessage(BaseDataClass):
  # Id of the job
  id: str
  event: Literal["live.post_chapterization"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2PostChapterizationMessage


@dataclass(frozen=True, slots=True)
class LiveV2CallbackPostFinalTranscriptMessage(BaseDataClass):
  # Id of the job
  id: str
  event: Literal["live.post_final_transcript"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2PostFinalTranscriptMessage


@dataclass(frozen=True, slots=True)
class LiveV2CallbackPostSummarizationMessage(BaseDataClass):
  # Id of the job
  id: str
  event: Literal["live.post_summarization"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2PostSummarizationMessage


@dataclass(frozen=True, slots=True)
class LiveV2CallbackPostTranscriptMessage(BaseDataClass):
  # Id of the job
  id: str
  event: Literal["live.post_transcript"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2PostTranscriptMessage


@dataclass(frozen=True, slots=True)
class LiveV2CallbackSentimentAnalysisMessage(BaseDataClass):
  # Id of the job
  id: str
  event: Literal["live.sentiment_analysis"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2SentimentAnalysisMessage


@dataclass(frozen=True, slots=True)
class LiveV2CallbackStartRecordingMessage(BaseDataClass):
  # Id of the job
  id: str
  event: Literal["live.start_recording"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2StartRecordingMessage


@dataclass(frozen=True, slots=True)
class LiveV2CallbackStartSessionMessage(BaseDataClass):
  # Id of the job
  id: str
  event: Literal["live.start_session"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2StartSessionMessage


@dataclass(frozen=True, slots=True)
class LiveV2CallbackStopRecordingAckMessage(BaseDataClass):
  # Id of the job
  id: str
  event: Literal["live.stop_recording"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2StopRecordingAckMessage


@dataclass(frozen=True, slots=True)
class LiveV2CallbackTranscriptMessage(BaseDataClass):
  # Id of the job
  id: str
  event: Literal["live.transcript"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2TranscriptMessage


@dataclass(frozen=True, slots=True)
class LiveV2CallbackSpeechStartMessage(BaseDataClass):
  # Id of the job
  id: str
  event: Literal["live.speech_start"]
  # The live message payload as sent to the WebSocket
  payload: LiveV2SpeechStartMessage


@dataclass(frozen=True, slots=True)
class LiveV2CallbackSpeechEndMessage(BaseDataClass):
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
_CALLBACK_EVENT_TO_CLASS: dict[str, type[LiveV2CallbackMessage]] = {
  "live.audio_chunk": LiveV2CallbackAudioChunkAckMessage,
  "live.end_recording": LiveV2CallbackEndRecordingMessage,
  "live.end_session": LiveV2CallbackEndSessionMessage,
  "live.translation": LiveV2CallbackTranslationMessage,
  "live.named_entity_recognition": LiveV2CallbackNamedEntityRecognitionMessage,
  "live.post_chapterization": LiveV2CallbackPostChapterizationMessage,
  "live.post_final_transcript": LiveV2CallbackPostFinalTranscriptMessage,
  "live.post_summarization": LiveV2CallbackPostSummarizationMessage,
  "live.post_transcript": LiveV2CallbackPostTranscriptMessage,
  "live.sentiment_analysis": LiveV2CallbackSentimentAnalysisMessage,
  "live.start_recording": LiveV2CallbackStartRecordingMessage,
  "live.start_session": LiveV2CallbackStartSessionMessage,
  "live.stop_recording": LiveV2CallbackStopRecordingAckMessage,
  "live.transcript": LiveV2CallbackTranscriptMessage,
  "live.speech_start": LiveV2CallbackSpeechStartMessage,
  "live.speech_end": LiveV2CallbackSpeechEndMessage,
}


def create_live_v2_callback_message_from_dict(payload: dict[str, Any]) -> LiveV2CallbackMessage:
  message_key = payload.get("event")

  if not isinstance(message_key, str):
    raise ValueError("Missing or invalid 'event' field in callback message payload")

  try:
    cls = _CALLBACK_EVENT_TO_CLASS[message_key]
  except KeyError as exc:
    raise ValueError(f"Unsupported callback message event: {message_key}") from exc

  return cls.from_dict(payload)


def create_live_v2_callback_message_from_json(
  data: str | bytes | bytearray,
) -> LiveV2CallbackMessage:
  parsed = json.loads(data)
  if not isinstance(parsed, dict):
    raise ValueError("callback message JSON must represent an object")

  return create_live_v2_callback_message_from_dict(parsed)


# Webhook Messages Types
@dataclass(frozen=True, slots=True)
class LiveV2WebhookStartSessionMessage(BaseDataClass):
  event: Literal["live.start_session"]
  payload: LiveV2EventPayload


@dataclass(frozen=True, slots=True)
class LiveV2WebhookStartRecordingMessage(BaseDataClass):
  event: Literal["live.start_recording"]
  payload: LiveV2EventPayload


@dataclass(frozen=True, slots=True)
class LiveV2WebhookEndRecordingMessage(BaseDataClass):
  event: Literal["live.end_recording"]
  payload: LiveV2EventPayload


@dataclass(frozen=True, slots=True)
class LiveV2WebhookEndSessionMessage(BaseDataClass):
  event: Literal["live.end_session"]
  payload: LiveV2EventPayload


# Union of all webhook messages
LiveV2WebhookMessage = (
  LiveV2WebhookStartSessionMessage
  | LiveV2WebhookStartRecordingMessage
  | LiveV2WebhookEndRecordingMessage
  | LiveV2WebhookEndSessionMessage
)
_WEBHOOK_EVENT_TO_CLASS: dict[str, type[LiveV2WebhookMessage]] = {
  "live.start_session": LiveV2WebhookStartSessionMessage,
  "live.start_recording": LiveV2WebhookStartRecordingMessage,
  "live.end_recording": LiveV2WebhookEndRecordingMessage,
  "live.end_session": LiveV2WebhookEndSessionMessage,
}


def create_live_v2_webhook_message_from_dict(payload: dict[str, Any]) -> LiveV2WebhookMessage:
  message_key = payload.get("event")

  if not isinstance(message_key, str):
    raise ValueError("Missing or invalid 'event' field in webhook message payload")

  try:
    cls = _WEBHOOK_EVENT_TO_CLASS[message_key]
  except KeyError as exc:
    raise ValueError(f"Unsupported webhook message event: {message_key}") from exc

  return cls.from_dict(payload)


def create_live_v2_webhook_message_from_json(data: str | bytes | bytearray) -> LiveV2WebhookMessage:
  parsed = json.loads(data)
  if not isinstance(parsed, dict):
    raise ValueError("webhook message JSON must represent an object")

  return create_live_v2_webhook_message_from_dict(parsed)
