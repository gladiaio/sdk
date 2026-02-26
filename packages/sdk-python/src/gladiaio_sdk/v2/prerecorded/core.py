"""Shared core logic for Pre-recorded V2 clients."""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any, BinaryIO, Protocol
from urllib.parse import urlencode, urlparse

# Pattern for upload id (e.g. from audio_metadata.id): UUID with optional hyphens
_UPLOAD_ID_PATTERN = re.compile(
  r"^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$"
)


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
  def is_web_url(path: str) -> bool:
    """Return True if path looks like an http(s) URL (e.g. YouTube or any web audio URL)."""
    try:
      parsed = urlparse(path)
      return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
      return False

  @staticmethod
  def is_upload_id(value: str) -> bool:
    """Return True if value looks like an upload id (e.g. from audio_metadata.id)."""
    return bool(value and _UPLOAD_ID_PATTERN.match(value.strip()))

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
  def prepare_initiate_body(
    options: Any,  # PreRecordedV2InitTranscriptionRequest | dict[str, Any]
  ) -> dict[str, Any]:
    """Prepare the request body for initiating a transcription.

    Args:
      options: The transcription request parameters.

    Returns:
      Dictionary ready for JSON serialization.
    """
    if isinstance(options, dict):
      return options
    return options.to_dict()

  @staticmethod
  def prepare_transcribe_init_body(
    options: Any,  # PreRecordedV2TranscribeOptions | PreRecordedV2InitTranscriptionRequest | dict[str, Any] | None
    audio_url: str,
  ) -> dict[str, Any]:
    """Build the init request body for transcribe(file, options).

    The API expects audio_url; when the user passes a file we resolve audio_url
    (upload or web URL) and merge it with optional init options. Options may
    omit audio_url (e.g. dict with only language, diarization). The generated
    PreRecordedV2InitTranscriptionRequest requires audio_url, so when using that
    type we overwrite it; when using a dict, audio_url need not be present.

    Args:
      options: Optional transcription parameters (dict, dataclass, or None).
        None is allowed; audio_url in options is always overridden by audio_url.
      audio_url: The resolved audio URL (from upload or from file when URL/id).

    Returns:
      Dictionary ready for JSON serialization (suitable for initiate).
    """
    if options is None:
      return {"audio_url": audio_url}
    if isinstance(options, dict):
      return {**options, "audio_url": audio_url}
    # PreRecordedV2TranscribeOptions: no audio_url field, convert to dict and add it
    if hasattr(options, "to_dict") and not hasattr(options, "audio_url"):
      return {**options.to_dict(), "audio_url": audio_url}
    # PreRecordedV2InitTranscriptionRequest: overwrite audio_url via replace
    from dataclasses import replace
    return PreRecordedV2Core.prepare_initiate_body(replace(options, audio_url=audio_url))

  @staticmethod
  def build_list_endpoint(limit: int | None = None) -> str:
    """Build the endpoint path for listing pre-recorded jobs.

    Args:
      limit: Optional maximum number of jobs to return.

    Returns:
      The endpoint path, with query string if limit is set.
    """
    path = "/v2/pre-recorded"
    if limit is not None:
      path = f"{path}?{urlencode({'limit': limit})}"
    return path

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
