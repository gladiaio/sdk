"""Request types for the transcribe (upload + initiate + poll) flow."""

from __future__ import annotations

import dataclasses
from dataclasses import dataclass
from pathlib import Path
from typing import Any, BinaryIO

from .generated_types import (
  PreRecordedV2AudioToLlmListConfig,
  PreRecordedV2CallbackConfig,
  PreRecordedV2CodeSwitchingConfig,
  PreRecordedV2CustomSpellingConfig,
  PreRecordedV2CustomVocabularyConfig,
  PreRecordedV2DiarizationConfig,
  PreRecordedV2LanguageConfig,
  PreRecordedV2PiiRedactionConfig,
  PreRecordedV2StructuredDataExtractionConfig,
  PreRecordedV2SubtitlesConfig,
  PreRecordedV2SummarizationConfig,
  PreRecordedV2TranslationConfig,
  PreRecordedV2TranscriptionLanguageCode,
)


def _filter_none(val: Any) -> Any:
  if val is None:
    return None
  if isinstance(val, dict):
    return {k: _filter_none(v) for k, v in val.items() if v is not None}
  if isinstance(val, list):
    return [_filter_none(x) for x in val]
  return val


@dataclass
class PreRecordedV2TranscribeOptions:
  """Transcription options for the transcribe flow (no audio_url; it is derived from file)."""

  context_prompt: str | None = None
  custom_vocabulary: bool | None = None
  custom_vocabulary_config: PreRecordedV2CustomVocabularyConfig | None = None
  detect_language: bool | None = None
  enable_code_switching: bool | None = None
  code_switching_config: PreRecordedV2CodeSwitchingConfig | None = None
  language: PreRecordedV2TranscriptionLanguageCode | None = None
  callback_url: str | None = None
  callback: bool | None = None
  callback_config: PreRecordedV2CallbackConfig | None = None
  subtitles: bool | None = None
  subtitles_config: PreRecordedV2SubtitlesConfig | None = None
  diarization: bool | None = None
  diarization_config: PreRecordedV2DiarizationConfig | None = None
  translation: bool | None = None
  translation_config: PreRecordedV2TranslationConfig | None = None
  summarization: bool | None = None
  summarization_config: PreRecordedV2SummarizationConfig | None = None
  moderation: bool | None = None
  named_entity_recognition: bool | None = None
  chapterization: bool | None = None
  name_consistency: bool | None = None
  custom_spelling: bool | None = None
  custom_spelling_config: PreRecordedV2CustomSpellingConfig | None = None
  structured_data_extraction: bool | None = None
  structured_data_extraction_config: PreRecordedV2StructuredDataExtractionConfig | None = None
  sentiment_analysis: bool | None = None
  audio_to_llm: bool | None = None
  audio_to_llm_config: PreRecordedV2AudioToLlmListConfig | None = None
  pii_redaction: bool | None = None
  pii_redaction_config: PreRecordedV2PiiRedactionConfig | None = None
  custom_metadata: dict[str, Any] | None = None
  sentences: bool | None = None
  display_mode: bool | None = None
  punctuation_enhanced: bool | None = None
  language_config: PreRecordedV2LanguageConfig | None = None

  def to_dict(self) -> dict[str, Any]:
    d = dataclasses.asdict(self)
    return _filter_none(d)


@dataclass
class PreRecordedV2TranscribeRequest:
  """End-to-end transcribe request: file + options (audio_url is derived from file)."""

  file: str | Path | BinaryIO
  """Audio source: path, URL, upload id, or binary stream. Local files and streams are uploaded."""
  options: PreRecordedV2TranscribeOptions | None = None
  """Transcription options (language, diarization, etc.). Must not include audio_url."""
  interval: float = 3.0
  """Seconds between polling attempts."""
  timeout: float | None = None
  """Maximum seconds to wait before raising TimeoutError. None = wait indefinitely."""
