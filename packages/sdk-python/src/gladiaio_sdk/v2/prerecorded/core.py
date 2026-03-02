"""Shared core logic for Pre-recorded V2 clients."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, BinaryIO, Protocol


@dataclass(frozen=True)
class PreRecordedV2DeleteResponse:
  """Response returned when a pre-recorded job is successfully deleted."""

  deleted: bool
  """Whether the job was deleted (True on success)."""
  message: str
  """Human-readable confirmation message."""
  job_id: str
  """The ID of the deleted job."""


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
