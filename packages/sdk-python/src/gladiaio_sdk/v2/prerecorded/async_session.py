"""Pre-recorded V2 async session implementation."""

from __future__ import annotations

import asyncio
from dataclasses import replace
from pathlib import Path
from typing import Any, BinaryIO, final

from gladiaio_sdk.network import AsyncHttpClient

from .core import PreRecordedV2Core
from .generated_types import (
  PreRecordedV2AudioUploadMetadata,
  PreRecordedV2AudioUploadResponse,
  PreRecordedV2InitTranscriptionRequest,
  PreRecordedV2InitTranscriptionResponse,
  PreRecordedV2Response,
)


@final
class PreRecordedV2AsyncSession:
  """Async session for the Gladia Pre-Recorded V2 API.

  Provides methods to initiate, poll, retrieve, list, and delete
  pre-recorded transcription jobs.
  """

  def __init__(self, *, http_client: AsyncHttpClient) -> None:
    self._http_client = http_client
    self._core = PreRecordedV2Core()

  async def transcribe(
    self,
    file: str | Path | BinaryIO,
    options: PreRecordedV2InitTranscriptionRequest,
  ) -> PreRecordedV2Response:
    """Transcribe an audio source: upload id, local file, or web URL.

    Accepts either an existing upload id (from :attr:`PreRecordedV2AudioUploadResponse.audio_metadata.id`)
    or a local file / web URL; in the latter case the file is uploaded first, then transcribed.

    Args:
      file: The audio to transcribe: an upload id (str from ``audio_metadata.id``), a file path
        (str or Path), an open binary file object, or an http(s) URL (e.g. YouTube, S3).
        When an id is passed, no upload is performed. Local files and URLs are uploaded first.
      options: The transcription request parameters.
    """
    if isinstance(file, str) and self._core.is_upload_id(file):
      audio_url = file
    else:
      upload_response = await self.upload_file(file)
      audio_url = upload_response.audio_url
    opts = replace(options, audio_url=audio_url)
    return await self.initiate_and_poll(opts)

  async def initiate(
    self, options: PreRecordedV2InitTranscriptionRequest | dict[str, Any]
  ) -> PreRecordedV2InitTranscriptionResponse:
    """Initiate a new pre-recorded transcription job.

    Args:
      options: The transcription request parameters including `audio_url`.
        Can be a :class:`PreRecordedV2InitRequest` or a validated payload dict.

    Returns:
      A response containing the job `id` and `result_url` to poll.
    """
    body = self._core.prepare_initiate_body(options)
    resp = await self._http_client.post("/v2/pre-recorded", json=body)
    return PreRecordedV2InitTranscriptionResponse.from_json(resp.content)

  async def upload_file(self, file: str | Path | BinaryIO) -> PreRecordedV2AudioUploadResponse:
    """Upload the given audio or video file and return the upload response.

    Sends a POST to ``/v2/upload`` with multipart form field ``audio`` (and
    ``x-gladia-key`` in headers), matching the Gladia upload API.

    The file to be uploaded can be either a web URL (e.g. YouTube, S3) or a local file
    path or binary file object. Local files are uploaded via POST /v2/upload; URLs
    are returned as-is (no upload).

    Args:
      file: The file to be uploaded: an audio or video file. Either a web URL (str),
        a local file path (str or Path), or an open binary file object.

    Returns:
      The :class:`PreRecordedV2AudioUploadResponse` containing the ``audio_url`` and ``audio_metadata``.
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
        resp = await self._http_client.post("/v2/upload", files=files)
    else:
      filename, content_type = self._core.prepare_file_object_for_upload(file_obj)
      if hasattr(file_obj, "seek"):
        file_obj.seek(0)
      files = {"audio": (filename, file_obj, content_type)}
      resp = await self._http_client.post("/v2/upload", files=files)

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

  async def list_transcriptions(self, limit: int = 20) -> dict[str, Any]:
    """List pre-recorded transcription jobs.

    Args:
      limit: Optional maximum number of jobs to return (default is 20).

    Returns:
      The JSON response as a dict (typically contains a list of jobs).
    """
    endpoint = self._core.build_list_endpoint(limit=limit)
    resp = await self._http_client.get(endpoint)
    return resp.json()

  async def delete(self, job_id: str) -> None:
    """Delete a pre-recorded transcription job.

    Args:
      job_id: The UUID of the transcription job to delete.
    """
    endpoint = self._core.build_job_endpoint(job_id)
    await self._http_client.delete(endpoint)

  async def download_audio_file(self, job_id: str) -> bytes:
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

  async def initiate_and_poll(
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
    init_response = await self.initiate(options)
    return await self.poll(init_response.id, interval=interval, timeout=timeout)
