"""Shared helpers for the Live V2 sync and async session implementations."""

from __future__ import annotations

import dataclasses
from collections.abc import Callable
from typing import Any, Literal, Protocol, TypeVar, overload
from urllib.parse import urlencode

from gladiaio_sdk.v2.live.types import (
  LiveV2ConnectedMessage,
  LiveV2ConnectingMessage,
  LiveV2EndedMessage,
  LiveV2EndingMessage,
  LiveV2SessionStatus,
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
Handler = TypeVar("Handler", bound=Callable[..., Any])

# The server rejects WebSocket frames larger than 1 MiB with CloseCode 1009.
_MAX_RESUME_CHUNK_BYTES = 512 * 1024  # 512 KiB


class _EventEmitter(Protocol):
  """Structural typing for pyee EventEmitter / AsyncIOEventEmitter."""

  def add_listener(self, event: str, f: Handler) -> Handler: ...

  def remove_listener(self, event: str, f: Callable[..., Any]) -> None: ...

  def remove_all_listeners(self, event: str | None = None) -> None: ...

  def listens_to(self, event: str) -> Callable[[Handler], Handler]: ...

  def once(self, event: str, f: Callable[..., Any] | None = None) -> Callable[..., Any]: ...

  def emit(self, event: str, *args: Any, **kwargs: Any) -> bool: ...


def send_audio_in_chunks(ws: Any, audio: bytes) -> None:
  """Re-send *audio* over *ws* in chunks to stay below the server 1 MiB frame limit."""
  for i in range(0, len(audio), _MAX_RESUME_CHUNK_BYTES):
    ws.send(audio[i : i + _MAX_RESUME_CHUNK_BYTES])


def with_acknowledgments_enabled(options: LiveV2InitRequest) -> LiveV2InitRequest:
  """Return init options with acknowledgments forced on for resume logic."""
  msg_cfg = options.messages_config
  if msg_cfg:
    msg_cfg = dataclasses.replace(msg_cfg, receive_acknowledgments=True)
  else:
    msg_cfg = LiveV2MessagesConfig(receive_acknowledgments=True)
  return dataclasses.replace(options, messages_config=msg_cfg)


def build_live_init_url(region: str | None = None) -> str:
  """Build POST /v2/live URL. ``region`` is only supported on this route."""
  if region:
    return f"/v2/live?{urlencode({'region': region})}"
  return "/v2/live"


def parse_ws_message(raw: Any) -> LiveV2WebSocketMessage:
  text = raw.decode("utf-8") if isinstance(raw, (bytes, bytearray)) else str(raw)
  return create_live_v2_web_socket_message_from_json(text)


def should_emit_ws_message(
  message: LiveV2WebSocketMessage,
  messages_config: LiveV2MessagesConfig | None,
) -> bool:
  return (
    not messages_config
    or messages_config.receive_acknowledgments
    or not hasattr(message, "acknowledged")
  )


def trim_acknowledged_audio_buffer(
  audio_buffer: bytes,
  bytes_sent: int,
  byte_end: int,
) -> tuple[bytes, int]:
  acked_in_buffer = max(0, min(len(audio_buffer), byte_end - bytes_sent))
  next_bytes_sent = max(bytes_sent, byte_end)
  return audio_buffer[acked_in_buffer:], next_bytes_sent


def emit_started_if_needed(
  event_emitter: _EventEmitter,
  status: LiveV2SessionStatus,
  session: LiveV2InitResponse,
) -> LiveV2SessionStatus:
  if status != "starting":
    return status
  _ = event_emitter.emit("started", session)
  return "started"


def maybe_emit_start_session_message(
  event_emitter: _EventEmitter,
  options: LiveV2InitRequest,
  session: LiveV2InitResponse,
) -> None:
  if not (options.messages_config and options.messages_config.receive_lifecycle_events):
    return
  start_msg = LiveV2StartSessionMessage(
    type="start_session",
    session_id=session.id,
    created_at=session.created_at,
  )
  _ = event_emitter.emit("message", start_msg)


def emit_session_ending_events(
  event_emitter: _EventEmitter,
  status: LiveV2SessionStatus,
  code: int,
  reason: str | None,
) -> LiveV2SessionStatus:
  if status == "ended":
    return status
  if status != "ending":
    _ = event_emitter.emit("ending", LiveV2EndingMessage(code=code, reason=reason))
  _ = event_emitter.emit("ended", LiveV2EndedMessage(code=code, reason=reason))
  return "ended"


class LiveV2SessionEventsMixin:
  """Typed event listener API shared by sync and async Live V2 sessions."""

  _event_emitter: _EventEmitter

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
