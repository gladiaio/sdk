"""Pre-recorded V2 Async (e2e) tests — one test per client method."""

import os
import re
import string

import pytest
from gladiaio_sdk import (
  GladiaClient,
  PreRecordedV2InitTranscriptionRequest,
  PreRecordedV2LanguageConfig,
  PreRecordedV2TranscriptionOptions,
)


def _data_path(filename: str) -> str:
  return os.path.join(os.path.dirname(__file__), "../../../data", filename)


YOUTUBE_VIDEO_URL = "https://www.youtube.com/watch?v=DYyY8Nh3TQE"
POLL_TIMEOUT_S = 180.0
YOUTUBE_POLL_TIMEOUT_S = 600.0


@pytest.mark.asyncio
async def test_upload_file():
  """Test async pre-recorded upload_file returns audio_url and metadata."""
  audio_path = _data_path("short_split_infinity_16k.wav")
  client = GladiaClient().pre_recorded_v2_async()
  upload = await client.upload_file(audio_path)
  assert upload.audio_url
  assert upload.audio_metadata.audio_duration >= 0


@pytest.mark.asyncio
async def test_upload_file_youtube_url_raises():
  """Test async pre-recorded upload_file with URL raises (expected file path)."""
  client = GladiaClient().pre_recorded_v2_async()
  with pytest.raises(ValueError) as exc_info:
    await client.upload_file(YOUTUBE_VIDEO_URL)
  assert "local file" in str(exc_info.value) or "URL" in str(exc_info.value)


@pytest.mark.asyncio
async def test_create():
  """Test async pre-recorded create returns job id and result_url."""
  audio_path = _data_path("short_split_infinity_16k.wav")
  client = GladiaClient().pre_recorded_v2_async()
  upload = await client.upload_file(audio_path)
  options = PreRecordedV2InitTranscriptionRequest(
    audio_url=upload.audio_url,
    language_config=PreRecordedV2LanguageConfig(languages=["en"]),
  )
  init_resp = await client.create(options)
  assert init_resp.id
  assert init_resp.result_url


@pytest.mark.asyncio
async def test_poll():
  """Test async pre-recorded poll returns done result."""
  audio_path = _data_path("short_split_infinity_16k.wav")
  client = GladiaClient().pre_recorded_v2_async()
  upload = await client.upload_file(audio_path)
  options = PreRecordedV2InitTranscriptionRequest(
    audio_url=upload.audio_url,
    language_config=PreRecordedV2LanguageConfig(languages=["en"]),
  )
  init_resp = await client.create(options)
  result = await client.poll(init_resp.id, interval=2.0, timeout=POLL_TIMEOUT_S)
  assert result.status == "done"
  assert result.id == init_resp.id


@pytest.mark.asyncio
async def test_get():
  """Test async pre-recorded get returns job by id."""
  audio_path = _data_path("short_split_infinity_16k.wav")
  client = GladiaClient().pre_recorded_v2_async()
  upload = await client.upload_file(audio_path)
  options = PreRecordedV2InitTranscriptionRequest(
    audio_url=upload.audio_url,
    language_config=PreRecordedV2LanguageConfig(languages=["en"]),
  )
  init_resp = await client.create(options)
  await client.poll(init_resp.id, interval=2.0, timeout=POLL_TIMEOUT_S)
  get_result = await client.get(init_resp.id)
  assert get_result.status == "done"
  assert get_result.result is not None


@pytest.mark.asyncio
async def test_delete():
  """Test async pre-recorded delete completes without raising.

  The API only allows deletion when the job is in SUCCESS or ERROR;
  delete immediately after create (QUEUED) returns 403.
  """
  audio_path = _data_path("short_split_infinity_16k.wav")
  client = GladiaClient().pre_recorded_v2_async()
  upload = await client.upload_file(audio_path)
  options = PreRecordedV2InitTranscriptionRequest(
    audio_url=upload.audio_url,
    language_config=PreRecordedV2LanguageConfig(languages=["en"]),
  )
  init_resp = await client.create(options)
  await client.poll(init_resp.id, interval=2.0, timeout=POLL_TIMEOUT_S)
  await client.delete(init_resp.id)


@pytest.mark.asyncio
async def test_get_file():
  """Test async pre-recorded get_file returns audio bytes."""
  audio_path = _data_path("short_split_infinity_16k.wav")
  client = GladiaClient().pre_recorded_v2_async()
  upload = await client.upload_file(audio_path)
  options = PreRecordedV2InitTranscriptionRequest(
    audio_url=upload.audio_url,
    language_config=PreRecordedV2LanguageConfig(languages=["en"]),
  )
  init_resp = await client.create(options)
  result = await client.poll(init_resp.id, interval=2.0, timeout=POLL_TIMEOUT_S)
  assert result.status == "done"
  file_bytes = await client.get_file(result.id)
  assert isinstance(file_bytes, bytes)
  assert len(file_bytes) > 0
  assert file_bytes[:4] == b"RIFF"


@pytest.mark.asyncio
async def test_transcribe_local_file():
  """Test async pre-recorded transcribe with local file (upload + create + poll) returns done with transcript."""
  audio_path = _data_path("short_split_infinity_16k.wav")
  client = GladiaClient().pre_recorded_v2_async()
  options = PreRecordedV2TranscriptionOptions(
    language_config=PreRecordedV2LanguageConfig(languages=["en"]),
  )
  result = await client.transcribe(audio=audio_path, options=options, timeout=POLL_TIMEOUT_S)
  assert result.status == "done"
  assert result.result is not None
  assert result.result.transcription is not None
  full = result.result.transcription.full_transcript
  assert re.match(
    rf"^\s*split infinity[{re.escape(string.punctuation)}]*\s*$",
    full.strip(),
    re.IGNORECASE,
  )


@pytest.mark.asyncio
async def test_transcribe_with_options_dict():
  """Test async pre-recorded transcribe with options as dict (e.g. sentiment_analysis) returns done."""
  audio_path = _data_path("short_split_infinity_16k.wav")
  client = GladiaClient().pre_recorded_v2_async()
  options = {
    "language_config": {"languages": ["en"]},
    "sentiment_analysis": True,
  }
  result = await client.transcribe(audio=audio_path, options=options)
  assert result.status == "done"
  assert result.result is not None
  assert result.result.transcription is not None


@pytest.mark.asyncio
async def test_transcribe_url():
  """Test async pre-recorded transcribe with URL (direct create + poll, no upload) returns done."""
  client = GladiaClient().pre_recorded_v2_async()
  options = PreRecordedV2TranscriptionOptions(
    language_config=PreRecordedV2LanguageConfig(languages=["en"]),
  )
  result = await client.transcribe(
    audio=YOUTUBE_VIDEO_URL,
    options=options,
    timeout=YOUTUBE_POLL_TIMEOUT_S,
  )
  assert result.status == "done"
  assert result.result is not None
  assert result.result.transcription is not None
  full = (result.result.transcription.full_transcript or "").strip()
  assert len(full) > 0, "expected non-empty full_transcript"


@pytest.mark.asyncio
async def test_create_and_poll():
  """Test async pre-recorded create_and_poll returns done result."""
  audio_path = _data_path("short_split_infinity_16k.wav")
  client = GladiaClient().pre_recorded_v2_async()
  upload = await client.upload_file(audio_path)
  options = PreRecordedV2InitTranscriptionRequest(
    audio_url=upload.audio_url,
    language_config=PreRecordedV2LanguageConfig(languages=["en"]),
  )
  result = await client.create_and_poll(options, interval=2.0, timeout=POLL_TIMEOUT_S)
  assert result.status == "done"
  assert result.result is not None
