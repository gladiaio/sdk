"""Pre-recorded V2 async client implementation."""

from __future__ import annotations

import asyncio
import os
import re
from pathlib import Path
from typing import Any, BinaryIO, final
from urllib.parse import urlparse

from gladiaio_sdk.client_options import GladiaClientOptions
from gladiaio_sdk.network import AsyncHttpClient

from .generated_types import (
  PreRecordedV2InitTranscriptionRequest,
  PreRecordedV2InitTranscriptionResponse,
  #   PreRecordedListParams,
  #   PreRecordedListResponse,
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

  async def transcribe(
    self,
    file: str | Path | BinaryIO,
    options: PreRecordedV2InitTranscriptionRequest,
  ) -> PreRecordedV2Response:
    """Transcribe a local audio file.

    Args:
    file: The audio file to transcribe.
    options: The transcription request parameters.
    """
    audio_url = await self.upload_file(file)
    options = PreRecordedV2InitTranscriptionRequest(**options, audio_url=audio_url)
    return await self.create_and_poll(options)

  async def create(
    self, options: PreRecordedV2InitTranscriptionRequest | dict[str, Any]
  ) -> PreRecordedV2InitTranscriptionResponse:
    """Create a new pre-recorded transcription job.

    Args:
      options: The transcription request parameters including `audio_url`.
        Can be a :class:`PreRecordedV2InitRequest` or a validated payload dict.

    Returns:
      A response containing the job `id` and `result_url` to poll.
    """
    if isinstance(options, dict):
      body = options
    else:
      body = options.to_dict()
    resp = await self._http_client.post("/v2/pre-recorded", json=body)
    return PreRecordedV2InitTranscriptionResponse.from_json(resp.content)

  async def upload_file(self, file: str | Path | BinaryIO) -> str:
    """Upload a local audio/video file and return its Gladia URL.

    Args:
      file: A file path (str or Path) or an open binary file object.

    Returns:
      The ``audio_url`` that can be passed to ``create``.
    """
    if isinstance(file, (str, Path)):
      path = Path(file)
      with open(path, "rb") as f:
        files = {"audio": (path.name, f, "application/octet-stream")}
        resp = await self._http_client.post("/v2/upload", files=files)
    else:
      name = getattr(file, "name", "audio")
      if isinstance(name, str):
        name = os.path.basename(name)
      files = {"audio": (name, file, "application/octet-stream")}
      resp = await self._http_client.post("/v2/upload", files=files)

    data = resp.json()
    return data["audio_url"]

  async def get(self, job_id: str) -> PreRecordedV2Response:
    """Get a pre-recorded transcription job by ID.

    Args:
      job_id: The UUID of the transcription job.

    Returns:
      The full job response including status and result if done.
    """
    resp = await self._http_client.get(f"/v2/pre-recorded/{job_id}")
    return PreRecordedV2Response.from_dict(resp.json())

  async def delete(self, job_id: str) -> None:
    """Delete a pre-recorded transcription job.

    Args:
      job_id: The UUID of the transcription job to delete.
    """
    await self._http_client.delete(f"/v2/pre-recorded/{job_id}")

  async def get_file(self, job_id: str) -> bytes:
    """Download the audio file for a pre-recorded transcription job.

    Args:
      job_id: The UUID of the transcription job.

    Returns:
      The raw audio file bytes.
    """
    resp = await self._http_client.get(f"/v2/pre-recorded/{job_id}/file")
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
      if result.status == "done":
        return result
      if result.status == "error":
        raise Exception(f"Pre-recorded job {job_id} failed with error code: {result.error_code}")
      if timeout is not None and (loop.time() - start) >= timeout:
        raise TimeoutError(f"Pre-recorded job {job_id} did not complete within {timeout}s")
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
      options: The transcription request parameters including `audio_url`.
        Can be a :class:`PreRecordedV2InitRequest` or a validated payload dict.
      interval: Seconds between polling attempts (default: 3.0).
      timeout: Maximum seconds to wait before raising TimeoutError.

    Returns:
      The completed job response.
    """
    init_response = await self.create(options)
    return await self.poll(init_response.id, interval=interval, timeout=timeout)
