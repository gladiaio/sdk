"""Shared core logic for V2 job management (live and pre-recorded)."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any, cast
from urllib.parse import urlencode


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

  def build_list_endpoint(self, params: Mapping[str, Any] | object | None = None) -> str:
    """Build the collection list URL, including optional query filters.

    When ``params`` contains ``url``, that absolute pagination URL is returned
    as-is and other filters are ignored.
    """
    if not params:
      return self._base_path

    data: dict[str, Any]
    to_dict = getattr(params, "to_dict", None)
    if callable(to_dict):
      data = cast(dict[str, Any], to_dict())
    elif isinstance(params, Mapping):
      data = dict(params)
    else:
      raise TypeError(f"Unsupported list params type: {type(params)!r}")

    absolute_url = data.get("url")
    if absolute_url:
      return str(absolute_url)

    pairs: list[tuple[str, str]] = []

    for key in ("offset", "limit", "date", "before_date", "after_date"):
      value = data.get(key)
      if value is None:
        continue
      pairs.append((key, str(value)))

    status = data.get("status")
    if status:
      for item in status:
        pairs.append(("status", str(item)))

    custom_metadata = data.get("custom_metadata")
    if custom_metadata:
      for meta_key, meta_value in custom_metadata.items():
        if meta_value is None:
          continue
        pairs.append((f"custom_metadata[{meta_key}]", str(meta_value)))

    if not pairs:
      return self._base_path

    return f"{self._base_path}?{urlencode(pairs)}"

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
