"""Live V2 job management (e2e) tests — get, get_file, delete.

Each test starts a live session, streams a short audio clip, waits for
the session to end, then exercises the HTTP job-management method.
"""

import asyncio
import time

import pytest
from gladiaio_sdk import GladiaClient, HttpError
from gladiaio_sdk.v2.live.generated_types import (
  LiveV2InitRequest,
  LiveV2LanguageConfig,
)

from tests.helpers import parse_audio_file, send_audio_file_async

AUDIO_FILE = "short_split_infinity_16k.wav"


async def _run_live_session() -> str:
  """Run a full live session and return the job ID once the session has ended."""
  audio_data = parse_audio_file(AUDIO_FILE)
  ended_event = asyncio.Event()

  live_session = (
    GladiaClient()
    .live_v2_async()
    .start_session(
      LiveV2InitRequest(
        **audio_data["audio_config"],
        language_config=LiveV2LanguageConfig(languages=["en"]),
      )
    )
  )

  @live_session.once("error")
  def handle_error(error: Exception):  # pyright: ignore[reportUnusedFunction]
    print(f"Live session error: {error}")

  @live_session.once("ended")
  def handle_ended(ended):  # pyright: ignore[reportUnusedFunction]
    ended_event.set()

  await send_audio_file_async(audio_data, live_session)
  live_session.stop_recording()
  await ended_event.wait()

  job_id = await live_session.get_session_id()
  assert job_id, "expected a session id after the session ended"
  return job_id


async def _wait_for_terminal_job_status(
  client,
  job_id: str,
  *,
  interval_s: float = 1.0,
  timeout_s: float = 60.0,
):
  """Poll until the live job reaches a terminal status (done or error).

  The API only allows deletion once post-processing has finished.
  """
  deadline = time.monotonic() + timeout_s
  while time.monotonic() < deadline:
    result = await client.get(job_id)
    if result.status in ("done", "error"):
      return result
    await asyncio.sleep(interval_s)
  raise TimeoutError(f"Timed out waiting for job {job_id} to reach terminal status")


@pytest.mark.asyncio
async def test_get():
  """get returns live job metadata after session ends."""
  job_id = await _run_live_session()
  client = GladiaClient().live_v2_async()
  result = await client.get(job_id)
  assert result.id == job_id
  assert result.status in ("done", "processing")
  assert result.kind == "live"


@pytest.mark.asyncio
async def test_get_file():
  """get_file returns audio bytes with RIFF header."""
  job_id = await _run_live_session()
  client = GladiaClient().live_v2_async()
  file_bytes = await client.get_file(job_id)
  assert isinstance(file_bytes, bytes)
  assert len(file_bytes) > 0
  assert file_bytes[:4] == b"RIFF"


@pytest.mark.asyncio
async def test_delete():
  """delete returns True when job is correctly removed (HTTP 202)."""
  job_id = await _run_live_session()
  client = GladiaClient().live_v2_async()
  await _wait_for_terminal_job_status(client, job_id)
  deleted = await client.delete(job_id)
  assert deleted is True


@pytest.mark.asyncio
async def test_delete_nonexistent():
  """delete raises HttpError (404) when job does not exist."""
  client = GladiaClient().live_v2_async()
  nonexistent_id = "00000000-0000-0000-0000-000000000000"
  with pytest.raises(HttpError) as exc_info:
    await client.delete(nonexistent_id)
  assert exc_info.value.status == 404
