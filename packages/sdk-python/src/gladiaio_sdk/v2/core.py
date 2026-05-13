"""Shared core logic for V2 job management (live and pre-recorded)."""

from __future__ import annotations

from typing import Any


class V2JobCore:
  """Generic job management helpers parameterized by base path.

  Shared between live (``/v2/live``) and pre-recorded (``/v2/pre-recorded``) clients
  so that endpoint building, status checks, and error messages stay DRY.
  """

  def __init__(self, base_path: str, kind: str) -> None:
    self._base_path = base_path
    self._kind = kind

  def build_job_endpoint(self, job_id: str) -> str:
    return f"{self._base_path}/{job_id}"

  def build_job_file_endpoint(self, job_id: str) -> str:
    return f"{self._base_path}/{job_id}/file"

  def is_job_complete(self, status: str) -> bool:
    return status in ("done", "error")

  def is_job_successful(self, status: str) -> bool:
    return status == "done"

  def is_job_failed(self, status: str) -> bool:
    return status == "error"

  def create_job_error_message(self, job_id: str, error_code: Any) -> str:
    return f"{self._kind} job {job_id} failed with error code: {error_code}"

  def create_timeout_error_message(self, job_id: str, timeout: float) -> str:
    return f"{self._kind} job {job_id} did not complete within {timeout}s"
