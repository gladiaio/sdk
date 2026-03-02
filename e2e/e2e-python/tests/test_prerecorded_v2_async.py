"""Pre-recorded V2 Async (e2e) tests — one test per client method."""

import os
import re
import string

import pytest
from gladiaio_sdk import (
  GladiaClient,
  PreRecordedV2InitTranscriptionRequest,
  PreRecordedV2LanguageConfig,
)


class _TranscribeOptions(PreRecordedV2InitTranscriptionRequest):
  """Options for transcribe() that omit audio_url from to_dict() so the client can set it from the upload."""

  def to_dict(self, encode_json: bool = True):
    d = super().to_dict(encode_json=encode_json)
    d.pop("audio_url", None)
    return d


def _data_path(filename: str) -> str:
  return os.path.join(os.path.dirname(__file__), "../../../data", filename)


@pytest.mark.asyncio
async def test_upload_file():
  """Test async pre-recorded upload_file returns audio_url and metadata."""
  audio_path = _data_path("short_split_infinity_16k.wav")
  client = GladiaClient().pre_recorded_v2_async()
  upload = await client.upload_file(audio_path)
  assert upload.audio_url
  assert upload.audio_metadata.audio_duration >= 0


@pytest.mark.asyncio
async def test_initiate():
  """Test async pre-recorded initiate returns job id and result_url."""
  audio_path = _data_path("short_split_infinity_16k.wav")
  client = GladiaClient().pre_recorded_v2_async()
  upload = await client.upload_file(audio_path)
  options = PreRecordedV2InitTranscriptionRequest(
    audio_url=upload.audio_url,
    language_config=PreRecordedV2LanguageConfig(languages=["en"]),
  )
  init_resp = await client.initiate(options)
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
  init_resp = await client.initiate(options)
  result = await client.poll(init_resp.id, interval=2.0, timeout=120.0)
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
  init_resp = await client.initiate(options)
  await client.poll(init_resp.id, interval=2.0, timeout=120.0)
  get_result = await client.get(init_resp.id)
  assert get_result.status == "done"
  assert get_result.result is not None


@pytest.mark.asyncio
async def test_delete():
  """Test async pre-recorded delete completes without raising.

  The API only allows deletion when the job is in SUCCESS or ERROR;
  delete immediately after initiate (QUEUED) returns 403.
  """
  audio_path = _data_path("short_split_infinity_16k.wav")
  client = GladiaClient().pre_recorded_v2_async()
  upload = await client.upload_file(audio_path)
  options = PreRecordedV2InitTranscriptionRequest(
    audio_url=upload.audio_url,
    language_config=PreRecordedV2LanguageConfig(languages=["en"]),
  )
  init_resp = await client.initiate(options)
  await client.poll(init_resp.id, interval=2.0, timeout=120.0)
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
  init_resp = await client.initiate(options)
  result = await client.poll(init_resp.id, interval=2.0, timeout=120.0)
  assert result.status == "done"
  file_bytes = await client.get_file(result.id)
  assert isinstance(file_bytes, bytes)
  assert len(file_bytes) > 0
  assert file_bytes[:4] == b"RIFF"


@pytest.mark.asyncio
async def test_transcribe():
  """Test async pre-recorded transcribe (upload + initiate + poll) returns done with transcript."""
  audio_path = _data_path("short_split_infinity_16k.wav")
  client = GladiaClient().pre_recorded_v2_async()
  options = _TranscribeOptions(
    audio_url="",  # omitted from to_dict(); client sets from upload
    language_config=PreRecordedV2LanguageConfig(languages=["en"]),
  )
  result = await client.transcribe(file=audio_path, options=options)
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
async def test_initiate_and_poll():
  """Test async pre-recorded initiate_and_poll returns done result."""
  audio_path = _data_path("short_split_infinity_16k.wav")
  client = GladiaClient().pre_recorded_v2_async()
  upload = await client.upload_file(audio_path)
  options = PreRecordedV2InitTranscriptionRequest(
    audio_url=upload.audio_url,
    language_config=PreRecordedV2LanguageConfig(languages=["en"]),
  )
  result = await client.initiate_and_poll(options, interval=2.0, timeout=120.0)
  assert result.status == "done"
  assert result.result is not None
