"""WebSocketClient + WebSocketSession tests (Python port of JS suite, core cases)."""

import asyncio
from typing import Any, TypedDict

import pytest

from gladiaio_sdk.client_options import WebSocketRetryOptions
from gladiaio_sdk.network.async_websocket_client import (
  WS_STATES,
  AsyncWebSocketClient,
)


def run(coro):
  return asyncio.run(coro)


class FakeWS:
  def __init__(self, messages: list[Any] | None = None) -> None:
    self._messages = list(messages or [])
    self._closed = False
    self._closed_event = asyncio.Event()
    self.sent: list[Any] = []
    self.close_calls: list[tuple[int, str]] = []
    self.close_code: int | None = None
    self.close_reason: str | None = None
    # Match the integer semantics used by the real websockets library
    # (1 == OPEN, 3 == CLOSED). This keeps the production code paths intact.
    self.state: int = 1

  def __aiter__(self):
    return self

  async def __anext__(self):
    if self._closed:
      raise StopAsyncIteration
    if not self._messages:
      # Wait a tick to simulate idle connection
      await asyncio.sleep(0)
      raise StopAsyncIteration
    return self._messages.pop(0)

  async def send(self, data: Any) -> None:
    self.sent.append(data)

  async def close(self, code: int = 1000, reason: str = "") -> None:
    if self._closed:
      return
    self._closed = True
    self.close_calls.append((code, reason))
    self.close_code = code
    self.close_reason = reason
    self.state = 3
    self._closed_event.set()

  async def recv(self) -> Any:
    while not self._messages and not self._closed:
      await asyncio.sleep(0)
    if self._messages:
      return self._messages.pop(0)
    raise asyncio.CancelledError

  async def wait_closed(self) -> None:
    await self._closed_event.wait()


class PartialOptions(TypedDict):
  base_url: str
  retry: WebSocketRetryOptions
  timeout: float


def partial_options(
  retry: WebSocketRetryOptions | None = None,
  timeout: float = 1,
) -> PartialOptions:
  if retry is None:
    retry = WebSocketRetryOptions()
  return {
    "base_url": "ws://localhost:8080",
    "retry": WebSocketRetryOptions(
      max_attempts_per_connection=retry.max_attempts_per_connection,
      delay=retry.delay,
      max_connections=retry.max_connections,
      close_codes=retry.close_codes,
    ),
    "timeout": timeout,
  }


def test_connect_and_message(monkeypatch):
  fake = FakeWS(messages=["hello"])

  async def fake_connect(url, open_timeout=None):  # noqa: ARG001
    return fake

  import gladiaio_sdk.network.async_websocket_client as ws_client_mod

  monkeypatch.setattr(ws_client_mod._ws_client, "connect", fake_connect)

  async def main():
    client = AsyncWebSocketClient(**partial_options())
    session = client.create_session("ws://localhost:8080")

    events = {"open": [], "msg": []}
    session.onopen = lambda payload: events["open"].append(payload)
    session.onmessage = lambda payload: events["msg"].append(payload)

    await asyncio.sleep(0.02)
    await asyncio.sleep(0.02)

    assert session.ready_state == WS_STATES.OPEN
    assert events["open"] == [{"connection": 1, "attempt": 1}]
    assert events["msg"] == [{"data": "hello"}]

  run(main())


def test_send_when_open(monkeypatch):
  fake = FakeWS()

  async def fake_connect(url, open_timeout=None):  # noqa: ARG001
    return fake

  import gladiaio_sdk.network.async_websocket_client as ws_client_mod

  monkeypatch.setattr(ws_client_mod._ws_client, "connect", fake_connect)

  async def main():
    client = AsyncWebSocketClient(
      **partial_options(retry=WebSocketRetryOptions(max_attempts_per_connection=1))
    )
    session = client.create_session("ws://localhost:8080")
    await asyncio.sleep(0.02)
    assert session.ready_state == WS_STATES.OPEN
    session.send("payload")
    await asyncio.sleep(0)
    assert fake.sent == ["payload"]

  run(main())


def test_send_when_not_open(monkeypatch):
  fake = FakeWS()

  async def fake_connect(url, open_timeout=None):  # noqa: ARG001
    return fake

  import gladiaio_sdk.network.async_websocket_client as ws_client_mod

  monkeypatch.setattr(ws_client_mod._ws_client, "connect", fake_connect)

  async def main():
    client = AsyncWebSocketClient(**partial_options())
    session = client.create_session("ws://localhost:8080")
    assert session.ready_state == WS_STATES.CONNECTING
    with pytest.raises(RuntimeError):
      session.send("data")

  run(main())


def test_close_manually(monkeypatch):
  fake = FakeWS()

  async def fake_connect(url, open_timeout=None):  # noqa: ARG001
    return fake

  import gladiaio_sdk.network.async_websocket_client as ws_client_mod

  monkeypatch.setattr(ws_client_mod._ws_client, "connect", fake_connect)

  async def main():
    client = AsyncWebSocketClient(**partial_options())
    session = client.create_session("ws://localhost:8080")
    events = {"close": []}
    session.onclose = lambda payload: events["close"].append(payload)
    await asyncio.sleep(0.05)
    session.close(1000)
    await asyncio.sleep(0.05)
    assert (fake.close_calls[-1][0],) == (1000,)
    assert session.ready_state in (WS_STATES.CLOSING, WS_STATES.CLOSED)

  run(main())


def test_timeout(monkeypatch):
  fake = FakeWS()

  async def fake_connect(url, open_timeout=None):  # noqa: ARG001
    await asyncio.sleep(0.2)
    return fake

  import gladiaio_sdk.network.async_websocket_client as ws_client_mod

  monkeypatch.setattr(ws_client_mod._ws_client, "connect", fake_connect)

  async def main():
    client = AsyncWebSocketClient(**partial_options(timeout=0.05))
    session = client.create_session("ws://localhost:8080")
    events = {"close": []}
    session.onclose = lambda payload: events["close"].append(payload)
    await asyncio.sleep(0.3)
    assert events["close"] and events["close"][0] == {
      "code": 3008,
      "reason": "WebSocket connection timeout",
    }
    assert session.ready_state == WS_STATES.CLOSED

  run(main())
