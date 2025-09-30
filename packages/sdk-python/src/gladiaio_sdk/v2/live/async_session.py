"""Async live v2 session implementation."""

from __future__ import annotations

import asyncio
import contextlib
import dataclasses
import json
from collections.abc import Callable
from typing import Any, Literal, final, overload

from pyee.asyncio import AsyncIOEventEmitter

from gladiaio_sdk.v2.live.types import (
  LiveV2ConnectedMessage,
  LiveV2ConnectingMessage,
  LiveV2EndedMessage,
  LiveV2EndingMessage,
)

from ...network.async_http_client import AsyncHttpClient
from ...network.async_websocket_client import (
  WS_STATES,
  AsyncWebSocketClient,
  AsyncWebSocketSession,
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
class LiveV2AsyncSession:
  """Live V2 Async session.

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
    http_client: AsyncHttpClient,
    ws_client: AsyncWebSocketClient,
  ) -> None:
    self._options = options
    self._http_client = http_client
    self._ws_client = ws_client

    self._abort = asyncio.Event()
    self._event_emitter = AsyncIOEventEmitter()
    self._status: LiveV2SessionStatus = "starting"
    self._init_session_response: LiveV2InitResponse | None = None

    self._ws: AsyncWebSocketSession | None = None
    self._connect_ws_task: asyncio.Task[None] | None = None

    self._audio_buffer: bytes = bytes([])
    self._bytes_sent = 0

    # Kick off session creation
    self._init_session_task = asyncio.create_task(self._init_session())
    self._start_session_task = asyncio.create_task(self._start_session())

  # Public API
  async def get_session_id(self) -> str:
    session = await self._init_session_task
    return session.id

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
    self._audio_buffer += audio
    if self._ws and self._ws.ready_state == WS_STATES.OPEN:
      self._ws.send(audio)

  def stop_recording(self) -> None:
    if self._status in ("ending", "ended"):
      return
    self._status = "ending"

    _ = self._event_emitter.emit("ending", LiveV2EndingMessage(code=1000))
    if self._ws and self._ws.ready_state == WS_STATES.OPEN:
      self._ws.send(json.dumps({"type": "stop_recording"}))

  def end_session(self) -> None:
    self._do_destroy(1000, "Session ended by user")

  # Internals
  async def _init_session(self) -> LiveV2InitResponse:
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

      resp = await self._http_client.post("/v2/live", json=options.to_dict())
      return LiveV2InitResponse.from_json(resp.content)
    except Exception as err:
      _ = self._event_emitter.emit("error", err)
      self._do_destroy(1006, "Couldn't start a new session")
      raise err

  async def _start_session(self) -> None:
    try:
      session = await self._init_session_task
      self._init_session_response = session

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

      self._connect_ws_task = asyncio.create_task(self._connect_ws(session.url))
    except Exception as err:
      _ = self._event_emitter.emit("error", err)
      self._do_destroy(1006, "Couldn't start a new session")

  async def _connect_ws(self, ws_url: str) -> None:
    if self._abort.is_set():
      return

    ws = self._ws_client.create_session(ws_url)
    self._ws = ws

    def _on_connecting(info: dict[str, Any]) -> None:
      if self._abort.is_set():
        return

      self._status = "connecting"
      attempt = int(info.get("attempt", 1))
      _ = self._event_emitter.emit("connecting", LiveV2ConnectingMessage(attempt=attempt))

    def _on_open(info: dict[str, Any]) -> None:
      if self._abort.is_set():
        return

      if self._audio_buffer and len(self._audio_buffer):
        ws.send(self._audio_buffer)

      if self._status == "ending":
        ws.send(json.dumps({"type": "stop_recording"}))
        return

      self._status = "connected"
      attempt = int(info.get("attempt", 1))
      _ = self._event_emitter.emit("connected", LiveV2ConnectedMessage(attempt=attempt))

    def _on_message(evt: dict[str, Any]) -> None:
      if self._abort.is_set():
        return

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
          byte_end = int((data.byte_range)[1])
          self._audio_buffer = self._audio_buffer[byte_end - self._bytes_sent :]
          self._bytes_sent = byte_end

    def _on_error(err: Exception) -> None:
      if self._abort.is_set():
        return

      _ = self._event_emitter.emit("error", err)

    def _on_close(evt: dict[str, Any]) -> None:
      if self._abort.is_set():
        return

      code = int(evt.get("code", 1000) or 1000)
      reason = evt.get("reason")
      self._do_destroy(code, reason)

    ws.onconnecting = _on_connecting
    ws.onopen = _on_open
    ws.onmessage = _on_message
    ws.onerror = _on_error
    ws.onclose = _on_close

  def _do_destroy(self, code: int = 1006, reason: str | None = None) -> None:
    if self._status == "ended":
      return

    # Transition to ending, then ended
    if self._status != "ending":
      self._status = "ending"
      _ = self._event_emitter.emit("ending", LiveV2EndingMessage(code=code, reason=reason))

    self._status = "ended"
    _ = self._event_emitter.emit("ended", LiveV2EndedMessage(code=code, reason=reason))

    self._abort.set()

    # Cancel tasks
    for task in (self._connect_ws_task, self._start_session_task, self._init_session_task):
      if task and not task.done():
        _ = task.cancel()

    # Close ws
    ws = self._ws
    self._ws = None
    if ws:
      with contextlib.suppress(Exception):
        ws.close(code=1001, reason="Aborted")

    # Clear buffers & listeners
    self._audio_buffer = bytes([])
    self._event_emitter.remove_all_listeners()

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
