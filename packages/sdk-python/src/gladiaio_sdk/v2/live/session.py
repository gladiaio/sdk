"""live v2 session implementation."""

from __future__ import annotations

import contextlib
import dataclasses
import json
import threading
import time
from collections.abc import Callable
from typing import Any, Literal, final, overload

from pyee import EventEmitter

from gladiaio_sdk.v2.live.types import (
  LiveV2ConnectedMessage,
  LiveV2ConnectingMessage,
  LiveV2EndedMessage,
  LiveV2EndingMessage,
)

from ...network import (
  WS_STATES,
  HttpClient,
  WebSocketClient,
  WebSocketSession,
)
from .generated_types import (
  LiveV2InitRequest,
  LiveV2InitResponse,
  LiveV2MessagesConfig,
  LiveV2StartSessionMessage,
  LiveV2WebSocketMessage,
  create_live_v2_web_socket_message_from_json,
)

EventCallback = Callable[..., Any]


LiveV2SessionStatus = Literal["starting", "started", "connecting", "connected", "ending", "ended"]


@final
class LiveV2Session:
  """Live V2 session.

  Events:
  - started(LiveV2InitResponse)
  - connecting(LiveV2ConnectingMessage)
  - connected(LiveV2ConnectedMessage)
  - ending(LiveV2EndingMessage)
  - ended(LiveV2EndedMessage)
  - message(LiveV2WebSocketMessage)
  - error(Exception)
  """

  def __init__(
    self,
    *,
    options: LiveV2InitRequest,
    http_client: HttpClient,
    ws_client: WebSocketClient,
  ) -> None:
    self._options = options
    self._http_client = http_client
    self._ws_client = ws_client

    self._event_emitter = EventEmitter()
    self._status: LiveV2SessionStatus = "starting"
    self._init_session_response: LiveV2InitResponse | None = None

    self._ws: WebSocketSession | None = None

    self._audio_buffer: bytes = bytes([])
    self._bytes_sent = 0
    self._state_lock = threading.Lock()
    self._ws_stop = threading.Event()
    self._ready_event = threading.Event()
    self._ws_thread: threading.Thread | None = None
    self._pending_stop = False

    # Start lifecycle in background thread (HTTP init -> WS connect -> pump)
    self._ws_thread = threading.Thread(
      target=self._lifecycle_worker,
      name="live-v2-ws",
      daemon=True,
    )
    self._ws_thread.start()

  @property
  def session_id(self) -> str | None:
    return self._init_session_response.id if self._init_session_response else None

  @property
  def status(self) -> LiveV2SessionStatus:
    return self._status

  # Audio API
  def send_audio(self, audio: bytes) -> None:
    if self._status in ("ending", "ended"):
      return
    with self._state_lock:
      self._audio_buffer += audio
      ws = self._ws
      is_open = bool(ws and ws.ready_state == WS_STATES.OPEN)
    if is_open and ws:
      with contextlib.suppress(Exception):
        ws.send(audio)

  def stop_recording(self) -> None:
    if self._status in ("ending", "ended"):
      return
    self._status = "ending"

    _ = self._event_emitter.emit("ending", LiveV2EndingMessage(code=1000))
    with self._state_lock:
      ws = self._ws
      is_open = bool(ws and ws.ready_state == WS_STATES.OPEN)
      if is_open and ws:
        with contextlib.suppress(Exception):
          ws.send(json.dumps({"type": "stop_recording"}))
        self._pending_stop = False
      else:
        self._pending_stop = True

  def end_session(self) -> None:
    self._do_destroy(1000, "Session ended by user")

  # Internals
  def _init_session(self) -> LiveV2InitResponse:
    try:
      # Force acknowledgments for resume logic
      msg_cfg = self._options.messages_config
      if msg_cfg:
        msg_cfg = dataclasses.replace(msg_cfg, receive_acknowledgments=True)
      else:
        msg_cfg = LiveV2MessagesConfig(
          receive_acknowledgments=True,
        )
      options = dataclasses.replace(self._options, messages_config=msg_cfg)

      resp = self._http_client.post("/v2/live", json=options.to_dict())
      return LiveV2InitResponse.from_json(resp.content)
    except Exception as err:
      _ = self._event_emitter.emit("error", err)
      self._do_destroy(1006, "Couldn't start a new session")
      raise err

  def _start_session(self) -> None:
    try:
      session = self._init_session_response
      if not session:
        return

      if self._status == "starting":
        self._status = "started"
        _ = self._event_emitter.emit("started", session)

      if self._options.messages_config and self._options.messages_config.receive_lifecycle_events:
        start_msg: LiveV2StartSessionMessage = LiveV2StartSessionMessage(
          type="start_session",
          session_id=session.id,
          created_at=session.created_at,
        )
        _ = self._event_emitter.emit("message", start_msg)

      self._connect_ws(session.url)
    except Exception as err:
      _ = self._event_emitter.emit("error", err)
      self._do_destroy(1006, "Couldn't start a new session")

  def _connect_ws(self, ws_url: str) -> None:
    ws = self._ws_client.create_session(ws_url)
    self._ws = ws

    def _on_connecting(info: dict[str, Any]) -> None:
      self._status = "connecting"
      attempt = int(info.get("attempt", 1))
      _ = self._event_emitter.emit("connecting", LiveV2ConnectingMessage(attempt=attempt))

    def _on_open(info: dict[str, Any]) -> None:
      # Flush any buffered audio through the worker queue
      with self._state_lock:
        buffered = self._audio_buffer
        pending_stop = self._pending_stop
      if buffered and len(buffered):
        with contextlib.suppress(Exception):
          ws.send(buffered)
      if pending_stop:
        with self._state_lock:
          self._pending_stop = False
        with contextlib.suppress(Exception):
          ws.send(json.dumps({"type": "stop_recording"}))

      if self._status == "ending":
        # Stop message already enqueued above if needed
        return

      self._status = "connected"
      attempt = int(info.get("attempt", 1))
      _ = self._event_emitter.emit("connected", LiveV2ConnectedMessage(attempt=attempt))
      self._ready_event.set()

    def _on_message(evt: dict[str, Any]) -> None:
      raw = evt.get("data")
      try:
        text = raw.decode("utf-8") if isinstance(raw, (bytes, bytearray)) else str(raw)
        message = create_live_v2_web_socket_message_from_json(text)
      except Exception as parse_err:
        _ = self._event_emitter.emit("error", parse_err)
        return

      if (
        not self._options.messages_config
        or self._options.messages_config.receive_acknowledgments
        or not hasattr(message, "acknowledged")
      ):
        _ = self._event_emitter.emit("message", message)

      if getattr(message, "type", None) == "audio_chunk":
        data = getattr(message, "data", None)
        if getattr(message, "acknowledged", False) and data:
          with self._state_lock:
            byte_end = int((data.byte_range)[1])
            self._audio_buffer = self._audio_buffer[byte_end - self._bytes_sent :]
            self._bytes_sent = byte_end

    def _on_error(err: Exception) -> None:
      _ = self._event_emitter.emit("error", err)

    def _on_close(evt: dict[str, Any]) -> None:
      code = int(evt.get("code", 1000) or 1000)
      reason = evt.get("reason")
      self._ws_stop.set()
      self._do_destroy(code, reason)

    ws.onconnecting = _on_connecting
    ws.onopen = _on_open
    ws.onmessage = _on_message
    ws.onerror = _on_error
    ws.onclose = _on_close
    # Start background receive/retry loop
    with contextlib.suppress(Exception):
      ws.start()

  def _lifecycle_worker(self) -> None:
    try:
      # 1) HTTP init
      self._init_session_response = self._init_session()
      # 2) Emit started and connect WS
      self._start_session()
      # 3) Keep thread alive until stop/end to let join() wait for session end
      while not self._ws_stop.is_set() and self._status != "ended":
        time.sleep(0.05)
    except Exception as err:
      _ = self._event_emitter.emit("error", err)
      self._do_destroy(1006, "Worker aborted due to error")
    finally:
      # Nothing to cleanup here; _do_destroy handles ws closure and listeners
      pass

  def _do_destroy(self, code: int = 1006, reason: str | None = None) -> None:
    if self._status == "ended":
      return

    # Transition to ending, then ended
    if self._status != "ending":
      self._status = "ending"
      _ = self._event_emitter.emit("ending", LiveV2EndingMessage(code=code, reason=reason))

    self._status = "ended"
    _ = self._event_emitter.emit("ended", LiveV2EndedMessage(code=code, reason=reason))
    # Signal worker to stop
    self._ws_stop.set()
    # Close ws
    ws = self._ws
    self._ws = None
    if ws:
      with contextlib.suppress(Exception):
        ws.close(code=1001, reason="Aborted")

    # Clear buffers & listeners
    self._audio_buffer = bytes([])
    self._event_emitter.remove_all_listeners()

  # Threading helpers
  def wait_until_ready(self, timeout: float | None = None) -> bool:
    """Block until WebSocket is connected (ready), or timeout elapses.

    Returns True if ready, False if timeout.
    """
    return self._ready_event.wait(timeout)

  def join(self, timeout: float | None = None) -> bool:
    """Wait for the background worker thread to exit.

    Returns True if the worker is no longer alive after the join attempt.
    """
    t = self._ws_thread
    if not t:
      return True
    if t is threading.current_thread():
      # Avoid deadlocking by joining self
      return not t.is_alive()
    t.join(timeout)
    return not t.is_alive()

  # Events

  @overload
  def on(self, event: Literal["started"], cb: Callable[[LiveV2InitResponse], None]) -> None:
    pass

  @overload
  def on(self, event: Literal["started"]) -> Callable[[Callable[[LiveV2InitResponse], None]], None]:
    pass

  @overload
  def on(self, event: Literal["connecting"], cb: Callable[[LiveV2ConnectingMessage], None]) -> None:
    pass

  @overload
  def on(
    self, event: Literal["connecting"]
  ) -> Callable[[Callable[[LiveV2ConnectingMessage], None]], None]:
    pass

  @overload
  def on(self, event: Literal["connected"], cb: Callable[[LiveV2ConnectedMessage], None]) -> None:
    pass

  @overload
  def on(
    self, event: Literal["connected"]
  ) -> Callable[[Callable[[LiveV2ConnectedMessage], None]], None]:
    pass

  @overload
  def on(self, event: Literal["ending"], cb: Callable[[LiveV2EndingMessage], None]) -> None:
    pass

  @overload
  def on(self, event: Literal["ending"]) -> Callable[[Callable[[LiveV2EndingMessage], None]], None]:
    pass

  @overload
  def on(self, event: Literal["ended"], cb: Callable[[LiveV2EndedMessage], None]) -> None:
    pass

  @overload
  def on(self, event: Literal["ended"]) -> Callable[[Callable[[LiveV2EndedMessage], None]], None]:
    pass

  @overload
  def on(self, event: Literal["message"], cb: Callable[[LiveV2WebSocketMessage], None]) -> None:
    pass

  @overload
  def on(
    self, event: Literal["message"]
  ) -> Callable[[Callable[[LiveV2WebSocketMessage], None]], None]:
    pass

  @overload
  def on(self, event: Literal["error"], cb: Callable[[Exception], None]) -> None:
    pass

  @overload
  def on(self, event: Literal["error"]) -> Callable[[Callable[[Exception], None]], None]:
    pass

  def on(
    self,
    event: Literal["started", "connecting", "connected", "ending", "ended", "message", "error"],
    cb: EventCallback | None = None,
  ) -> None | Callable[..., None]:
    if cb is not None:
      _ = self._event_emitter.add_listener(event, cb)
      return None

    return self._event_emitter.listens_to(event)

  @overload
  def once(self, event: Literal["started"], cb: Callable[[LiveV2InitResponse], None]) -> None:
    pass

  @overload
  def once(
    self, event: Literal["started"]
  ) -> Callable[[Callable[[LiveV2InitResponse], None]], None]:
    pass

  @overload
  def once(
    self, event: Literal["connecting"], cb: Callable[[LiveV2ConnectingMessage], None]
  ) -> None:
    pass

  @overload
  def once(
    self, event: Literal["connecting"]
  ) -> Callable[[Callable[[LiveV2ConnectingMessage], None]], None]:
    pass

  @overload
  def once(self, event: Literal["connected"], cb: Callable[[LiveV2ConnectedMessage], None]) -> None:
    pass

  @overload
  def once(
    self, event: Literal["connected"]
  ) -> Callable[[Callable[[LiveV2ConnectedMessage], None]], None]:
    pass

  @overload
  def once(self, event: Literal["ending"], cb: Callable[[LiveV2EndingMessage], None]) -> None:
    pass

  @overload
  def once(
    self, event: Literal["ending"]
  ) -> Callable[[Callable[[LiveV2EndingMessage], None]], None]:
    pass

  @overload
  def once(self, event: Literal["ended"], cb: Callable[[LiveV2EndedMessage], None]) -> None:
    pass

  @overload
  def once(self, event: Literal["ended"]) -> Callable[[Callable[[LiveV2EndedMessage], None]], None]:
    pass

  @overload
  def once(self, event: Literal["message"], cb: Callable[[LiveV2WebSocketMessage], None]) -> None:
    pass

  @overload
  def once(
    self, event: Literal["message"]
  ) -> Callable[[Callable[[LiveV2WebSocketMessage], None]], None]:
    pass

  @overload
  def once(self, event: Literal["error"], cb: Callable[[Exception], None]) -> None:
    pass

  @overload
  def once(self, event: Literal["error"]) -> Callable[[Callable[[Exception], None]], None]:
    pass

  def once(
    self,
    event: Literal["started", "connecting", "connected", "ending", "ended", "message", "error"],
    cb: EventCallback | None = None,
  ) -> None | Callable[..., None]:
    if cb is not None:
      _ = self._event_emitter.once(event, cb)
      return None

    return self._event_emitter.once(event)

  @overload
  def off(self, event: Literal["started"], cb: Callable[[LiveV2InitResponse], None] | None) -> None:
    pass

  @overload
  def off(
    self, event: Literal["connecting"], cb: Callable[[LiveV2ConnectingMessage], None] | None
  ) -> None:
    pass

  @overload
  def off(
    self, event: Literal["connected"], cb: Callable[[LiveV2ConnectedMessage], None] | None
  ) -> None:
    pass

  @overload
  def off(self, event: Literal["ending"], cb: Callable[[LiveV2EndingMessage], None] | None) -> None:
    pass

  @overload
  def off(self, event: Literal["ended"], cb: Callable[[LiveV2EndedMessage], None] | None) -> None:
    pass

  @overload
  def off(
    self, event: Literal["message"], cb: Callable[[LiveV2WebSocketMessage], None] | None
  ) -> None:
    pass

  @overload
  def off(self, event: Literal["error"], cb: Callable[[Exception], None] | None) -> None:
    pass

  def off(
    self,
    event: Literal["started", "connecting", "connected", "ending", "ended", "message", "error"],
    cb: EventCallback | None = None,
  ) -> None:
    if cb is None:
      self.remove_all_listeners(event)
      return

    self._event_emitter.remove_listener(event, cb)

  @overload
  def add_listener(
    self, event: Literal["started"], cb: Callable[[LiveV2InitResponse], None]
  ) -> None:
    pass

  @overload
  def add_listener(
    self, event: Literal["connecting"], cb: Callable[[LiveV2ConnectingMessage], None]
  ) -> None:
    pass

  @overload
  def add_listener(
    self, event: Literal["connected"], cb: Callable[[LiveV2ConnectedMessage], None]
  ) -> None:
    pass

  @overload
  def add_listener(
    self, event: Literal["ending"], cb: Callable[[LiveV2EndingMessage], None]
  ) -> None:
    pass

  @overload
  def add_listener(self, event: Literal["ended"], cb: Callable[[LiveV2EndedMessage], None]) -> None:
    pass

  @overload
  def add_listener(
    self, event: Literal["message"], cb: Callable[[LiveV2WebSocketMessage], None]
  ) -> None:
    pass

  @overload
  def add_listener(self, event: Literal["error"], cb: Callable[[Exception], None]) -> None:
    pass

  def add_listener(self, event: Any, cb: Any) -> None:
    self._event_emitter.add_listener(event, cb)

  @overload
  def remove_listener(
    self, event: Literal["started"], cb: Callable[[LiveV2InitResponse], None] | None
  ) -> None:
    pass

  @overload
  def remove_listener(
    self, event: Literal["connecting"], cb: Callable[[LiveV2ConnectingMessage], None] | None
  ) -> None:
    pass

  @overload
  def remove_listener(
    self, event: Literal["connected"], cb: Callable[[LiveV2ConnectedMessage], None] | None
  ) -> None:
    pass

  @overload
  def remove_listener(
    self, event: Literal["ending"], cb: Callable[[LiveV2EndingMessage], None] | None
  ) -> None:
    pass

  @overload
  def remove_listener(
    self, event: Literal["ended"], cb: Callable[[LiveV2EndedMessage], None] | None
  ) -> None:
    pass

  @overload
  def remove_listener(
    self, event: Literal["message"], cb: Callable[[LiveV2WebSocketMessage], None] | None
  ) -> None:
    pass

  @overload
  def remove_listener(
    self, event: Literal["error"], cb: Callable[[Exception], None] | None
  ) -> None:
    pass

  def remove_listener(
    self,
    event: Literal["started", "connecting", "connected", "ending", "ended", "message", "error"],
    cb: EventCallback | None = None,
  ) -> None:
    if cb is None:
      self.remove_all_listeners(event)
      return
    self._event_emitter.remove_listener(event, cb)

  def remove_all_listeners(
    self,
    event: Literal["started", "connecting", "connected", "ending", "ended", "message", "error"]
    | None = None,
  ) -> None:
    self._event_emitter.remove_all_listeners(event)
