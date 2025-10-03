"""Async WebSocket client/session with retry and timeout semantics matching the JS SDK."""

import threading
import time
from collections.abc import Callable
from typing import Any, final

from websockets import ConnectionClosed
from websockets.sync import client as _ws_client

from gladiaio_sdk.client_options import WebSocketRetryOptions

from .types import WS_STATES


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
class WebSocketSession:
  onconnecting: Callable[[dict[str, int]], None] | None = None
  onopen: Callable[[dict[str, int]], None] | None = None
  onerror: Callable[[Exception], None] | None = None
  onclose: Callable[[dict[str, Any]], None] | None = None
  onmessage: Callable[[dict[str, Any]], None] | None = None

  _ready_state: WS_STATES = WS_STATES.CONNECTING
  _url: str
  _retry: WebSocketRetryOptions
  _timeout: float
  _ws: _ws_client.ClientConnection | None = None
  _connection_count: int = 0
  _connection_attempt: int = 0
  _thread: threading.Thread | None = None
  _stop: threading.Event
  _send_lock: threading.Lock

  def __init__(
    self, url: str, retry: WebSocketRetryOptions, timeout: float, *, base_url: str
  ) -> None:
    self._url = url
    self._retry = retry
    self._timeout = timeout
    self._stop = threading.Event()
    self._send_lock = threading.Lock()

  @property
  def ready_state(self) -> WS_STATES:
    return self._ready_state

  @property
  def url(self) -> str:
    return self._url

  def send(self, data: str | bytes) -> None:
    if self.ready_state == WS_STATES.OPEN:
      if not self._ws:
        raise RuntimeError("readyState is open but ws is not initialized")
      with self._send_lock:
        self._ws.send(data)
    else:
      raise RuntimeError("WebSocket is not open")

  def close(self, code: int = 1000, reason: str = "") -> None:
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

    def on_error(err: Exception | None) -> None:
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
      time.sleep(self._retry.delay(self._connection_attempt))
      if self._ready_state == WS_STATES.CONNECTING:
        self._connect(True)

    try:
      if self._timeout > 0:
        ws = _ws_client.connect(
          self._url,
          open_timeout=self._timeout,
        )
      else:
        ws = _ws_client.connect(self._url, open_timeout=None)
    except Exception as e:
      on_error(e)
      return

    if self._ready_state != WS_STATES.CONNECTING:
      ws.close(code=1001)
      return

    self._ws = ws
    self._ready_state = WS_STATES.OPEN
    if self.onopen:
      self.onopen(
        {
          "connection": self._connection_count,
          "attempt": self._connection_attempt,
        }
      )

    close_code: int = 1006
    close_reason: str = "Abnormal closure"
    try:
      while not self._stop.is_set():
        msg = ws.recv()
        if self.onmessage:
          self.onmessage({"data": msg})
    except ConnectionClosed as e:
      close_code = e.code
      close_reason = e.reason

    if self._ws is not ws:
      return

    self._ws = None

    if self.ready_state == WS_STATES.CLOSING:
      self._on_ws_close(close_code, close_reason)
      return

    if (
      self._retry.max_connections > 0 and self._connection_count >= self._retry.max_connections
    ) or not _matches_close(close_code, self._retry.close_codes):
      self.close(
        close_code,
        close_reason,
      )
      return

    if not self._stop.is_set():
      self._connect(False)

  def _on_ws_close(self, code: int = 1000, reason: str = "") -> None:
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


@final
class WebSocketClient:
  def __init__(self, base_url: str, retry: WebSocketRetryOptions, timeout: float) -> None:
    self._base_url = base_url
    self._retry = retry
    self._timeout = timeout

  def create_session(self, url: str) -> WebSocketSession:
    # TODO use base_url
    return WebSocketSession(url, self._retry, self._timeout, base_url=self._base_url)
