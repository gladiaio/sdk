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
  PreRecordedV2AudioUploadMetadata,
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
    options: PreRecordedV2TranscriptionOptions | dict[str, Any] | None = None,
  ) -> PreRecordedV2Response:
    """Transcribe an audio source: local file or URL (e.g. YouTube, S3).

    Args:
    file: A local file path (str or Path), an open binary file object, or a URL
      (e.g. https://..., YouTube, S3). URLs are passed through to the API without upload.
    options: Optional transcription options (no audio_url; the source is the file/URL).
      Can be a :class:`PreRecordedV2TranscriptionOptions` instance or a dict (e.g.
      ``{"sentiment_analysis": True}``). Defaults to default options if omitted.
    """
    upload_response = self.upload_file(file)
    if isinstance(options, dict):
      body = {**options, "audio_url": upload_response.audio_url}
    else:
      opts = options if options is not None else PreRecordedV2TranscriptionOptions()
      body = {**opts.to_dict(), "audio_url": upload_response.audio_url}
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
    """Upload a local file or use a URL (YouTube, S3, etc.) and return an audio URL for transcription.

    Args:
      file: A file path (str or Path), an open binary file object, or a URL (http/https).
        For URLs, no upload is performed; the URL is passed through to the API.

    Returns:
       The :class:`PreRecordedV2AudioUploadResponse` containing the ``audio_url`` and ``audio_metadata``.
    """
    file_path, file_obj = self._core.validate_file_input(file)

    if file_path and self._core.is_url(file_path):
      return PreRecordedV2AudioUploadResponse(
        audio_url=file_path,
        audio_metadata=PreRecordedV2AudioUploadMetadata(
          id="url",
          filename="audio",
          extension="",
          size=0,
          audio_duration=0.0,
          number_of_channels=0,
        ),
      )

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
