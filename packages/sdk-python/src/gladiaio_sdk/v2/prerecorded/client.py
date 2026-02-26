"""Pre-recorded V2 sync client implementation."""

from __future__ import annotations

import re
import time
from dataclasses import replace
from pathlib import Path
from typing import Any, BinaryIO, final
from urllib.parse import urlparse

from gladiaio_sdk.client_options import GladiaClientOptions
from gladiaio_sdk.network import HttpClient

from .core import PreRecordedV2Core
from .generated_types import (
  PreRecordedV2AudioUploadMetadata,
  PreRecordedV2AudioUploadResponse,
  PreRecordedV2InitTranscriptionRequest,
  PreRecordedV2InitTranscriptionResponse,
  PreRecordedV2Response,
)
from .transcribe_request import PreRecordedV2TranscribeRequest, PreRecordedV2TranscribeOptions

@final
class PreRecordedV2Client:
  """Sync client for the Gladia Pre-Recorded V2 API.

  Provides methods to initiate, poll, retrieve, list, and delete
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

  def upload_file(self, file: str | Path | BinaryIO) -> PreRecordedV2AudioUploadResponse:
    """Upload the given audio or video file and return the upload response.

    Args:
      file: The file to be uploaded: an audio or video file. Either a web URL (str),
        a local file path (str or Path), or an open binary file object.

    Returns:
      The PreRecordedV2AudioUploadResponse containing the audio_url and audio_metadata.
    """
    if isinstance(file, str) and self._core.is_web_url(file):
      metadata = PreRecordedV2AudioUploadMetadata(
        id="",
        filename="audio_url",
        extension="",
        size=0,
        audio_duration=0.0,
        number_of_channels=0,
      )
      return PreRecordedV2AudioUploadResponse(audio_url=file, audio_metadata=metadata)

    file_path, file_obj = self._core.validate_file_input(file)

    if file_path:
      filename, content_type = self._core.prepare_file_for_upload(file_path)
      with open(file_path, "rb") as f:
        files = {"audio": (filename, f, content_type)}
        resp = self._http_client.post("/v2/upload", files=files)
    else:
      filename, content_type = self._core.prepare_file_object_for_upload(file_obj)
      if hasattr(file_obj, "seek"):
        file_obj.seek(0)
      files = {"audio": (filename, file_obj, content_type)}
      resp = self._http_client.post("/v2/upload", files=files)

    return PreRecordedV2AudioUploadResponse.from_json(resp.content)

  def initiate(
    self, options: PreRecordedV2InitTranscriptionRequest | dict[str, Any]
  ) -> PreRecordedV2InitTranscriptionResponse:
    """Initiate a new pre-recorded transcription job.

    Args:
      options: The transcription request parameters including `audio_url`.

    Returns:
      A response containing the job `id` and `result_url` to poll.
    """
    body = self._core.prepare_initiate_body(options)
    resp = self._http_client.post("/v2/pre-recorded", json=body)
    return PreRecordedV2InitTranscriptionResponse.from_json(resp.content)

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

  def list_transcriptions(self, limit: int = 20) -> dict[str, Any]:
    """List pre-recorded transcription jobs.

    Args:
      limit: Optional maximum number of jobs to return (default is 20).

    Returns:
      The JSON response as a dict (typically contains a list of jobs).
    """
    endpoint = self._core.build_list_endpoint(limit=limit)
    resp = self._http_client.get(endpoint)
    return resp.json()

  def delete(self, job_id: str) -> None:
    """Delete a pre-recorded transcription job.

    Args:
      job_id: The UUID of the transcription job to delete.
    """
    endpoint = self._core.build_job_endpoint(job_id)
    self._http_client.delete(endpoint)

  def download_audio_file(self, job_id: str) -> bytes:
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

  def initiate_and_poll(
    self,
    options: PreRecordedV2InitTranscriptionRequest | dict[str, Any],
    *,
    interval: float = 3.0,
    timeout: float | None = None,
  ) -> PreRecordedV2Response:
    """Initiate a pre-recorded transcription job and poll until completion.

    Convenience method that combines `initiate` and `poll`.

    Args:
      options: The transcription request parameters including `audio_url`.
        Can be a :class:`PreRecordedV2InitRequest` or a validated payload dict.
      interval: Seconds between polling attempts (default: 3.0).
      timeout: Maximum seconds to wait before raising TimeoutError.

    Returns:
      The completed job response.
    """
    init_response = self.initiate(options)
    return self.poll(init_response.id, interval=interval, timeout=timeout)

  def transcribe(
    self,
    file: str | Path | BinaryIO | PreRecordedV2TranscribeRequest,
    options: PreRecordedV2TranscribeOptions
    | PreRecordedV2InitTranscriptionRequest
    | dict[str, Any]
    | None = None,
    *,
    interval: float = 3.0,
    timeout: float | None = None,
  ) -> PreRecordedV2Response:
    """End-to-end flow: upload file (if needed), initiate a pre-recorded transcription, and poll until completion.
  
    Args:
      file: The audio to transcribe: a file path (str or Path), an open binary file
        object, a web URL (str), or an upload id (str from ``audio_metadata.id``).

      options: Optional transcription parameters (e.g. language, diarization).
        Can be a :class:`PreRecordedV2TranscribeOptions` or a dict.
    
      interval: Seconds between polling attempts (default: 3.0).
      timeout: Maximum seconds to wait before raising TimeoutError. None = wait indefinitely.

    Returns:
      The completed job response.
    """
    if isinstance(file, PreRecordedV2TranscribeRequest):
      req = file
      file = req.file
      options = req.options
      interval = req.interval
      timeout = req.timeout
    if isinstance(file, str) and (
      self._core.is_web_url(file) or self._core.is_upload_id(file)
    ):
      audio_url = file
    else:
      upload_response = self.upload_file(file)
      audio_url = upload_response.audio_url
    body = self._core.prepare_transcribe_init_body(options, audio_url)
    return self.initiate_and_poll(body, interval=interval, timeout=timeout)