"""Async WebSocket client/session with retry and timeout semantics matching the JS SDK."""

import asyncio
import threading
import time
from abc import ABC, abstractmethod
from collections.abc import Callable
from contextlib import suppress
from enum import Enum
from typing import final

from typing_extensions import override
from websockets import ConnectionClosed
from websockets.asyncio import client as async_ws_client
from websockets.frames import CloseCode
from websockets.sync import client as sync_ws_client

from gladiaio_sdk.client_options import WebSocketRetryOptions
from gladiaio_sdk.network.helper import build_url, matches_status


class WS_STATES(Enum):
  CONNECTING = 0
  OPEN = 1
  CLOSING = 2
  CLOSED = 3


class AbstractWebSocketSession(ABC):
  onconnecting: Callable[[dict[str, int]], None] | None = None
  onopen: Callable[[dict[str, int]], None] | None = None
  onerror: Callable[[Exception], None] | None = None
  onclose: Callable[[dict[str, object]], None] | None = None
  onmessage: Callable[[dict[str, object]], None] | None = None

  _ready_state: WS_STATES = WS_STATES.CONNECTING
  _url: str
  _retry: WebSocketRetryOptions
  _timeout: float
  _connection_count: int
  _connection_attempt: int

  def __init__(self, url: str, retry: WebSocketRetryOptions, timeout: float) -> None:
    self._url = url
    self._retry = retry
    self._timeout = timeout
    self._ready_state = WS_STATES.CONNECTING
    self._connection_count = 0
    self._connection_attempt = 0

  @property
  def ready_state(self) -> WS_STATES:
    return self._ready_state

  @property
  def url(self) -> str:
    return self._url

  @abstractmethod
  def close(self, code: int = CloseCode.NORMAL_CLOSURE, reason: str = "") -> None: ...

  def _begin_connect(self, is_retry: bool) -> None:
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

  def _emit_open(self) -> None:
    self._ready_state = WS_STATES.OPEN
    if self.onopen:
      self.onopen(
        {
          "connection": self._connection_count,
          "attempt": self._connection_attempt,
        }
      )

  def _is_max_connections_reached(self) -> bool:
    return self._retry.max_connections > 0 and self._connection_count >= self._retry.max_connections

  def _is_close_retryable(self, close_code: int) -> bool:
    return matches_status(close_code, self._retry.close_codes)

  def _handle_error(self, err: Exception | None) -> bool:
    if self._ready_state != WS_STATES.CONNECTING:
      return False
    no_retry = (
      isinstance(err, (asyncio.TimeoutError, TimeoutError))
      or self._retry.max_attempts_per_connection > 0
      and self._connection_attempt >= self._retry.max_attempts_per_connection
    )
    if no_retry:
      if self.onerror:
        self.onerror(Exception("WebSocket connection error" if err is None else str(err)))
      close_code = CloseCode.ABNORMAL_CLOSURE
      close_reason = "WebSocket connection error"
      if isinstance(err, (asyncio.TimeoutError, TimeoutError)):
        close_code = 3008
        close_reason = "WebSocket connection timeout"
      self.close(close_code, close_reason)
      return False

    return True

  def _on_ws_close(self, code: int = CloseCode.NORMAL_CLOSURE, reason: str = "") -> None:
    if self._ready_state != WS_STATES.CLOSED:
      self._ready_state = WS_STATES.CLOSED
      if self.onclose:
        self.onclose({"code": code, "reason": reason})

    # Drop handlers to avoid leaks
    self.onconnecting = None
    self.onopen = None
    self.onclose = None
    self.onerror = None
    self.onmessage = None

    # Best-effort: clear ws reference if present on subclass
    with suppress(Exception):
      if "_ws" in self.__dict__:
        self.__dict__["_ws"] = None


@final
class AsyncWebSocketSession(AbstractWebSocketSession):
  _ws: async_ws_client.ClientConnection | None = None
  _connection_timeout_handle: asyncio.TimerHandle | None = None
  _task: asyncio.Task[None]

  def __init__(self, url: str, retry: WebSocketRetryOptions, timeout: float) -> None:
    super().__init__(url, retry, timeout)
    # Create task on the current event loop; if none is running, this schedules
    # the coroutine for when the loop starts (avoids RuntimeError in sync contexts/tests).
    loop = asyncio.get_event_loop()
    self._task = loop.create_task(self._connect())

  def send(self, data: str | bytes) -> None:
    if self.ready_state == WS_STATES.OPEN:
      if not self._ws:
        raise RuntimeError("readyState is open but ws is not initialized")
      _ = asyncio.create_task(self._ws.send(data))
    else:
      raise RuntimeError("WebSocket is not open")

  @override
  def close(self, code: int = CloseCode.NORMAL_CLOSURE, reason: str = "") -> None:
    if self.ready_state in (WS_STATES.CLOSING, WS_STATES.CLOSED):
      return

    self._ready_state = WS_STATES.CLOSING

    if self._ws and self._ws.state == 1:
      _ = asyncio.create_task(self._ws.close(code=code))
    else:
      self._on_ws_close(code, reason)

  async def _connect(self, is_retry: bool = False) -> None:
    self._begin_connect(is_retry)

    async def on_error(err: Exception | None) -> None:
      if not self._handle_error(err):
        return
      await asyncio.sleep(self._retry.delay(self._connection_attempt))
      if self._ready_state == WS_STATES.CONNECTING:
        await self._connect(True)

    try:
      ws = await async_ws_client.connect(
        self._url, open_timeout=self._timeout if self._timeout > 0 else None
      )
    except Exception as e:
      await on_error(e)
      return

    if self._ready_state != WS_STATES.CONNECTING:
      await ws.close(code=CloseCode.GOING_AWAY)
      return

    self._ws = ws
    self._emit_open()

    async def reader() -> None:
      try:
        while True:
          msg = await ws.recv()
          if self.onmessage:
            self.onmessage({"data": msg})
      except Exception:
        pass

    reader_task = asyncio.create_task(reader())

    error: Exception | None = None
    try:
      await ws.wait_closed()
    except Exception as e:
      error = e
    finally:
      _ = reader_task.cancel()
      with suppress(asyncio.CancelledError):
        await reader_task

    if self._ws is not ws:
      return

    self._ws = None

    close_code = ws.close_code
    close_reason = ws.close_reason or ""
    if close_code is None:
      if error is None:
        close_code = CloseCode.NORMAL_CLOSURE
      else:
        close_code = CloseCode.ABNORMAL_CLOSURE
        close_reason = "WebSocket connection error"

    if self.ready_state == WS_STATES.CLOSING:
      self._on_ws_close(close_code, close_reason)
      return

    if (
      self._retry.max_connections > 0 and self._connection_count >= self._retry.max_connections
    ) or not matches_status(close_code, self._retry.close_codes):
      self.close(
        close_code,
        close_reason,
      )
      return

    _ = asyncio.create_task(self._connect(False))


@final
class WebSocketSession(AbstractWebSocketSession):
  _ws: sync_ws_client.ClientConnection | None = None
  _thread: threading.Thread | None = None
  _stop: threading.Event
  _send_lock: threading.Lock

  def __init__(self, url: str, retry: WebSocketRetryOptions, timeout: float) -> None:
    super().__init__(url, retry, timeout)
    self._stop = threading.Event()
    self._send_lock = threading.Lock()

  def send(self, data: str | bytes) -> None:
    if self.ready_state == WS_STATES.OPEN:
      if not self._ws:
        raise RuntimeError("readyState is open but ws is not initialized")
      with self._send_lock:
        self._ws.send(data)
    else:
      raise RuntimeError("WebSocket is not open")

  @override
  def close(self, code: int = CloseCode.NORMAL_CLOSURE, reason: str = "") -> None:
    if self.ready_state in (WS_STATES.CLOSING, WS_STATES.CLOSED):
      return

    self._ready_state = WS_STATES.CLOSING
    self._stop.set()

    if self._ws and self._ws.state == 1:
      self._ws.close(code=code)
    else:
      self._on_ws_close(code, reason)

  def start(self) -> None:
    """Start the background receive/reconnect loop in a dedicated thread."""
    if self._thread and self._thread.is_alive():
      return
    t = threading.Thread(target=self._connect, name="ws-recv", daemon=True)
    self._thread = t
    t.start()

  def _connect(self, is_retry: bool = False) -> None:
    self._begin_connect(is_retry)

    def on_error(err: Exception | None) -> None:
      if not self._handle_error(err):
        return
      time.sleep(self._retry.delay(self._connection_attempt))
      if self._ready_state == WS_STATES.CONNECTING:
        self._connect(True)

    try:
      ws = sync_ws_client.connect(
        self._url, open_timeout=self._timeout if self._timeout > 0 else None
      )
    except Exception as e:
      on_error(e)
      return

    if self._ready_state != WS_STATES.CONNECTING:
      ws.close(code=CloseCode.GOING_AWAY)
      return

    self._ws = ws
    self._emit_open()

    close_code: int = CloseCode.ABNORMAL_CLOSURE
    close_reason: str = "Abnormal closure"
    try:
      while not self._stop.is_set():
        msg = ws.recv()
        if self.onmessage:
          self.onmessage({"data": msg})
    except ConnectionClosed as e:
      if e.rcvd:
        close_code = e.rcvd.code
        close_reason = e.rcvd.reason

    if self._ws is not ws:
      return

    self._ws = None

    if self.ready_state == WS_STATES.CLOSING:
      self._on_ws_close(close_code, close_reason)
      return

    if (
      self._retry.max_connections > 0 and self._connection_count >= self._retry.max_connections
    ) or not matches_status(close_code, self._retry.close_codes):
      self.close(
        close_code,
        close_reason,
      )
      return

    if not self._stop.is_set():
      self._connect(False)


@final
class WebSocketClient:
  def __init__(self, base_url: str, retry: WebSocketRetryOptions, timeout: float) -> None:
    self._base_url = base_url
    self._retry = retry
    self._timeout = timeout

  def create_session(self, url: str) -> WebSocketSession:
    return WebSocketSession(build_url(self._base_url, url), self._retry, self._timeout)

  def create_async_session(self, url: str) -> AsyncWebSocketSession:
    return AsyncWebSocketSession(build_url(self._base_url, url), self._retry, self._timeout)
