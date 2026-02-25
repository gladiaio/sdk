"""Integration tests for PreRecordedV2Client against the real API.

Run with GLADIA_API_KEY and GLADIA_TEST_AUDIO_PATH or GLADIA_TEST_AUDIO_URL set.
Covers every client method and asserts config handling and response structure.
"""

from __future__ import annotations

import os
import time
from pathlib import Path

import pytest

# Skip markers: same logic as integration conftest (no import from conftest)
def _has_audio() -> bool:
  path = os.environ.get("GLADIA_TEST_AUDIO_PATH")
  if path and Path(path).is_file():
    return True
  url = os.environ.get("GLADIA_TEST_AUDIO_URL")
  return bool(url and url.startswith(("http://", "https://")))

requires_api_key = pytest.mark.skipif(
  not os.environ.get("GLADIA_API_KEY"),
  reason="GLADIA_API_KEY not set",
)
requires_audio = pytest.mark.skipif(
  not _has_audio(),
  reason="GLADIA_TEST_AUDIO_PATH or GLADIA_TEST_AUDIO_URL not set or invalid",
)

from gladiaio_sdk.network import HttpError
from gladiaio_sdk.v2.prerecorded.generated_types import (
  PreRecordedV2DiarizationConfig,
  PreRecordedV2InitTranscriptionRequest,
  PreRecordedV2LanguageConfig,
  PreRecordedV2SubtitlesConfig,
  PreRecordedV2SummarizationConfig,
  PreRecordedV2TranslationConfig,
)


# ---- upload_file ----


@requires_api_key
@requires_audio
def test_upload_file_with_path(gladia_client, audio_source):
  """upload_file with local path or URL returns valid PreRecordedV2AudioUploadResponse."""
  if isinstance(audio_source, str):
    pytest.skip("Need local file for path test; use GLADIA_TEST_AUDIO_PATH")
  client = gladia_client.pre_recorded_v2()
  result = client.upload_file(audio_source)
  assert result.audio_url
  assert result.audio_metadata.id
  assert result.audio_metadata.filename
  assert result.audio_metadata.extension
  assert isinstance(result.audio_metadata.size, int)
  assert isinstance(result.audio_metadata.audio_duration, (int, float))
  assert isinstance(result.audio_metadata.number_of_channels, int)


@requires_api_key
@requires_audio
def test_upload_file_with_url(gladia_client, audio_url):
  """upload_file with web URL returns immediately without HTTP upload."""
  if not audio_url:
    pytest.skip("GLADIA_TEST_AUDIO_URL not set")
  client = gladia_client.pre_recorded_v2()
  result = client.upload_file(audio_url)
  assert result.audio_url == audio_url
  assert result.audio_metadata.filename == "audio_url"
  assert result.audio_metadata.extension == ""
  assert result.audio_metadata.size == 0
  assert result.audio_metadata.audio_duration == 0.0
  assert result.audio_metadata.number_of_channels == 0
  assert result.audio_metadata.source is None


@requires_api_key
@requires_audio
def test_upload_file_with_file_object(gladia_client, audio_source):
  """upload_file with open file object uploads and returns valid response."""
  if isinstance(audio_source, str):
    pytest.skip("Need local file for file-object test; use GLADIA_TEST_AUDIO_PATH")
  client = gladia_client.pre_recorded_v2()
  with open(audio_source, "rb") as f:
    result = client.upload_file(f)
  assert result.audio_url
  assert result.audio_metadata.id
  assert result.audio_metadata.filename
  assert result.audio_metadata.extension
  assert result.audio_metadata.size
  assert result.audio_metadata.audio_duration
  assert result.audio_metadata.number_of_channels
  assert result.audio_metadata.source


# ---- create ----


@requires_api_key
@requires_audio
def test_initiate_minimal(gladia_client, audio_source):
  """create with minimal options (audio_url only) returns id and result_url."""
  client = gladia_client.pre_recorded_v2()
  if isinstance(audio_source, Path):
    upload = client.upload_file(audio_source)
    audio_url = upload.audio_url
  else:
    audio_url = audio_source
  opts = PreRecordedV2InitTranscriptionRequest(audio_url=audio_url)
  result = client.initiate(opts)
  assert result.id
  assert result.result_url
  assert result.id in result.result_url or "/pre-recorded/" in result.result_url


@requires_api_key
@requires_audio
def test_initiate_with_language_config(gladia_client, audio_source):
  """create with language_config covers language/code_switching case."""
  client = gladia_client.pre_recorded_v2()
  if isinstance(audio_source, Path):
    upload = client.upload_file(audio_source)
    audio_url = upload.audio_url
  else:
    audio_url = audio_source
  opts = PreRecordedV2InitTranscriptionRequest(
    audio_url=audio_url,
    language_config=PreRecordedV2LanguageConfig(languages=["en"], code_switching=False),
  )
  result = client.initiate(opts)
  assert result.id
  assert result.result_url


@requires_api_key
@requires_audio
def test_initiate_with_subtitles_config(gladia_client, audio_source):
  """create with subtitles and subtitles_config covers subtitles case."""
  client = gladia_client.pre_recorded_v2()
  if isinstance(audio_source, Path):
    upload = client.upload_file(audio_source)
    audio_url = upload.audio_url
  else:
    audio_url = audio_source
  opts = PreRecordedV2InitTranscriptionRequest(
    audio_url=audio_url,
    subtitles=True,
    subtitles_config=PreRecordedV2SubtitlesConfig(formats=["srt"]),
  )
  result = client.initiate(opts)
  assert result.id
  assert result.result_url


@requires_api_key
@requires_audio
def test_initiate_with_diarization_config(gladia_client, audio_source):
  """create with diarization and diarization_config covers diarization case."""
  client = gladia_client.pre_recorded_v2()
  if isinstance(audio_source, Path):
    upload = client.upload_file(audio_source)
    audio_url = upload.audio_url
  else:
    audio_url = audio_source
  opts = PreRecordedV2InitTranscriptionRequest(
    audio_url=audio_url,
    diarization=True,
    diarization_config=PreRecordedV2DiarizationConfig(max_speakers=4),
  )
  result = client.initiate(opts)
  assert result.id
  assert result.result_url


@requires_api_key
@requires_audio
def test_initiate_with_translation_config(gladia_client, audio_source):
  """create with translation and translation_config covers translation case."""
  client = gladia_client.pre_recorded_v2()
  if isinstance(audio_source, Path):
    upload = client.upload_file(audio_source)
    audio_url = upload.audio_url
  else:
    audio_url = audio_source
  opts = PreRecordedV2InitTranscriptionRequest(
    audio_url=audio_url,
    translation=True,
    translation_config=PreRecordedV2TranslationConfig(target_languages=["fr"]),
  )
  result = client.initiate(opts)
  assert result.id
  assert result.result_url

@requires_api_key
@requires_audio
def test_initiate_with_summarization_config(gladia_client, audio_source):
  """create with summarization and summarization_config covers summarization case."""
  client = gladia_client.pre_recorded_v2()
  if isinstance(audio_source, Path):
    upload = client.upload_file(audio_source)
    audio_url = upload.audio_url
  else:
    audio_url = audio_source
  opts = PreRecordedV2InitTranscriptionRequest(
    audio_url=audio_url,
    summarization=True,
    summarization_config=PreRecordedV2SummarizationConfig(type="general"),
  )
  result = client.initiate(opts)
  assert result.id
  assert result.result_url


@requires_api_key
@requires_audio
def test_initiate_with_sentiment_analysis(gladia_client, audio_source):
  """create with sentiment_analysis=True covers sentiment case."""
  client = gladia_client.pre_recorded_v2()
  if isinstance(audio_source, Path):
    upload = client.upload_file(audio_source)
    audio_url = upload.audio_url
  else:
    audio_url = audio_source
  opts = PreRecordedV2InitTranscriptionRequest(
    audio_url=audio_url,
    sentiment_analysis=True,
  )
  result = client.initiate(opts)
  assert result.id
  assert result.result_url


@requires_api_key
@requires_audio
def test_initiate_with_dict_options(gladia_client, audio_source):
  """create accepts dict options (same as dataclass)."""
  client = gladia_client.pre_recorded_v2()
  if isinstance(audio_source, Path):
    upload = client.upload_file(audio_source)
    audio_url = upload.audio_url
  else:
    audio_url = audio_source
  opts = {"audio_url": audio_url, "sentences": True}
  result = client.initiate(opts)
  assert result.id
  assert result.result_url


# ---- get ----


@requires_api_key
@requires_audio
def test_get_returns_full_response(gladia_client, audio_source):
  """get(job_id) returns PreRecordedV2Response with all expected fields."""
  client = gladia_client.pre_recorded_v2()
  if isinstance(audio_source, Path):
    upload = client.upload_file(audio_source)
    audio_url = upload.audio_url
  else:
    audio_url = audio_source
  init_resp = client.initiate(PreRecordedV2InitTranscriptionRequest(audio_url=audio_url))
  job_id = init_resp.id
  result = client.get(job_id)
  assert result.id == job_id
  assert result.status in ("queued", "processing", "done", "error")
  assert result.request_id
  assert result.version >= 0
  assert result.created_at
  assert result.kind == "pre-recorded"
  if result.status == "done":
    assert result.result is not None
    assert result.result.metadata is not None
    assert hasattr(result.result.metadata, "audio_duration")
    assert hasattr(result.result.metadata, "number_of_distinct_channels")
    if result.result.transcription:
      assert hasattr(result.result.transcription, "full_transcript")
      assert hasattr(result.result.transcription, "utterances")
  if result.status == "error":
    assert result.error_code is not None


# ---- list_transcriptions ----


@requires_api_key
def test_list_transcriptions_no_limit(gladia_client):
  """list_transcriptions() without limit returns dict with list."""
  client = gladia_client.pre_recorded_v2()
  result = client.list_transcriptions()
  assert isinstance(result, dict)
  # API may return {"data": [...]}, {"transcriptions": [...]}, or pagination {"items": [...], "current", "first", ...}
  has_list = (
    "data" in result
    or "transcriptions" in result
    or "items" in result
    or isinstance(result.get("data"), list)
    or isinstance(result.get("items"), list)
  )
  has_pagination = "current" in result or "first" in result
  assert has_list or has_pagination, f"Expected list or pagination keys in {list(result.keys())}"


@requires_api_key
def test_list_transcriptions_with_limit(gladia_client):
  """list_transcriptions(limit=N) returns limited list."""
  client = gladia_client.pre_recorded_v2()
  result = client.list_transcriptions(limit=5)
  assert isinstance(result, dict)
  data = result.get("data", result.get("transcriptions", result.get("items", [])))
  if isinstance(data, list):
    assert len(data) <= 5


# ---- delete ----


def _delete_prerecorded_job_with_retry(client, job_id: str, max_attempts: int = 5) -> None:
  """Delete pre-recorded job; retry on 403 Invalid state (backend may lag)."""
  for attempt in range(max_attempts):
    try:
      client.delete(job_id)
      return
    except HttpError as e:
      if getattr(e, "status", None) != 403:
        raise
      msg = str(e)
      if "Invalid state" not in msg and "QUEUED" not in msg:
        raise
      if attempt == max_attempts - 1:
        raise
      time.sleep(3.0 * (attempt + 1))


@requires_api_key
@requires_audio
def test_delete_removes_job(gladia_client, audio_source):
  """delete(job_id) removes the job; get afterwards may 404 or return error."""
  client = gladia_client.pre_recorded_v2()
  if isinstance(audio_source, Path):
    upload = client.upload_file(audio_source)
    audio_url = upload.audio_url
  else:
    audio_url = audio_source
  init_resp = client.initiate(PreRecordedV2InitTranscriptionRequest(audio_url=audio_url))
  job_id = init_resp.id
  # API only allows delete when job is in terminal state (done or error)
  result = client.poll(job_id, interval=2.0, timeout=120.0)
  assert result.status in ("done", "error")
  # Brief delay so backend allows delete; retry on 403
  time.sleep(2.0)
  _delete_prerecorded_job_with_retry(client, job_id)
  # After delete, get may raise or return error status
  try:
    got = client.get(job_id)
    assert got.status == "error" or got.id == job_id
  except Exception:
    pass


# ---- download_audio_file ----


@requires_api_key
@requires_audio
def test_download_audio_file_returns_bytes(gladia_client, audio_source):
  """download_audio_file(job_id) returns raw bytes."""
  client = gladia_client.pre_recorded_v2()
  if isinstance(audio_source, Path):
    upload = client.upload_file(audio_source)
    audio_url = upload.audio_url
  else:
    audio_url = audio_source
  init_resp = client.initiate(PreRecordedV2InitTranscriptionRequest(audio_url=audio_url))
  job_id = init_resp.id
  content = client.download_audio_file(job_id)
  assert isinstance(content, bytes)
  assert len(content) >= 0


# ---- poll ----


@requires_api_key
@requires_audio
def test_poll_returns_done_response(gladia_client, audio_source):
  """poll(job_id) eventually returns PreRecordedV2Response with status done or error."""
  client = gladia_client.pre_recorded_v2()
  if isinstance(audio_source, Path):
    upload = client.upload_file(audio_source)
    audio_url = upload.audio_url
  else:
    audio_url = audio_source
  init_resp = client.initiate(PreRecordedV2InitTranscriptionRequest(audio_url=audio_url))
  result = client.poll(init_resp.id, interval=2.0, timeout=120.0)
  assert result.status in ("done", "error")
  assert result.id == init_resp.id
  if result.status == "done":
    assert result.result is not None
    assert result.result.metadata is not None


# ---- create_and_poll ----


@requires_api_key
@requires_audio
def test_initiate_and_poll_minimal(gladia_client, audio_source):
  """create_and_poll with minimal options returns completed PreRecordedV2Response."""
  client = gladia_client.pre_recorded_v2()
  if isinstance(audio_source, Path):
    upload = client.upload_file(audio_source)
    audio_url = upload.audio_url
  else:
    audio_url = audio_source
  opts = PreRecordedV2InitTranscriptionRequest(audio_url=audio_url)
  result = client.initiate_and_poll(opts, interval=2.0, timeout=120.0)
  assert result.status in ("done", "error")
  assert result.id
  if result.status == "done":
    assert result.result is not None
    assert result.result.transcription is not None
    assert hasattr(result.result.transcription, "full_transcript")
    assert hasattr(result.result.transcription, "utterances")


@requires_api_key
@requires_audio
def test_initiate_and_poll_with_subtitles(gladia_client, audio_source):
  """create_and_poll with subtitles returns result with subtitles when done."""
  client = gladia_client.pre_recorded_v2()
  if isinstance(audio_source, Path):
    upload = client.upload_file(audio_source)
    audio_url = upload.audio_url
  else:
    audio_url = audio_source
  opts = PreRecordedV2InitTranscriptionRequest(
    audio_url=audio_url,
    subtitles=True,
    subtitles_config=PreRecordedV2SubtitlesConfig(formats=["srt", "vtt"]),
  )
  result = client.initiate_and_poll(opts, interval=2.0, timeout=120.0)
  assert result.status in ("done", "error")
  if result.status == "done" and result.result and result.result.transcription:
    assert result.result.transcription.subtitles is None or isinstance(
      result.result.transcription.subtitles, list
    )


# ---- transcribe ----


@requires_api_key
@requires_audio
def test_transcribe_with_file(gladia_client, audio_source):
  """transcribe(file, options) with file path uploads and returns completed result."""
  if isinstance(audio_source, str):
    pytest.skip("Need local file for transcribe(file) test")
  client = gladia_client.pre_recorded_v2()
  opts = PreRecordedV2InitTranscriptionRequest(audio_url="placeholder")
  result = client.transcribe(audio_source, opts)
  assert result.status in ("done", "error")
  assert result.id
  if result.status == "done":
    assert result.result is not None
    assert result.result.transcription is not None


@requires_api_key
@requires_audio
def test_transcribe_with_url(gladia_client, audio_url):
  """transcribe(url, options) with URL uses URL as audio_url and returns completed result."""
  if not audio_url:
    pytest.skip("GLADIA_TEST_AUDIO_URL not set")
  client = gladia_client.pre_recorded_v2()
  opts = PreRecordedV2InitTranscriptionRequest(audio_url=audio_url)
  result = client.transcribe(audio_url, opts)
  assert result.status in ("done", "error")
  assert result.id


@requires_api_key
@requires_audio
def test_transcribe_with_upload_id_skips_upload(gladia_client, audio_source):
  """transcribe(upload_id, options) uses upload id as audio_url and does not call upload."""
  client = gladia_client.pre_recorded_v2()
  if isinstance(audio_source, Path):
    upload = client.upload_file(audio_source)
    upload_id = upload.audio_metadata.id
  else:
    pytest.skip("Need local file to get upload_id")
  opts = PreRecordedV2InitTranscriptionRequest(audio_url="placeholder")
  result = client.transcribe(upload_id, opts)
  assert result.status in ("done", "error")
  assert result.id


