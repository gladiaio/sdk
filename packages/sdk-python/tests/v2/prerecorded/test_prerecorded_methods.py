"""Unit tests for PreRecordedV2Client API methods (upload, create, get, transcribe, etc.).

These tests mock the HTTP layer: no API key or real audio is required.
"""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from gladiaio_sdk.client_options import GladiaClientOptions
from gladiaio_sdk.v2.prerecorded.client import PreRecordedV2Client
from gladiaio_sdk.v2.prerecorded.generated_types import (
  PreRecordedV2InitTranscriptionRequest,
)


def _make_response(content: bytes | None = None, json_dict: dict | None = None):
  resp = MagicMock()
  resp.content = content or b""
  resp.json = MagicMock(return_value=json_dict or {})
  return resp


def _upload_response_json(audio_url: str = "https://api.gladia.io/v2/upload/abc-123", upload_id: str = "abc-123"):
  return {
    "audio_url": audio_url,
    "audio_metadata": {
      "id": upload_id,
      "filename": "test.wav",
      "extension": "wav",
      "size": 1024,
      "audio_duration": 5.0,
      "number_of_channels": 1,
    },
  }


def _init_response_json(job_id: str = "job-456", result_url: str = "https://api.gladia.io/v2/pre-recorded/job-456"):
  return {"id": job_id, "result_url": result_url}


def _job_response_json(
  job_id: str = "job-456",
  status: str = "done",
  request_id: str = "req-1",
  version: int = 1,
  created_at: str = "2025-01-01T00:00:00Z",
  error_code: int | None = None,
):
  return {
    "id": job_id,
    "request_id": request_id,
    "version": version,
    "status": status,
    "created_at": created_at,
    "kind": "pre-recorded",
    "error_code": error_code,
    "file": None,
    "request_params": None,
    "result": None,
  }


@pytest.fixture
def options():
  return GladiaClientOptions(
    api_key="test-key",
    api_url="https://api.gladia.io",
    http_headers={"x-gladia-key": "test-key", "x-gladia-version": "SdkPython/0.0.0"},
  )


@pytest.fixture
def mock_http_client():
  client = MagicMock()
  return client


@patch("gladiaio_sdk.v2.prerecorded.client.HttpClient")
def test_upload_file_calls_post_with_files(MockHttpClient, options, mock_http_client):
  MockHttpClient.return_value = mock_http_client
  payload = _upload_response_json()
  mock_http_client.post.return_value = _make_response(content=json.dumps(payload).encode())

  pr = PreRecordedV2Client(options)
  with open(Path(__file__).parent / "conftest.py", "rb") as f:
    # Use a real small file so path handling is exercised
    result = pr.upload_file(f)

  mock_http_client.post.assert_called_once()
  call_args = mock_http_client.post.call_args
  assert call_args[0][0] == "/v2/upload"
  assert "files" in call_args[1]
  assert result.audio_url == payload["audio_url"]
  assert result.audio_metadata.id == payload["audio_metadata"]["id"]


@patch("gladiaio_sdk.v2.prerecorded.client.HttpClient")
def test_upload_file_web_url_returns_without_http_call(MockHttpClient, options, mock_http_client):
  MockHttpClient.return_value = mock_http_client

  pr = PreRecordedV2Client(options)
  result = pr.upload_file("https://example.com/audio.wav")

  mock_http_client.post.assert_not_called()
  assert result.audio_url == "https://example.com/audio.wav"
  assert result.audio_metadata.filename == "audio_url"


@patch("gladiaio_sdk.v2.prerecorded.client.HttpClient")
def test_initiate_calls_post_with_body(MockHttpClient, options, mock_http_client):
  MockHttpClient.return_value = mock_http_client
  body = {"audio_url": "https://uploaded/audio"}
  init_resp = _init_response_json()
  mock_http_client.post.return_value = _make_response(content=json.dumps(init_resp).encode())

  pr = PreRecordedV2Client(options)
  result = pr.initiate(body)

  mock_http_client.post.assert_called_once_with("/v2/pre-recorded", json=body)
  assert result.id == init_resp["id"]
  assert result.result_url == init_resp["result_url"]


@patch("gladiaio_sdk.v2.prerecorded.client.HttpClient")
def test_get_calls_get_job_endpoint(MockHttpClient, options, mock_http_client):
  MockHttpClient.return_value = mock_http_client
  job_id = "job-789"
  job = _job_response_json(job_id=job_id, status="done")
  mock_http_client.get.return_value = _make_response(json_dict=job)

  pr = PreRecordedV2Client(options)
  result = pr.get(job_id)

  mock_http_client.get.assert_called_once_with(f"/v2/pre-recorded/{job_id}")
  assert result.id == job_id
  assert result.status == "done"


@patch("gladiaio_sdk.v2.prerecorded.client.HttpClient")
def test_list_transcriptions_calls_get_with_optional_limit(MockHttpClient, options, mock_http_client):
  MockHttpClient.return_value = mock_http_client
  mock_http_client.get.return_value = _make_response(json_dict={"data": [], "total": 0})

  pr = PreRecordedV2Client(options)
  result = pr.list_transcriptions()
  mock_http_client.get.assert_called_once_with("/v2/pre-recorded")
  assert result == {"data": [], "total": 0}

  mock_http_client.reset_mock()
  mock_http_client.get.return_value = _make_response(json_dict={"data": []})
  pr.list_transcriptions(limit=20)
  mock_http_client.get.assert_called_once_with("/v2/pre-recorded?limit=20")


@patch("gladiaio_sdk.v2.prerecorded.client.HttpClient")
def test_delete_calls_delete_job_endpoint(MockHttpClient, options, mock_http_client):
  MockHttpClient.return_value = mock_http_client
  job_id = "job-delete-me"
  pr = PreRecordedV2Client(options)
  pr.delete(job_id)
  mock_http_client.delete.assert_called_once_with(f"/v2/pre-recorded/{job_id}")


@patch("gladiaio_sdk.v2.prerecorded.client.HttpClient")
def test_download_audio_file_calls_get_file_endpoint(MockHttpClient, options, mock_http_client):
  MockHttpClient.return_value = mock_http_client
  job_id = "job-file"
  mock_http_client.get.return_value = _make_response(content=b"raw audio bytes")

  pr = PreRecordedV2Client(options)
  result = pr.download_audio_file(job_id)

  mock_http_client.get.assert_called_once_with(f"/v2/pre-recorded/{job_id}/file")
  assert result == b"raw audio bytes"

@patch("gladiaio_sdk.v2.prerecorded.client.HttpClient")
def test_poll_returns_when_done(MockHttpClient, options, mock_http_client):
  MockHttpClient.return_value = mock_http_client
  job_id = "job-poll"
  job = _job_response_json(job_id=job_id, status="done")
  mock_http_client.get.return_value = _make_response(json_dict=job)

  pr = PreRecordedV2Client(options)
  result = pr.poll(job_id, interval=0.1, timeout=5)

  mock_http_client.get.assert_called_with(f"/v2/pre-recorded/{job_id}")
  assert result.status == "done"


@patch("gladiaio_sdk.v2.prerecorded.client.HttpClient")
def test_poll_raises_on_error_status(MockHttpClient, options, mock_http_client):
  MockHttpClient.return_value = mock_http_client
  job_id = "job-err"
  job = _job_response_json(job_id=job_id, status="error", error_code=500)
  mock_http_client.get.return_value = _make_response(json_dict=job)

  pr = PreRecordedV2Client(options)
  with pytest.raises(Exception) as exc_info:
    pr.poll(job_id, interval=0.1, timeout=1)
  assert job_id in str(exc_info.value)
  assert "500" in str(exc_info.value)


@patch("gladiaio_sdk.v2.prerecorded.client.HttpClient")
def test_initiate_and_poll_calls_initiate_then_poll(MockHttpClient, options, mock_http_client):
  MockHttpClient.return_value = mock_http_client
  init_resp = _init_response_json(job_id="job-cp")
  job_resp = _job_response_json(job_id="job-cp", status="done")
  mock_http_client.post.return_value = _make_response(content=json.dumps(init_resp).encode())
  mock_http_client.get.return_value = _make_response(json_dict=job_resp)

  pr = PreRecordedV2Client(options)
  opts = PreRecordedV2InitTranscriptionRequest(audio_url="https://example.com/a.wav")
  result = pr.initiate_and_poll(opts, interval=0.1, timeout=5)

  assert mock_http_client.post.call_count == 1
  assert mock_http_client.get.call_count >= 1
  assert result.id == "job-cp"
  assert result.status == "done"


@patch("gladiaio_sdk.v2.prerecorded.client.HttpClient")
def test_transcribe_with_upload_id_skips_upload(MockHttpClient, options, mock_http_client):
  MockHttpClient.return_value = mock_http_client
  # upload_id is a UUID-like string; client treats it as audio_url and does not upload
  upload_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  init_resp = _init_response_json(job_id="job-t")
  job_resp = _job_response_json(job_id="job-t", status="done")
  mock_http_client.post.return_value = _make_response(content=json.dumps(init_resp).encode())
  mock_http_client.get.return_value = _make_response(json_dict=job_resp)

  pr = PreRecordedV2Client(options)
  opts = PreRecordedV2InitTranscriptionRequest(audio_url="https://placeholder")  # replaced by upload_id
  result = pr.transcribe(upload_id, opts)

  # No upload call; only create + get
  post_calls = [c for c in mock_http_client.post.call_args_list if c[0][0] == "/v2/upload"]
  assert len(post_calls) == 0
  assert result.status == "done"


@patch("gladiaio_sdk.v2.prerecorded.client.HttpClient")
def test_transcribe_with_file_uploads_then_initiate_and_poll(MockHttpClient, options, mock_http_client):
  MockHttpClient.return_value = mock_http_client
  upload_payload = _upload_response_json(audio_url="https://api.gladia.io/v2/upload/up-1")
  init_resp = _init_response_json(job_id="job-t2")
  job_resp = _job_response_json(job_id="job-t2", status="done")
  mock_http_client.post.side_effect = [
    _make_response(content=json.dumps(upload_payload).encode()),
    _make_response(content=json.dumps(init_resp).encode()),
  ]
  mock_http_client.get.return_value = _make_response(json_dict=job_resp)

  pr = PreRecordedV2Client(options)
  opts = PreRecordedV2InitTranscriptionRequest(audio_url="https://placeholder")  # replaced after upload
  with open(Path(__file__).parent / "conftest.py", "rb") as f:
    result = pr.transcribe(f, opts)

  assert mock_http_client.post.call_count == 2  # upload + create
  assert result.status == "done"
