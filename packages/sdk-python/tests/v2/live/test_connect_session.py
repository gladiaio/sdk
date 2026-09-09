"""Tests for Live V2 connect_session (reconnect to an existing session)."""

from __future__ import annotations

import asyncio
import json
import time
from collections.abc import Callable
from typing import Any

import pytest

from gladiaio_sdk.client_options import GladiaClientOptions, WebSocketRetryOptions
from gladiaio_sdk.network import WS_STATES
from gladiaio_sdk.v2.live.async_client import LiveV2AsyncClient
from gladiaio_sdk.v2.live.client import LiveV2Client
from gladiaio_sdk.v2.live.generated_types import (
  LiveV2InitRequest,
  LiveV2MessagesConfig,
)
from gladiaio_sdk.v2.live.types import LiveV2ConnectSessionOptions


class FakeHttpClient:
  def __init__(self) -> None:
    self.post_calls: list[tuple[str, dict[str, Any]]] = []

  def post(self, url: str, **kwargs: Any) -> Any:
    self.post_calls.append((url, kwargs))

    class Response:
      content = json.dumps(
        {
          "id": "created-session-id",
          "url": "wss://api.gladia.io/v2/live/ws?token=created",
          "created_at": "2026-06-25T09:00:00Z",
        }
      ).encode()

    return Response()


class FakeAsyncHttpClient(FakeHttpClient):
  async def post(self, url: str, **kwargs: Any) -> Any:
    return super().post(url, **kwargs)


class FakeWebSocketSession:
  def __init__(self, url: str) -> None:
    self.url = url
    self.ready_state = WS_STATES.CONNECTING
    self.onconnecting: Any = None
    self.onopen: Any = None
    self.onmessage: Any = None
    self.onclose: Any = None
    self.onerror: Any = None
    self.sent: list[Any] = []

  def send(self, data: Any) -> None:
    self.sent.append(data)

  def close(self, code: int = 1000, reason: str = "") -> None:
    self.ready_state = WS_STATES.CLOSED
    if self.onclose:
      self.onclose({"code": code, "reason": reason})

  def start(self) -> None:
    self.trigger_open()

  def trigger_open(self) -> None:
    if self.onconnecting:
      self.onconnecting({"attempt": 1})
    self.ready_state = WS_STATES.OPEN
    if self.onopen:
      self.onopen({"attempt": 1})


class FakeWebSocketClient:
  def __init__(self) -> None:
    self.created_urls: list[str] = []
    self.sessions: list[FakeWebSocketSession] = []

  def create_session(self, url: str) -> FakeWebSocketSession:
    self.created_urls.append(url)
    session = FakeWebSocketSession(url)
    self.sessions.append(session)
    return session

  def create_async_session(self, url: str) -> FakeWebSocketSession:
    return self.create_session(url)


def _client_options(**overrides: Any) -> GladiaClientOptions:
  return GladiaClientOptions(
    api_url="https://api.gladia.io",
    ws_retry=WebSocketRetryOptions(max_attempts_per_connection=0, max_connections=0),
    **overrides,
  )


def _wait_for(predicate: Callable[[], bool], timeout: float = 2.0) -> bool:
  deadline = time.time() + timeout
  while time.time() < deadline:
    if predicate():
      return True
    time.sleep(0.01)
  return False


def test_connect_session_skips_http_init_and_connects(monkeypatch):
  http_client = FakeHttpClient()
  ws_client = FakeWebSocketClient()

  monkeypatch.setattr(
    "gladiaio_sdk.v2.live.client.HttpClient",
    lambda **kwargs: http_client,
  )
  monkeypatch.setattr(
    "gladiaio_sdk.v2.live.client.WebSocketClient",
    lambda **kwargs: ws_client,
  )

  client = LiveV2Client(_client_options())

  session = client.connect_session(
    LiveV2ConnectSessionOptions(
      id="session-123",
      url="wss://api.gladia.io/v2/live/ws?token=abc",
      created_at="2026-06-25T10:00:00Z",
      messages_config=LiveV2MessagesConfig(receive_lifecycle_events=True),
    )
  )

  assert _wait_for(lambda: session.session_id == "session-123")
  assert _wait_for(lambda: session.status == "connected")

  assert http_client.post_calls == []
  assert ws_client.created_urls == ["wss://api.gladia.io/v2/live/ws?token=abc"]

  session.end_session()
  assert session.join(timeout=2)


def test_start_session_still_calls_http_init(monkeypatch):
  http_client = FakeHttpClient()
  ws_client = FakeWebSocketClient()

  monkeypatch.setattr(
    "gladiaio_sdk.v2.live.client.HttpClient",
    lambda **kwargs: http_client,
  )
  monkeypatch.setattr(
    "gladiaio_sdk.v2.live.client.WebSocketClient",
    lambda **kwargs: ws_client,
  )

  client = LiveV2Client(_client_options())
  session = client.start_session(LiveV2InitRequest(sample_rate=16000))

  assert _wait_for(lambda: session.session_id == "created-session-id")
  assert _wait_for(lambda: session.status == "connected")

  assert len(http_client.post_calls) == 1
  assert http_client.post_calls[0][0] == "/v2/live"
  assert http_client.post_calls[0][1]["json"]["sample_rate"] == 16000
  assert ws_client.created_urls == ["wss://api.gladia.io/v2/live/ws?token=created"]

  session.end_session()
  assert session.join(timeout=2)


def test_start_session_passes_region_only_on_live_init(monkeypatch):
  http_client = FakeHttpClient()
  ws_client = FakeWebSocketClient()

  monkeypatch.setattr(
    "gladiaio_sdk.v2.live.client.HttpClient",
    lambda **kwargs: http_client,
  )
  monkeypatch.setattr(
    "gladiaio_sdk.v2.live.client.WebSocketClient",
    lambda **kwargs: ws_client,
  )

  client = LiveV2Client(_client_options(region="us-west"))
  session = client.start_session(LiveV2InitRequest(sample_rate=16000))

  assert _wait_for(lambda: session.session_id == "created-session-id")
  assert len(http_client.post_calls) == 1
  assert http_client.post_calls[0][0] == "/v2/live?region=us-west"

  session.end_session()
  assert session.join(timeout=2)


async def _run_async_connect_session_test(
  http_client: FakeAsyncHttpClient,
  ws_client: FakeWebSocketClient,
) -> None:
  client = LiveV2AsyncClient(_client_options())
  session = client.connect_session(
    LiveV2ConnectSessionOptions(
      id="session-456",
      url="wss://api.gladia.io/v2/live/ws?token=def",
      created_at="2026-06-25T11:00:00Z",
    )
  )

  deadline = time.time() + 2
  while time.time() < deadline:
    if session.session_id == "session-456" and len(ws_client.sessions) == 1:
      break
    await asyncio.sleep(0.01)
  else:
    pytest.fail("session was not initialized")

  ws_client.sessions[0].trigger_open()

  deadline = time.time() + 2
  while time.time() < deadline:
    if session.status == "connected":
      break
    await asyncio.sleep(0.01)
  else:
    pytest.fail("session did not reach connected status")

  assert http_client.post_calls == []
  assert ws_client.created_urls == ["wss://api.gladia.io/v2/live/ws?token=def"]
  assert await session.get_session_id() == "session-456"

  session.end_session()


def test_async_connect_session_skips_http_init_and_connects(monkeypatch):
  http_client = FakeAsyncHttpClient()
  ws_client = FakeWebSocketClient()

  monkeypatch.setattr(
    "gladiaio_sdk.v2.live.async_client.AsyncHttpClient",
    lambda **kwargs: http_client,
  )
  monkeypatch.setattr(
    "gladiaio_sdk.v2.live.async_client.WebSocketClient",
    lambda **kwargs: ws_client,
  )

  asyncio.run(_run_async_connect_session_test(http_client, ws_client))
