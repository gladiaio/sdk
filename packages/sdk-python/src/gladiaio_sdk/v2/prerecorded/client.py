"""Pre-recorded V2 sync client implementation."""

from __future__ import annotations

import re
import time
from pathlib import Path
from typing import Any, BinaryIO, final
from urllib.parse import urlparse

from gladiaio_sdk.client_options import GladiaClientOptions
from gladiaio_sdk.network import HttpClient

from .core import PreRecordedV2Core, PreRecordedV2TranscriptionOptions
from .generated_types import (
  PreRecordedV2AudioUploadResponse,
  PreRecordedV2InitTranscriptionRequest,
  PreRecordedV2InitTranscriptionResponse,
  PreRecordedV2Response,
)


@final
class PreRecordedV2Client:
  """Sync client for the Gladia Pre-Recorded V2 API.

  Provides methods to create, poll, retrieve, list, and delete
  pre-recorded transcription jobs.
  """

  def __init__(self, options: GladiaClientOptions) -> None:
    base_http_url = urlparse(options.api_url)
    base_http_url = base_http_url._replace(scheme=re.sub(r"^ws", "http", base_http_url.scheme))

    query_params: dict[str, str] = {}
    if options.region:
      query_params["region"] = options.region

    self._http_client = HttpClient(
      base_url=base_http_url.geturl(),
      headers=options.http_headers,
      query_params=query_params,
      retry=options.http_retry,
      timeout=options.http_timeout,
    )
    self._core = PreRecordedV2Core()

  def transcribe(
    self,
    file: str | Path | BinaryIO,
    options: PreRecordedV2TranscriptionOptions,
  ) -> PreRecordedV2Response:
    """Transcribe a local audio file.

    Args:
    file: The audio file to transcribe.
    options: The transcription options (no audio_url; the file is the audio source).
    """
    upload_response = self.upload_file(file)
    body = {**options.to_dict(), "audio_url": upload_response.audio_url}
    return self.create_and_poll(body)

  def create(
    self, options: PreRecordedV2InitTranscriptionRequest | dict[str, Any]
  ) -> PreRecordedV2InitTranscriptionResponse:
    """Create a new pre-recorded transcription job.

    Args:
      options: The transcription request parameters (or a dict including `audio_url`
        for direct API use). Can be a :class:`PreRecordedV2InitTranscriptionRequest` or a payload dict.

    Returns:
      A response containing the job `id` and `result_url` to poll.
    """
    body = self._core.prepare_create_body(options)
    resp = self._http_client.post("/v2/pre-recorded", json=body)
    return PreRecordedV2InitTranscriptionResponse.from_json(resp.content)

  def upload_file(self, file: str | Path | BinaryIO) -> PreRecordedV2AudioUploadResponse:
    """Upload a local audio/video file and return its Gladia URL.

    Args:
      file: A file path (str or Path) or an open binary file object.

    Returns:
       The :class:`PreRecordedV2AudioUploadResponse` containing the ``audio_url`` and ``audio_metadata``.
    """
    file_path, file_obj = self._core.validate_file_input(file)

    if file_path:
      filename, content_type = self._core.prepare_file_for_upload(file_path)
      with open(file_path, "rb") as f:
        files = {"audio": (filename, f, content_type)}
        resp = self._http_client.post("/v2/upload", files=files)
    elif file_obj:
      filename, content_type = self._core.prepare_file_object_for_upload(file_obj)
      files = {"audio": (filename, file_obj, content_type)}
      resp = self._http_client.post("/v2/upload", files=files)
    else:
      raise ValueError("Invalid file input")
    return PreRecordedV2AudioUploadResponse.from_json(resp.content)

  def get(self, job_id: str) -> PreRecordedV2Response:
    """Get a pre-recorded transcription job by ID.

    Args:
      job_id: The UUID of the transcription job.

    Returns:
      The full job response including status and result if done.
    """
    endpoint = self._core.build_job_endpoint(job_id)
    resp = self._http_client.get(endpoint)
    return PreRecordedV2Response.from_dict(resp.json())

  def delete(self, job_id: str) -> None:
    """Delete a pre-recorded transcription job.

    Args:
      job_id: The UUID of the transcription job to delete.
    """
    endpoint = self._core.build_job_endpoint(job_id)
    self._http_client.delete(endpoint)

  def get_file(self, job_id: str) -> bytes:
    """Download the audio file for a pre-recorded transcription job.

    Args:
      job_id: The UUID of the transcription job.

    Returns:
      The raw audio file bytes.
    """
    endpoint = self._core.build_job_file_endpoint(job_id)
    resp = self._http_client.get(endpoint)
    return resp.content

  def poll(
    self,
    job_id: str,
    *,
    interval: float = 3.0,
    timeout: float | None = None,
  ) -> PreRecordedV2Response:
    """Poll a pre-recorded transcription job until it completes.

    Repeatedly fetches the job status until it reaches "done" or "error".

    Args:
      job_id: The UUID of the transcription job.
      interval: Seconds between polling attempts (default: 3.0).
      timeout: Maximum seconds to wait before raising TimeoutError.
        None means wait indefinitely.

    Returns:
      The completed job response.

    Raises:
      TimeoutError: If the job does not complete within the timeout.
      Exception: If the job status is "error".
    """
    start = time.time()
    while True:
      result = self.get(job_id)
      if self._core.is_job_successful(result.status):
        return result
      if self._core.is_job_failed(result.status):
        error_msg = self._core.create_job_error_message(job_id, result.error_code)
        raise Exception(error_msg)
      if timeout is not None and (time.time() - start) >= timeout:
        timeout_msg = self._core.create_timeout_error_message(job_id, timeout)
        raise TimeoutError(timeout_msg)
      time.sleep(interval)

  def create_and_poll(
    self,
    options: PreRecordedV2InitTranscriptionRequest | dict[str, Any],
    *,
    interval: float = 3.0,
    timeout: float | None = None,
  ) -> PreRecordedV2Response:
    """Create a pre-recorded transcription job and poll until completion.

    Convenience method that combines `create` and `poll`.

    Args:
      options: The transcription request parameters (or a dict including `audio_url`
        for direct API use). Can be a :class:`PreRecordedV2InitTranscriptionRequest` or a payload dict.
      interval: Seconds between polling attempts (default: 3.0).
      timeout: Maximum seconds to wait before raising TimeoutError.

    Returns:
      The completed job response.
    """
    init_response = self.create(options)
    return self.poll(init_response.id, interval=interval, timeout=timeout)
