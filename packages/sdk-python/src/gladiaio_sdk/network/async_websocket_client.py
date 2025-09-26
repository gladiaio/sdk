"""Async WebSocket client/session with retry and timeout semantics matching the JS SDK."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from enum import Enum
from typing import Any, final

import websockets

from gladiaio_sdk.client_options import InternalWebSocketRetryOptions


class WS_STATES(Enum):
  CONNECTING = 0
  OPEN = 1
  CLOSING = 2
  CLOSED = 3


def _matches_close(code: int, rules: list[int | tuple[int, int]] | None) -> bool:
  if not rules:
    return False
  for rule in rules:
    if isinstance(rule, tuple):
      start, end = rule
      if start <= code <= end:
        return True
    else:
      if code == rule:
        return True
  return False


@final
class AsyncWebSocketClient:
  def __init__(self, base_url: str, retry: InternalWebSocketRetryOptions, timeout: float) -> None:
    self._base_url = base_url
    self._retry = retry
    self._timeout = timeout

    # Ensure values are non-negative numbers
    self._retry.max_attempts_per_connection = max(0, self._retry.max_attempts_per_connection)
    self._retry.max_connections = max(0, self._retry.max_connections)
    self._timeout = max(0, self._timeout)

  def create_session(self, url: str) -> AsyncWebSocketSession:
    # TODO use base_url
    return AsyncWebSocketSession(url, self._retry, self._timeout, base_url=self._base_url)


@final
class AsyncWebSocketSession:
  onconnecting: Callable[[dict[str, int]], None] | None = None
  onopen: Callable[[dict[str, int]], None] | None = None
  onerror: Callable[[Exception], None] | None = None
  onclose: Callable[[dict[str, Any]], None] | None = None
  onmessage: Callable[[dict[str, Any]], None] | None = None

  _ready_state: WS_STATES = WS_STATES.CONNECTING
  _url: str
  _retry: InternalWebSocketRetryOptions
  _timeout: float
  _ws: websockets.ClientConnection | None = None
  _connection_count: int = 0
  _connection_attempt: int = 0
  _connection_timeout_handle: asyncio.TimerHandle | None = None
  _task: asyncio.Task[None]

  def __init__(
    self, url: str, retry: InternalWebSocketRetryOptions, timeout: float, *, base_url: str
  ) -> None:
    self._url = url
    self._retry = retry
    self._timeout = timeout
    # Create task on the current event loop; if none is running, this schedules
    # the coroutine for when the loop starts (avoids RuntimeError in sync contexts/tests).
    loop = asyncio.get_event_loop()
    self._task = loop.create_task(self._connect())

  @property
  def readyState(self) -> WS_STATES:
    return self._ready_state

  @property
  def url(self) -> str:
    return self._url

  def send(self, data: str | bytes) -> None:
    if self.readyState == WS_STATES.OPEN:
      if not self._ws:
        raise RuntimeError("readyState is open but ws is not initialized")
      _ = asyncio.create_task(self._ws.send(data))
    else:
      raise RuntimeError("WebSocket is not open")

  def close(self, code: int = 1000, reason: str = "") -> None:
    if self.readyState in (WS_STATES.CLOSING, WS_STATES.CLOSED):
      return
    self._clear_connection_timeout()
    self._ready_state = WS_STATES.CLOSING
    if self._ws is not None:
      if getattr(self._ws, "closed", False) is False:
        _ = asyncio.create_task(self._ws.close(code=code))
    else:
      self._on_ws_close(code, reason)

  async def _connect(self, is_retry: bool = False) -> None:
    self._clear_connection_timeout()
    if not is_retry:
      self._connection_count += 1
      self._connection_attempt = 0
    self._connection_attempt += 1
    self._ready_state = WS_STATES.CONNECTING
    if self.onconnecting:
      self.onconnecting(
        {
          "connection": self._connection_count,
          "attempt": self._connection_attempt,
        }
      )

    if self._timeout > 0:
      loop = asyncio.get_running_loop()
      self._connection_timeout_handle = loop.call_later(self._timeout, self._timeout_close)

    async def on_error(err: Exception | None) -> None:
      self._clear_connection_timeout()
      if self._ready_state != WS_STATES.CONNECTING:
        return
      no_retry = (
        self._retry.max_attempts_per_connection > 0
        and self._connection_attempt >= self._retry.max_attempts_per_connection
      )
      if no_retry:
        if self.onerror:
          self.onerror(Exception("WebSocket connection error" if err is None else str(err)))
        self.close(1006, "WebSocket connection error")
        return
      await asyncio.sleep(self._retry.delay(self._connection_attempt))
      if self._ready_state == WS_STATES.CONNECTING:
        await self._connect(True)

    try:
      if self._timeout > 0:
        try:
          ws = await asyncio.wait_for(
            websockets.connect(
              self._url,
              open_timeout=self._timeout,
            ),
            timeout=self._timeout,
          )
        except asyncio.TimeoutError:
          self._timeout_close()
          return
      else:
        ws = await websockets.connect(self._url, open_timeout=None)
    except Exception as e:
      await on_error(e)
      return

    if self._ready_state != WS_STATES.CONNECTING:
      await ws.close(code=1001)
      return

    self._ws = ws
    self._clear_connection_timeout()
    self._ready_state = WS_STATES.OPEN
    if self.onopen:
      self.onopen(
        {
          "connection": self._connection_count,
          "attempt": self._connection_attempt,
        }
      )

    async def reader() -> None:
      try:
        async for msg in ws:
          if self.onmessage:
            self.onmessage({"data": msg})
      except websockets.ConnectionClosed as closed:
        if self._ws is ws:
          self._ws = None
          if (
            self._retry.max_connections > 0
            and self._connection_count >= self._retry.max_connections
          ) or not _matches_close(getattr(closed, "code", 1000) or 1000, self._retry.close_codes):
            self.close(
              getattr(closed, "code", 1000) or 1000,
              getattr(closed, "reason", ""),
            )
            return
          await self._connect(False)
      except Exception:
        if self.onerror:
          self.onerror(Exception("WebSocket error"))
        self.close(1006, "WebSocket error")

    _ = asyncio.create_task(reader())

  def _timeout_close(self) -> None:
    self.close(3008, "WebSocket connection timeout")

  def _on_ws_close(self, code: int = 1000, reason: str = "") -> None:
    self._clear_connection_timeout()
    if self._ready_state != WS_STATES.CLOSED:
      self._ready_state = WS_STATES.CLOSED
      if self.onclose:
        self.onclose({"code": code, "reason": reason})
    self.onconnecting = None
    self.onopen = None
    self.onclose = None
    self.onerror = None
    self.onmessage = None
    self._ws = None

  def _clear_connection_timeout(self) -> None:
    if self._connection_timeout_handle:
      self._connection_timeout_handle.cancel()
      self._connection_timeout_handle = None
