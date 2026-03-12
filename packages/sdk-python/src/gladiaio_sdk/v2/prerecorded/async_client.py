"""Pre-recorded V2 async client implementation."""

from __future__ import annotations

import asyncio
import re
from pathlib import Path
from typing import Any, BinaryIO, final
from urllib.parse import urlparse

from gladiaio_sdk.client_options import GladiaClientOptions
from gladiaio_sdk.network import AsyncHttpClient, HttpError

from .core import PreRecordedV2Core, PreRecordedV2TranscriptionOptions
from .generated_types import (
  PreRecordedV2AudioUploadResponse,
  PreRecordedV2InitTranscriptionRequest,
  PreRecordedV2InitTranscriptionResponse,
  PreRecordedV2Response,
)


@final
class PreRecordedV2AsyncClient:
  """Async client for the Gladia Pre-Recorded V2 API.

  Provides methods to create, poll, retrieve, list, and delete
  pre-recorded transcription jobs.
  """

  def __init__(self, options: GladiaClientOptions) -> None:
    base_http_url = urlparse(options.api_url)
    base_http_url = base_http_url._replace(scheme=re.sub(r"^ws", "http", base_http_url.scheme))

    query_params: dict[str, str] = {}
    if options.region:
      query_params["region"] = options.region

    self._http_client = AsyncHttpClient(
      base_url=base_http_url.geturl(),
      headers=options.http_headers,
      query_params=query_params,
      retry=options.http_retry,
      timeout=options.http_timeout,
    )
    self._core = PreRecordedV2Core()

  async def transcribe(
    self,
    audio: str | Path | BinaryIO,
    options: PreRecordedV2TranscriptionOptions | dict[str, Any] | None = None,
    *,
    interval: float = 3.0,
    timeout: float | None = None,
  ) -> PreRecordedV2Response:
    """Transcribe from a local file, URL, or bytes (file-like).

    If ``audio`` is a local file (path or file-like), it is uploaded first; then
    create and poll is called. If ``audio`` is a URL (http/https), create and poll
    is used directly with that URL.

    Args:
      audio: A local file path (str or Path), an open binary file object, or a URL (str).
      options: Optional transcription options (no audio_url). Can be a
        :class:`PreRecordedV2TranscriptionOptions` instance or a dict.
      interval: Seconds between polling attempts.
      timeout: Maximum seconds to wait; None means wait indefinitely.

    Returns:
      The completed job response.
    """
    if isinstance(options, dict):
      base = dict(options)
    else:
      opts = options if options is not None else PreRecordedV2TranscriptionOptions()
      base = opts.to_dict()

    if isinstance(audio, (str, Path)) and self._core.is_url(str(audio)):
      audio_url = str(audio)
    else:
      audio_url = (await self.upload_file(audio)).audio_url

    body = {**base, "audio_url": audio_url}
    return await self.create_and_poll(body, interval=interval, timeout=timeout)

  async def create(
    self, options: PreRecordedV2InitTranscriptionRequest | dict[str, Any]
  ) -> PreRecordedV2InitTranscriptionResponse:
    """Create a new pre-recorded transcription job.

    Args:
      options: The transcription request parameters (or a dict including `audio_url`
        for direct API use). Can be a :class:`PreRecordedV2InitTranscriptionRequest` or a payload dict.

    Returns:
      A response containing the job `id` and `result_url` to poll.

    Raises:
      OptionsValidationError: If options contain invalid parameter names (includes
        which parameter is wrong and a suggested correct name, e.g. "languages" instead of "language").
      HttpError: For other HTTP errors (see :attr:`HttpError.invalid_parameters` for validation errors).
    """
    try:
      body = self._core.prepare_create_body(options)
      resp = await self._http_client.post("/v2/pre-recorded", json=body)
      return PreRecordedV2InitTranscriptionResponse.from_json(resp.content)
    except HttpError as e:
      opt_err = self._core.options_validation_error_from_http_error(e)
      if opt_err is not None:
        raise opt_err from e
      raise

  async def upload_file(self, file: str | Path | BinaryIO) -> PreRecordedV2AudioUploadResponse:
    """Upload a local file and return an audio URL for transcription.

    Args:
      file: A local file path (str or Path) or an open binary file object.
        URLs are not accepted; use :meth:`create` with ``audio_url`` for URL-based transcription.

    Returns:
      The :class:`PreRecordedV2AudioUploadResponse` containing the ``audio_url`` and ``audio_metadata``.

    Raises:
      ValueError: If ``file`` is a URL or otherwise not a valid local file input.
    """
    file_path, file_obj = self._core.validate_file_input(file)

    if file_path and self._core.is_url(file_path):
      raise ValueError(
        "upload_file only accepts a local file (path or file object). "
        "URLs are not supported; use create() with audio_url for URL-based transcription."
      )

    if file_path:
      filename, content_type = self._core.prepare_file_for_upload(file_path)
      with open(file_path, "rb") as f:
        files = {"audio": (filename, f, content_type)}
        resp = await self._http_client.post("/v2/upload", files=files)
    elif file_obj:
      filename, content_type = self._core.prepare_file_object_for_upload(file_obj)
      files = {"audio": (filename, file_obj, content_type)}
      resp = await self._http_client.post("/v2/upload", files=files)
    else:
      raise ValueError("Invalid file input")
    return PreRecordedV2AudioUploadResponse.from_json(resp.content)

  async def get(self, job_id: str) -> PreRecordedV2Response:
    """Get a pre-recorded transcription job by ID.

    Args:
      job_id: The UUID of the transcription job.

    Returns:
      The full job response including status and result if done.
    """
    endpoint = self._core.build_job_endpoint(job_id)
    resp = await self._http_client.get(endpoint)
    return PreRecordedV2Response.from_dict(resp.json())

  async def delete(self, job_id: str) -> bool:
    """Delete a pre-recorded transcription job.

    Args:
      job_id: The UUID of the transcription job to delete.

    Returns:
      True if the job was deleted successfully (HTTP 202), False otherwise.
    """
    endpoint = self._core.build_job_endpoint(job_id)
    resp = await self._http_client.delete(endpoint)
    return resp.status_code == 202

  async def get_file(self, job_id: str) -> bytes:
    """Download the audio file for a pre-recorded transcription job.

    Args:
      job_id: The UUID of the transcription job.

    Returns:
      The raw audio file bytes.
    """
    endpoint = self._core.build_job_file_endpoint(job_id)
    resp = await self._http_client.get(endpoint)
    return resp.content

  async def poll(
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
    loop = asyncio.get_event_loop()
    start = loop.time()
    while True:
      result = await self.get(job_id)
      if self._core.is_job_successful(result.status):
        return result
      if self._core.is_job_failed(result.status):
        error_msg = self._core.create_job_error_message(job_id, result.error_code)
        raise Exception(error_msg)
      if timeout is not None and (loop.time() - start) >= timeout:
        timeout_msg = self._core.create_timeout_error_message(job_id, timeout)
        raise TimeoutError(timeout_msg)
      await asyncio.sleep(interval)

  async def create_and_poll(
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
    init_response = await self.create(options)
    return await self.poll(init_response.id, interval=interval, timeout=timeout)
