"""Unit tests for LiveV2Client API methods (get, list, download, delete, start_session).

These tests mock the HTTP and WebSocket layers: no API key or real audio is required.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from gladiaio_sdk.client_options import GladiaClientOptions
from gladiaio_sdk.v2.live.client import LiveV2Client
from gladiaio_sdk.v2.live.session import LiveV2Session


def _make_response(content: bytes | None = None, json_dict: dict | None = None):
  resp = MagicMock()
  resp.content = content or b""
  resp.json = MagicMock(return_value=json_dict or {})
  return resp


@pytest.fixture
def options():
  return GladiaClientOptions(
    api_key="test-key",
    api_url="https://api.gladia.io",
    http_headers={"x-gladia-key": "test-key", "x-gladia-version": "SdkPython/0.0.0"},
  )


@pytest.fixture
def mock_http_client():
  return MagicMock()


@pytest.fixture
def mock_ws_client():
  return MagicMock()


@patch("gladiaio_sdk.v2.live.client.WebSocketClient")
@patch("gladiaio_sdk.v2.live.client.HttpClient")
def test_live_get_calls_http_get(MockHttpClient, MockWebSocketClient, options, mock_http_client, mock_ws_client):
  MockHttpClient.return_value = mock_http_client
  MockWebSocketClient.return_value = mock_ws_client
  session_id = "live-session-123"
  mock_http_client.get.return_value = _make_response(json_dict={"id": session_id, "status": "created"})

  client = LiveV2Client(options)
  result = client.get(session_id)

  mock_http_client.get.assert_called_once_with(f"v2/live/{session_id}")
  assert result == {"id": session_id, "status": "created"}


@patch("gladiaio_sdk.v2.live.client.WebSocketClient")
@patch("gladiaio_sdk.v2.live.client.HttpClient")
def test_live_list_transcriptions_calls_http_get(
  MockHttpClient, MockWebSocketClient, options, mock_http_client, mock_ws_client
):
  MockHttpClient.return_value = mock_http_client
  MockWebSocketClient.return_value = mock_ws_client
  mock_http_client.get.return_value = _make_response(json_dict={"data": [], "total": 0})

  client = LiveV2Client(options)
  result = client.list_transcriptions()
  mock_http_client.get.assert_called_once_with("v2/live")
  assert result == {"data": [], "total": 0}

  mock_http_client.reset_mock()
  mock_http_client.get.return_value = _make_response(json_dict={"data": []})
  client.list_transcriptions(limit=10)
  mock_http_client.get.assert_called_once_with("v2/live?limit=10")


@patch("gladiaio_sdk.v2.live.client.WebSocketClient")
@patch("gladiaio_sdk.v2.live.client.HttpClient")
def test_live_download_calls_http_get(
  MockHttpClient, MockWebSocketClient, options, mock_http_client, mock_ws_client
):
  MockHttpClient.return_value = mock_http_client
  MockWebSocketClient.return_value = mock_ws_client
  session_id = "live-dl-456"
  mock_http_client.get.return_value = _make_response(content=b"raw file bytes")

  client = LiveV2Client(options)
  result = client.download(session_id)

  mock_http_client.get.assert_called_once_with(f"v2/live/{session_id}/file")
  assert result == b"raw file bytes"


@patch("gladiaio_sdk.v2.live.client.WebSocketClient")
@patch("gladiaio_sdk.v2.live.client.HttpClient")
def test_live_delete_calls_http_delete(
  MockHttpClient, MockWebSocketClient, options, mock_http_client, mock_ws_client
):
  MockHttpClient.return_value = mock_http_client
  MockWebSocketClient.return_value = mock_ws_client
  session_id = "live-del-789"

  client = LiveV2Client(options)
  client.delete(session_id)

  mock_http_client.delete.assert_called_once_with(f"v2/live/{session_id}")


@patch("gladiaio_sdk.v2.live.client.WebSocketClient")
@patch("gladiaio_sdk.v2.live.client.HttpClient")
def test_live_start_session_returns_session(
  MockHttpClient, MockWebSocketClient, options, mock_http_client, mock_ws_client
):
  MockHttpClient.return_value = mock_http_client
  MockWebSocketClient.return_value = mock_ws_client

  client = LiveV2Client(options)
  from gladiaio_sdk.v2.live.generated_types import LiveV2InitRequest

  init_options = LiveV2InitRequest()
  session = client.start_session(init_options)

  assert isinstance(session, LiveV2Session)
  assert session._http_client is mock_http_client
  assert session._ws_client is mock_ws_client
