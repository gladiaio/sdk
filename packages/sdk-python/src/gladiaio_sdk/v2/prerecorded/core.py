"""Shared core logic for Pre-recorded V2 clients."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, BinaryIO, Protocol
from urllib.parse import urlparse

from .generated_types import (
  BaseDataClass,
  PreRecordedV2AudioToLlmListConfig,
  PreRecordedV2CallbackConfig,
  PreRecordedV2CustomSpellingConfig,
  PreRecordedV2CustomVocabularyConfig,
  PreRecordedV2DiarizationConfig,
  PreRecordedV2LanguageConfig,
  PreRecordedV2PiiRedactionConfig,
  PreRecordedV2SubtitlesConfig,
  PreRecordedV2SummarizationConfig,
  PreRecordedV2TranslationConfig,
)


@dataclass(frozen=True, slots=True)
class PreRecordedV2TranscriptionOptions(BaseDataClass):
  """Transcription options for :meth:`PreRecordedV2Client.transcribe` and :meth:`PreRecordedV2AsyncClient.transcribe`.

  Same as :class:`PreRecordedV2InitTranscriptionRequest` but without ``audio_url``; the audio is
  provided via the ``file`` argument to ``transcribe()``.
  """

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


class HttpClientProtocol(Protocol):
  """Protocol for both sync and async HTTP clients."""

  def post(self, url: str, **kwargs: Any) -> Any: ...
  def get(self, url: str, **kwargs: Any) -> Any: ...
  def delete(self, url: str, **kwargs: Any) -> Any: ...


class PreRecordedV2Core:
  """Core business logic shared between sync and async pre-recorded clients.

  This class contains all the pure business logic without any I/O operations.
  """

  @staticmethod
  def is_url(path: str) -> bool:
    """Return True if path looks like an absolute URL (e.g. http, https)."""
    try:
      parsed = urlparse(path)
      return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
      return False

  @staticmethod
  def validate_file_input(file: str | Path | BinaryIO) -> tuple[str | None, BinaryIO | None]:
    """Validate and prepare file input for upload.

    Returns:
      Tuple of (file_path, file_object) where one will be None.
    """
    if isinstance(file, (str, Path)):
      return (str(file), None)
    return (None, file)

  @staticmethod
  def prepare_file_for_upload(file_path: str) -> tuple[str, str]:
    """Prepare file metadata for upload.

    Returns:
      Tuple of (filename, content_type)
    """
    path = Path(file_path)
    return (path.name, "application/octet-stream")

  @staticmethod
  def prepare_file_object_for_upload(file_obj: BinaryIO) -> tuple[str, str]:
    """Prepare file object metadata for upload.

    Returns:
      Tuple of (filename, content_type)
    """
    name = getattr(file_obj, "name", "audio")
    if isinstance(name, str):
      name = os.path.basename(name)
    return (name, "application/octet-stream")

  @staticmethod
  def extract_audio_url_from_upload_response(response_data: dict[str, Any]) -> str:
    """Extract audio_url from upload API response.

    Args:
      response_data: The parsed JSON response from upload endpoint.

    Returns:
      The audio_url string.
    """
    return response_data["audio_url"]

  @staticmethod
  def prepare_create_body(
    options: Any,  # PreRecordedV2InitTranscriptionRequest | dict[str, Any]
  ) -> dict[str, Any]:
    """Prepare the request body for creating a transcription.

    Args:
      options: The transcription request parameters.

    Returns:
      Dictionary ready for JSON serialization.
    """
    if isinstance(options, dict):
      return options
    return options.to_dict()

  @staticmethod
  def build_job_endpoint(job_id: str) -> str:
    """Build the endpoint URL for a specific job.

    Args:
      job_id: The UUID of the transcription job.

    Returns:
      The endpoint path.
    """
    return f"/v2/pre-recorded/{job_id}"

  @staticmethod
  def build_job_file_endpoint(job_id: str) -> str:
    """Build the endpoint URL for downloading job audio file.

    Args:
      job_id: The UUID of the transcription job.

    Returns:
      The endpoint path.
    """
    return f"/v2/pre-recorded/{job_id}/file"

  @staticmethod
  def is_job_complete(status: str) -> bool:
    """Check if a job has completed (successfully or with error).

    Args:
      status: The job status string.

    Returns:
      True if job is in terminal state.
    """
    return status in ("done", "error")

  @staticmethod
  def is_job_successful(status: str) -> bool:
    """Check if a job completed successfully.

    Args:
      status: The job status string.

    Returns:
      True if job is done.
    """
    return status == "done"

  @staticmethod
  def is_job_failed(status: str) -> bool:
    """Check if a job failed.

    Args:
      status: The job status string.

    Returns:
      True if job errored.
    """
    return status == "error"

  @staticmethod
  def create_job_error_message(job_id: str, error_code: Any) -> str:
    """Create an error message for a failed job.

    Args:
      job_id: The UUID of the transcription job.
      error_code: The error code from the job response.

    Returns:
      Formatted error message.
    """
    return f"Pre-recorded job {job_id} failed with error code: {error_code}"

  @staticmethod
  def create_timeout_error_message(job_id: str, timeout: float) -> str:
    """Create an error message for a timeout.

    Args:
      job_id: The UUID of the transcription job.
      timeout: The timeout duration in seconds.

    Returns:
      Formatted timeout message.
    """
    return f"Pre-recorded job {job_id} did not complete within {timeout}s"
