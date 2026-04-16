# This file is auto-generated. Do not edit manually.
# Generated from OpenAPI schema.
from __future__ import annotations

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
@dataclass(frozen=True, slots=True)
class PreRecordedV2AudioUploadMetadata(BaseDataClass):
  # Uploaded audio file ID
  id: str
  # Uploaded audio filename
  filename: str
  # Uploaded audio detected extension
  extension: str
  # Uploaded audio size
  size: int
  # Uploaded audio duration
  audio_duration: float
  # Uploaded audio channel numbers
  number_of_channels: int
  # Uploaded audio source
  source: str | None = None


PreRecordedV2TranscriptionLanguageCode = Literal[
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
  "zh",
]


@dataclass(frozen=True, slots=True)
class PreRecordedV2CustomVocabularyEntry(BaseDataClass):
  # The text used to replace in the transcription.
  value: str
  # The global intensity of the feature.
  intensity: float | None = None
  # The pronunciations used in the transcription.
  pronunciations: list[str] | None = None
  # Specify the language in which it will be pronounced when sound comparison occurs. Default to
  # transcription language.
  language: PreRecordedV2TranscriptionLanguageCode | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2CustomVocabularyConfig(BaseDataClass):
  # Specific vocabulary list to feed the transcription model with. Each item can be a string or an
  # object with the following properties: value, intensity, pronunciations, language.
  vocabulary: list[PreRecordedV2CustomVocabularyEntry | str]
  # Default intensity for the custom vocabulary
  default_intensity: float | None = None


PreRecordedV2CallbackMethod = Literal["POST", "PUT"]


@dataclass(frozen=True, slots=True)
class PreRecordedV2CallbackConfig(BaseDataClass):
  # The URL to be called with the result of the transcription
  url: str
  # The HTTP method to be used. Allowed values are `POST` or `PUT` (default: `POST`)
  method: PreRecordedV2CallbackMethod | None = None


PreRecordedV2SubtitlesFormat = Literal["srt", "vtt"]

PreRecordedV2SubtitlesStyle = Literal["default", "compliance"]


@dataclass(frozen=True, slots=True)
class PreRecordedV2SubtitlesConfig(BaseDataClass):
  # Subtitles formats you want your transcription to be formatted to
  formats: list[PreRecordedV2SubtitlesFormat] | None = None
  # Minimum duration of a subtitle in seconds
  minimum_duration: float | None = None
  # Maximum duration of a subtitle in seconds
  maximum_duration: float | None = None
  # Maximum number of characters per row in a subtitle
  maximum_characters_per_row: int | None = None
  # Maximum number of rows per caption
  maximum_rows_per_caption: int | None = None
  # Style of the subtitles. Compliance mode refers to :
  # https://loc.gov/preservation/digital/formats//fdd/fdd000569.shtml#:~:text=SRT%20files%20are%20basic%20text,alongside%2C%20example%3A%20%22MyVideo123
  style: PreRecordedV2SubtitlesStyle | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2DiarizationConfig(BaseDataClass):
  # Exact number of speakers in the audio
  number_of_speakers: int | None = None
  # Minimum number of speakers in the audio
  min_speakers: int | None = None
  # Maximum number of speakers in the audio
  max_speakers: int | None = None


PreRecordedV2TranslationLanguageCode = Literal[
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
  "zh",
]

PreRecordedV2TranslationModel = Literal["base", "enhanced"]


@dataclass(frozen=True, slots=True)
class PreRecordedV2TranslationConfig(BaseDataClass):
  # Target language in `iso639-1` format you want the transcription translated to
  target_languages: list[PreRecordedV2TranslationLanguageCode]
  # Model you want the translation model to use to translate
  model: PreRecordedV2TranslationModel | None = None
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


PreRecordedV2SummaryType = Literal["general", "bullet_points", "concise"]


@dataclass(frozen=True, slots=True)
class PreRecordedV2SummarizationConfig(BaseDataClass):
  # The type of summarization to apply
  type: PreRecordedV2SummaryType | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2CustomSpellingConfig(BaseDataClass):
  # The list of spelling applied on the audio transcription
  spelling_dictionary: dict[str, list[str]]


@dataclass(frozen=True, slots=True)
class PreRecordedV2AudioToLlmListConfig(BaseDataClass):
  # The list of prompts applied on the audio transcription
  prompts: list[list[Any]]
  # The model to use for the prompt execution. You can find the list of supported models
  # [here](https://openrouter.ai/models).
  model: str | None = None


PreRecordedV2PiiRedactionEntityType = Literal[
  "APPI",
  "APPI_SENSITIVE",
  "CCI",
  "CORE_ENTITIES",
  "CPRA",
  "GDPR",
  "GDPR_SENSITIVE",
  "HEALTH_INFORMATION",
  "HIPAA_SAFE_HARBOR",
  "LIDI",
  "NUMERICAL_EXCL_PCI",
  "PCI",
  "QUEBEC_PRIVACY_ACT",
  "ACCOUNT_NUMBER",
  "AGE",
  "DATE",
  "DATE_INTERVAL",
  "DOB",
  "DRIVER_LICENSE",
  "DURATION",
  "EMAIL_ADDRESS",
  "EVENT",
  "FILENAME",
  "GENDER",
  "HEALTHCARE_NUMBER",
  "IP_ADDRESS",
  "LANGUAGE",
  "LOCATION",
  "LOCATION_ADDRESS",
  "LOCATION_ADDRESS_STREET",
  "LOCATION_CITY",
  "LOCATION_COORDINATE",
  "LOCATION_COUNTRY",
  "LOCATION_STATE",
  "LOCATION_ZIP",
  "MARITAL_STATUS",
  "MONEY",
  "NAME",
  "NAME_FAMILY",
  "NAME_GIVEN",
  "NAME_MEDICAL_PROFESSIONAL",
  "NUMERICAL_PII",
  "OCCUPATION",
  "ORGANIZATION",
  "ORGANIZATION_MEDICAL_FACILITY",
  "ORIGIN",
  "PASSPORT_NUMBER",
  "PASSWORD",
  "PHONE_NUMBER",
  "PHYSICAL_ATTRIBUTE",
  "POLITICAL_AFFILIATION",
  "RELIGION",
  "SEXUALITY",
  "SSN",
  "TIME",
  "URL",
  "USERNAME",
  "VEHICLE_ID",
  "ZODIAC_SIGN",
  "BLOOD_TYPE",
  "CONDITION",
  "DOSE",
  "DRUG",
  "INJURY",
  "MEDICAL_PROCESS",
  "STATISTICS",
  "BANK_ACCOUNT",
  "CREDIT_CARD",
  "CREDIT_CARD_EXPIRATION",
  "CVV",
  "ROUTING_NUMBER",
  "CORPORATE_ACTION",
  "DAY",
  "EFFECT",
  "FINANCIAL_METRIC",
  "MEDICAL_CODE",
  "MONTH",
  "ORGANIZATION_ID",
  "PRODUCT",
  "PROJECT",
  "TREND",
  "YEAR",
]


@dataclass(frozen=True, slots=True)
class PreRecordedV2PiiRedactionConfig(BaseDataClass):
  # The entity types to redact
  entity_types: PreRecordedV2PiiRedactionEntityType | None = None
  # The type of processed text to return (marker or mask)
  processed_text_type: Literal["MARKER", "MASK"] | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2LanguageConfig(BaseDataClass):
  # If one language is set, it will be used for the transcription. Otherwise, language will be
  # auto-detected by the model.
  languages: list[PreRecordedV2TranscriptionLanguageCode] | None = None
  # If true, language will be auto-detected on each utterance. Otherwise, language will be
  # auto-detected on first utterance and then used for the rest of the transcription. If one
  # language is set, this option will be ignored.
  code_switching: bool | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2FileResponse(BaseDataClass):
  # The file id
  id: str
  # The name of the uploaded file
  filename: str | None = None
  # The link used to download the file if audio_url was used
  source: str | None = None
  # Duration of the audio file
  audio_duration: float | None = None
  # Number of channels in the audio file
  number_of_channels: int | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2RequestParamsResponse(BaseDataClass):
  audio_url: str | None = None
  # **[Beta]** Can be either boolean to enable custom_vocabulary for this audio or an array with
  # specific vocabulary list to feed the transcription model with
  custom_vocabulary: bool | None = None
  # **[Beta]** Custom vocabulary configuration, if `custom_vocabulary` is enabled
  custom_vocabulary_config: PreRecordedV2CustomVocabularyConfig | None = None
  # **[Deprecated]** Use `callback`/`callback_config` instead. Callback URL we will do a `POST`
  # request to with the result of the transcription
  callback_url: str | None = None
  # Enable callback for this transcription. If true, the `callback_config` property will be used
  # to customize the callback behaviour
  callback: bool | None = None
  # Customize the callback behaviour (url and http method)
  callback_config: PreRecordedV2CallbackConfig | None = None
  # Enable subtitles generation for this transcription
  subtitles: bool | None = None
  # Configuration for subtitles generation if `subtitles` is enabled
  subtitles_config: PreRecordedV2SubtitlesConfig | None = None
  # Enable speaker recognition (diarization) for this audio
  diarization: bool | None = None
  # Speaker recognition configuration, if `diarization` is enabled
  diarization_config: PreRecordedV2DiarizationConfig | None = None
  # **[Beta]** Enable translation for this audio
  translation: bool | None = None
  # **[Beta]** Translation configuration, if `translation` is enabled
  translation_config: PreRecordedV2TranslationConfig | None = None
  # **[Beta]** Enable summarization for this audio
  summarization: bool | None = None
  # **[Beta]** Summarization configuration, if `summarization` is enabled
  summarization_config: PreRecordedV2SummarizationConfig | None = None
  # **[Alpha]** Enable named entity recognition for this audio
  named_entity_recognition: bool | None = None
  # **[Alpha]** Enable custom spelling for this audio
  custom_spelling: bool | None = None
  # **[Alpha]** Custom spelling configuration, if `custom_spelling` is enabled
  custom_spelling_config: PreRecordedV2CustomSpellingConfig | None = None
  # Enable sentiment analysis for this audio
  sentiment_analysis: bool | None = None
  # **[Alpha]** Enable audio to llm processing for this audio
  audio_to_llm: bool | None = None
  # **[Alpha]** Audio to llm configuration, if `audio_to_llm` is enabled
  audio_to_llm_config: PreRecordedV2AudioToLlmListConfig | None = None
  # Enable PII redaction for this audio
  pii_redaction: bool | None = None
  # PII redaction configuration, if `pii_redaction` is enabled
  pii_redaction_config: PreRecordedV2PiiRedactionConfig | None = None
  # Enable sentences for this audio
  sentences: bool | None = None
  # **[Alpha]** Use enhanced punctuation for this audio
  punctuation_enhanced: bool | None = None
  # Specify the language configuration
  language_config: PreRecordedV2LanguageConfig | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2TranscriptionMetadata(BaseDataClass):
  # Duration of the transcribed audio file
  audio_duration: float
  # Number of distinct channels in the transcribed audio file
  number_of_distinct_channels: int
  # Billed duration in seconds (audio_duration * number_of_distinct_channels)
  billing_time: float
  # Duration of the transcription in seconds
  transcription_time: float


@dataclass(frozen=True, slots=True)
class PreRecordedV2AddonError(BaseDataClass):
  # Status code of the addon error
  status_code: int
  # Reason of the addon error
  exception: str
  # Detailed message of the addon error
  message: str


@dataclass(frozen=True, slots=True)
class PreRecordedV2Sentences(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: PreRecordedV2AddonError | None = None
  # If `sentences` has been enabled, transcription as sentences.
  results: list[str] | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2Subtitle(BaseDataClass):
  # Format of the current subtitle
  format: PreRecordedV2SubtitlesFormat
  # Transcription on the asked subtitle format
  subtitles: str


@dataclass(frozen=True, slots=True)
class PreRecordedV2Word(BaseDataClass):
  # Spoken word
  word: str
  # Start timestamps in seconds of the spoken word
  start: float
  # End timestamps in seconds of the spoken word
  end: float
  # Confidence on the transcribed word (1 = 100% confident)
  confidence: float


@dataclass(frozen=True, slots=True)
class PreRecordedV2Utterance(BaseDataClass):
  # Start timestamp in seconds of this utterance
  start: float
  # End timestamp in seconds of this utterance
  end: float
  # Confidence on the transcribed utterance (1 = 100% confident)
  confidence: float
  # Audio channel of where this utterance has been transcribed from
  channel: int
  # List of words of the utterance, split by timestamp
  words: list[PreRecordedV2Word]
  # Transcription for this utterance
  text: str
  # Spoken language in this utterance
  language: PreRecordedV2TranscriptionLanguageCode
  # If `diarization` enabled, speaker identification number
  speaker: int | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2Transcription(BaseDataClass):
  # All transcription on text format without any other information
  full_transcript: str
  # All the detected languages in the audio sorted from the most detected to the less detected
  languages: list[PreRecordedV2TranscriptionLanguageCode]
  # Transcribed speech utterances present in the audio
  utterances: list[PreRecordedV2Utterance]
  # If `sentences` has been enabled, sentences results
  sentences: list[PreRecordedV2Sentences] | None = None
  # If `subtitles` has been enabled, subtitles results
  subtitles: list[PreRecordedV2Subtitle] | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2TranslationResult(BaseDataClass):
  # All transcription on text format without any other information
  full_transcript: str
  # All the detected languages in the audio sorted from the most detected to the less detected
  languages: list[PreRecordedV2TranslationLanguageCode]
  # Transcribed speech utterances present in the audio
  utterances: list[PreRecordedV2Utterance]
  # Contains the error details of the failed addon
  error: PreRecordedV2AddonError | None = None
  # If `sentences` has been enabled, sentences results for this translation
  sentences: list[PreRecordedV2Sentences] | None = None
  # If `subtitles` has been enabled, subtitles results for this translation
  subtitles: list[PreRecordedV2Subtitle] | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2Translation(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: PreRecordedV2AddonError | None = None
  # List of translated transcriptions, one for each `target_languages`
  results: list[PreRecordedV2TranslationResult] | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2Summarization(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: PreRecordedV2AddonError | None = None
  # If `summarization` has been enabled, summary of the transcription
  results: str | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2Moderation(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: PreRecordedV2AddonError | None = None
  # If `moderation` has been enabled, moderated transcription
  results: str | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2NamedEntityRecognitionResult(BaseDataClass):
  entity_type: str
  text: str
  start: float
  end: float


@dataclass(frozen=True, slots=True)
class PreRecordedV2NamedEntityRecognition(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: PreRecordedV2AddonError | None = None
  # If `named_entity_recognition` has been enabled, the detected entities.
  results: list[PreRecordedV2NamedEntityRecognitionResult] | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2NamesConsistency(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # Deprecated, If `name_consistency` has been enabled, Gladia will improve the consistency of the
  # names across the transcription
  results: str
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: PreRecordedV2AddonError | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2SpeakerReidentification(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # If `speaker_reidentification` has been enabled, results of the AI speaker reidentification.
  results: str
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: PreRecordedV2AddonError | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2StructuredDataExtraction(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # If `structured_data_extraction` has been enabled, results of the AI structured data extraction
  # for the defined classes.
  results: str
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: PreRecordedV2AddonError | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2SentimentAnalysis(BaseDataClass):
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
  error: PreRecordedV2AddonError | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2AudioToLlmResult(BaseDataClass):
  # The prompt used
  prompt: str | None = None
  # The result of the AI analysis
  response: str | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2AudioToLlm(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: PreRecordedV2AddonError | None = None
  # The result from a specific prompt
  results: PreRecordedV2AudioToLlmResult | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2AudioToLlmList(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: PreRecordedV2AddonError | None = None
  # If `audio_to_llm` has been enabled, results of the AI custom analysis
  results: list[PreRecordedV2AudioToLlm] | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2DisplayMode(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: PreRecordedV2AddonError | None = None
  # If `display_mode` has been enabled, proposes an alternative display output.
  results: list[str] | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2Chapterization(BaseDataClass):
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
  error: PreRecordedV2AddonError | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2Diarization(BaseDataClass):
  # The audio intelligence model succeeded to get a valid output
  success: bool
  # The audio intelligence model returned an empty value
  is_empty: bool
  # Time audio intelligence model took to complete the task
  exec_time: float
  # [Deprecated] If `diarization` has been enabled, the diarization result will appear here
  results: list[PreRecordedV2Utterance]
  # `null` if `success` is `true`. Contains the error details of the failed model
  error: PreRecordedV2AddonError | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2TranscriptionResult(BaseDataClass):
  # Metadata for the given transcription & audio file
  metadata: PreRecordedV2TranscriptionMetadata
  # Transcription of the audio speech
  transcription: PreRecordedV2Transcription | None = None
  # If `translation` has been enabled, translation of the audio speech transcription
  translation: PreRecordedV2Translation | None = None
  # If `summarization` has been enabled, summarization of the audio speech transcription
  summarization: PreRecordedV2Summarization | None = None
  # If `moderation` has been enabled, moderation of the audio speech transcription
  moderation: PreRecordedV2Moderation | None = None
  # If `named_entity_recognition` has been enabled, the detected entities
  named_entity_recognition: PreRecordedV2NamedEntityRecognition | None = None
  # If `name_consistency` has been enabled, Gladia will improve consistency of the names accross
  # the transcription
  name_consistency: PreRecordedV2NamesConsistency | None = None
  # If `speaker_reidentification` has been enabled, results of the AI speaker reidentification.
  speaker_reidentification: PreRecordedV2SpeakerReidentification | None = None
  # If `structured_data_extraction` has been enabled, structured data extraction results
  structured_data_extraction: PreRecordedV2StructuredDataExtraction | None = None
  # If `sentiment_analysis` has been enabled, sentiment analysis of the audio speech transcription
  sentiment_analysis: PreRecordedV2SentimentAnalysis | None = None
  # If `audio_to_llm` has been enabled, audio to llm results of the audio speech transcription
  audio_to_llm: PreRecordedV2AudioToLlmList | None = None
  # If `sentences` has been enabled, sentences of the audio speech transcription. Deprecated:
  # content will move to the `transcription` object.
  sentences: PreRecordedV2Sentences | None = None
  # If `display_mode` has been enabled, the output will be reordered, creating new utterances when
  # speakers overlapped
  display_mode: PreRecordedV2DisplayMode | None = None
  # If `chapterization` has been enabled, will generate chapters name for different parts of the
  # given audio.
  chapterization: PreRecordedV2Chapterization | None = None
  # If `diarization` has been requested and an error has occurred, the result will appear here
  diarization: PreRecordedV2Diarization | None = None


# Upload Types
@dataclass(frozen=True, slots=True)
class PreRecordedV2UploadRequest(BaseDataClass):
  """Upload request body"""

  # The URL of the audio or video file to be uploaded.
  audio_url: str | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2AudioUploadResponse(BaseDataClass):
  # Uploaded audio file Gladia URL
  audio_url: str
  # Uploaded audio file detected metadata
  audio_metadata: PreRecordedV2AudioUploadMetadata


# Init Session Types
@dataclass(frozen=True, slots=True)
class PreRecordedV2InitTranscriptionRequest(BaseDataClass):
  # URL to a Gladia file or to an external audio or video file
  audio_url: str
  # **[Beta]** Can be either boolean to enable custom_vocabulary for this audio or an array with
  # specific vocabulary list to feed the transcription model with
  custom_vocabulary: bool | None = None
  # **[Beta]** Custom vocabulary configuration, if `custom_vocabulary` is enabled
  custom_vocabulary_config: PreRecordedV2CustomVocabularyConfig | None = None
  # **[Deprecated]** Use `callback`/`callback_config` instead. Callback URL we will do a `POST`
  # request to with the result of the transcription
  callback_url: str | None = None
  # Enable callback for this transcription. If true, the `callback_config` property will be used
  # to customize the callback behaviour
  callback: bool | None = None
  # Customize the callback behaviour (url and http method)
  callback_config: PreRecordedV2CallbackConfig | None = None
  # Enable subtitles generation for this transcription
  subtitles: bool | None = None
  # Configuration for subtitles generation if `subtitles` is enabled
  subtitles_config: PreRecordedV2SubtitlesConfig | None = None
  # Enable speaker recognition (diarization) for this audio
  diarization: bool | None = None
  # Speaker recognition configuration, if `diarization` is enabled
  diarization_config: PreRecordedV2DiarizationConfig | None = None
  # **[Beta]** Enable translation for this audio
  translation: bool | None = None
  # **[Beta]** Translation configuration, if `translation` is enabled
  translation_config: PreRecordedV2TranslationConfig | None = None
  # **[Beta]** Enable summarization for this audio
  summarization: bool | None = None
  # **[Beta]** Summarization configuration, if `summarization` is enabled
  summarization_config: PreRecordedV2SummarizationConfig | None = None
  # **[Alpha]** Enable named entity recognition for this audio
  named_entity_recognition: bool | None = None
  # **[Alpha]** Enable custom spelling for this audio
  custom_spelling: bool | None = None
  # **[Alpha]** Custom spelling configuration, if `custom_spelling` is enabled
  custom_spelling_config: PreRecordedV2CustomSpellingConfig | None = None
  # Enable sentiment analysis for this audio
  sentiment_analysis: bool | None = None
  # **[Alpha]** Enable audio to llm processing for this audio
  audio_to_llm: bool | None = None
  # **[Alpha]** Audio to llm configuration, if `audio_to_llm` is enabled
  audio_to_llm_config: PreRecordedV2AudioToLlmListConfig | None = None
  # Enable PII redaction for this audio
  pii_redaction: bool | None = None
  # PII redaction configuration, if `pii_redaction` is enabled
  pii_redaction_config: PreRecordedV2PiiRedactionConfig | None = None
  # Custom metadata you can attach to this transcription
  custom_metadata: dict[str, Any] | None = None
  # Enable sentences for this audio
  sentences: bool | None = None
  # **[Alpha]** Use enhanced punctuation for this audio
  punctuation_enhanced: bool | None = None
  # Specify the language configuration
  language_config: PreRecordedV2LanguageConfig | None = None


@dataclass(frozen=True, slots=True)
class PreRecordedV2InitTranscriptionResponse(BaseDataClass):
  # Id of the job
  id: str
  # Prebuilt URL with your transcription `id` to fetch the result
  result_url: str


# Result Types
@dataclass(frozen=True, slots=True)
class PreRecordedV2Response(BaseDataClass):
  # Id of the job
  id: str
  # Debug id
  request_id: str
  # API version
  version: int
  # "queued": the job has been queued. "processing": the job is being processed. "done": the job
  # has been processed and the result is available. "error": an error occurred during the job's
  # processing.
  status: Literal["queued", "processing", "done", "error"]
  # Creation date
  created_at: str
  kind: Literal["pre-recorded"]
  # For debugging purposes, send data that could help to identify issues
  post_session_metadata: dict[str, Any] | None = None
  # Completion date when status is "done" or "error"
  completed_at: str | None = None
  # Custom metadata given in the initial request
  custom_metadata: dict[str, Any] | None = None
  # HTTP status code of the error if status is "error"
  error_code: int | None = None
  # The file data you uploaded. Can be null if status is "error"
  file: PreRecordedV2FileResponse | None = None
  # Parameters used for this pre-recorded transcription. Can be null if status is "error"
  request_params: PreRecordedV2RequestParamsResponse | None = None
  # Pre-recorded transcription's result when status is "done"
  result: PreRecordedV2TranscriptionResult | None = None
