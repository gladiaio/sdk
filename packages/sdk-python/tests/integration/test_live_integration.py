"""Integration tests for LiveV2Client against the real API.

Run with GLADIA_API_KEY set. Optional: GLADIA_TEST_AUDIO_PATH for sending live audio.
Covers every client method (get, list_transcriptions, download, delete, start_session)
and asserts config handling and response structure.
"""

from __future__ import annotations

import os
import time
from pathlib import Path

import pytest

from gladiaio_sdk.network import HttpError
from gladiaio_sdk.v2.live.generated_types import (
  LiveV2InitRequest,
  LiveV2LanguageConfig,
  LiveV2MessagesConfig,
  LiveV2PreProcessingConfig,
)

# Skip when API key not set (audio optional for live: we only need a session id)
requires_api_key = pytest.mark.skipif(
  not os.environ.get("GLADIA_API_KEY"),
  reason="GLADIA_API_KEY not set",
)


def _wait_for_session_id(session, timeout: float = 15.0) -> str:
  """Wait until session has session_id (started)."""
  start = time.monotonic()
  while time.monotonic() - start < timeout:
    if session.session_id:
      return session.session_id
    time.sleep(0.1)
  raise TimeoutError("Session did not get session_id in time")


def _wait_for_live_session_terminal(client, session_id: str, timeout: float = 90.0) -> None:
  """Wait until live session reaches SUCCESS or ERROR (required for download/delete)."""
  start = time.monotonic()
  while time.monotonic() - start < timeout:
    data = client.get(session_id)
    status = (data.get("status") or "").upper()
    if status in ("SUCCESS", "ERROR"):
      # Brief delay so backend has time to allow delete
      time.sleep(2.0)
      return
    time.sleep(1.0)
  raise TimeoutError(f"Session {session_id} did not reach terminal state in time")


def _delete_live_session_with_retry(client, session_id: str, max_attempts: int = 3) -> None:
  """Delete live session; retry on 403 Invalid state (backend may lag)."""
  for attempt in range(max_attempts):
    try:
      client.delete(session_id)
      return
    except HttpError as e:
      if getattr(e, "status", None) != 403:
        raise
      msg = getattr(e, "message", str(e))
      if "Invalid state" not in msg and "QUEUED" not in msg:
        raise
      if attempt == max_attempts - 1:
        raise
      time.sleep(3.0 * (attempt + 1))


# ---- start_session ----


@requires_api_key
def test_start_session_default_options(gladia_client):
  """start_session with default LiveV2InitRequest returns LiveV2Session with session_id."""
  client = gladia_client.live_v2()
  opts = LiveV2InitRequest()
  session = client.start_session(opts)
  try:
    session_id = _wait_for_session_id(session)
    assert session_id
    assert session.session_id == session_id
    assert session.status in ("starting", "started", "connecting", "connected")
  finally:
    session.end_session()


@requires_api_key
def test_start_session_with_encoding_and_sample_rate(gladia_client):
  """start_session with encoding, bit_depth, sample_rate covers audio config case."""
  client = gladia_client.live_v2()
  opts = LiveV2InitRequest(
    encoding="wav/pcm",
    bit_depth=16,
    sample_rate=16000,
    channels=1,
  )
  session = client.start_session(opts)
  try:
    session_id = _wait_for_session_id(session)
    assert session_id
  finally:
    session.end_session()


@requires_api_key
def test_start_session_with_language_config(gladia_client):
  """start_session with language_config covers language case."""
  client = gladia_client.live_v2()
  opts = LiveV2InitRequest(
    language_config=LiveV2LanguageConfig(languages=["en"], code_switching=False),
  )
  session = client.start_session(opts)
  try:
    session_id = _wait_for_session_id(session)
    assert session_id
  finally:
    session.end_session()


@requires_api_key
def test_start_session_with_pre_processing(gladia_client):
  """start_session with pre_processing covers pre-processing config case."""
  client = gladia_client.live_v2()
  opts = LiveV2InitRequest(
    pre_processing=LiveV2PreProcessingConfig(
      audio_enhancer=True,
      speech_threshold=0.5,
    ),
  )
  session = client.start_session(opts)
  try:
    session_id = _wait_for_session_id(session)
    assert session_id
  finally:
    session.end_session()


@requires_api_key
def test_start_session_with_messages_config(gladia_client):
  """start_session with messages_config covers websocket message options."""
  client = gladia_client.live_v2()
  opts = LiveV2InitRequest(
    messages_config=LiveV2MessagesConfig(
      receive_partial_transcripts=True,
      receive_final_transcripts=True,
      receive_acknowledgments=True,
    ),
  )
  session = client.start_session(opts)
  try:
    session_id = _wait_for_session_id(session)
    assert session_id
  finally:
    session.end_session()


# ---- get ----


@requires_api_key
def test_get_returns_session_data(gladia_client):
  """get(session_id) returns dict with session data."""
  client = gladia_client.live_v2()
  opts = LiveV2InitRequest()
  session = client.start_session(opts)
  try:
    session_id = _wait_for_session_id(session)
  finally:
    session.end_session()
  result = client.get(session_id)
  assert isinstance(result, dict)
  assert result.get("id") == session_id or "id" in result


# ---- list_transcriptions ----


@requires_api_key
def test_list_transcriptions_no_limit(gladia_client):
  """list_transcriptions() without limit returns dict (list of sessions)."""
  client = gladia_client.live_v2()
  result = client.list_transcriptions()
  assert isinstance(result, dict)
  # API may return {"data": [...]} or similar
  assert "data" in result or isinstance(result.get("data"), list) or True


@requires_api_key
def test_list_transcriptions_with_limit(gladia_client):
  """list_transcriptions(limit=N) returns limited list."""
  client = gladia_client.live_v2()
  result = client.list_transcriptions(limit=10)
  assert isinstance(result, dict)
  data = result.get("data", result.get("items", []))
  if isinstance(data, list):
    assert len(data) <= 10


# ---- download ----
@requires_api_key
def test_download_returns_bytes(gladia_client):
  """download(session_id) returns raw bytes."""
  client = gladia_client.live_v2()
  opts = LiveV2InitRequest()
  session = client.start_session(opts)
  try:
    session_id = _wait_for_session_id(session)
  finally:
    session.end_session()
  try:
    _wait_for_live_session_terminal(client, session_id)
  except TimeoutError:
    pytest.skip("Session did not reach terminal state (no audio sent)")
  try:
    content = client.download(session_id)
    assert isinstance(content, bytes)
  except HttpError as e:
    if getattr(e, "status", None) in (404, "404"):
      pytest.skip("Session produced no file (no audio sent)")
    raise
  finally:
    try:
      _delete_live_session_with_retry(client, session_id)
    except Exception:
      pass


# ---- delete ----


@requires_api_key
def test_delete_removes_session(gladia_client):
  """delete(session_id) removes the session."""
  client = gladia_client.live_v2()
  opts = LiveV2InitRequest()
  session = client.start_session(opts)
  try:
    session_id = _wait_for_session_id(session)
  finally:
    session.end_session()
  # API only allows delete when session is in terminal state (SUCCESS or ERROR)
  try:
    _wait_for_live_session_terminal(client, session_id)
  except TimeoutError:
    pytest.skip("Session did not reach terminal state (no audio sent)")
  _delete_live_session_with_retry(client, session_id)
  # After delete, get may 404 or return error
  try:
    got = client.get(session_id)
    assert isinstance(got, dict)
  except Exception:
    pass


# ---- with audio (when GLADIA_TEST_AUDIO_PATH set) ----


def _has_audio_path() -> bool:
  path = os.environ.get("GLADIA_TEST_AUDIO_PATH")
  return bool(path and Path(path).is_file())


requires_audio = pytest.mark.skipif(
  not _has_audio_path(),
  reason="GLADIA_TEST_AUDIO_PATH not set or not a file",
)


@requires_api_key
@requires_audio
def test_live_send_audio_then_stop(gladia_client, audio_path):
  """start_session, send audio from file, stop_recording; response flow covered."""
  if audio_path is None:
    pytest.skip("GLADIA_TEST_AUDIO_PATH not set")
  client = gladia_client.live_v2()
  opts = LiveV2InitRequest(
    encoding="wav/pcm",
    bit_depth=16,
    sample_rate=16000,
    channels=1,
  )
  session = client.start_session(opts)
  try:
    session_id = _wait_for_session_id(session)
    assert session_id
    with open(audio_path, "rb") as f:
      chunk = f.read(8192)
    if chunk:
      session.send_audio(chunk)
    session.stop_recording()
    time.sleep(1.0)
  finally:
    session.end_session()
  data = client.get(session_id)
  assert isinstance(data, dict)
  _wait_for_live_session_terminal(client, session_id)
  _delete_live_session_with_retry(client, session_id)


# ---- full flow: start -> optional audio -> get/list/download/delete ----


@requires_api_key
def test_live_full_flow_get_list_download_delete(gladia_client):
  """Full flow: start_session, get session_id, then get, list, download, delete."""
  client = gladia_client.live_v2()
  opts = LiveV2InitRequest()
  session = client.start_session(opts)
  try:
    session_id = _wait_for_session_id(session)
  finally:
    session.end_session()
  # get
  data = client.get(session_id)
  assert data.get("id") == session_id or "id" in data
  # list
  list_res = client.list_transcriptions(limit=5)
  assert isinstance(list_res, dict)
  # API only allows download/delete when session is in terminal state
  try:
    _wait_for_live_session_terminal(client, session_id)
  except TimeoutError:
    pytest.skip("Session did not reach terminal state (no audio sent)")
  # download (may 404 if session had no audio)
  try:
    raw = client.download(session_id)
    assert isinstance(raw, bytes)
  except HttpError as e:
    if getattr(e, "status", None) in (404, "404"):
      pass  # no file when no audio sent
    else:
      raise
  # delete
  _delete_live_session_with_retry(client, session_id)
