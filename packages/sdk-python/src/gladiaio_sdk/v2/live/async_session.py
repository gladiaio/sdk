"""Async live v2 session implementation."""

from __future__ import annotations

import asyncio
import contextlib
import json
from typing import Any, final

from pyee.asyncio import AsyncIOEventEmitter

from gladiaio_sdk.v2.live.types import (
  LiveV2ConnectedMessage,
  LiveV2ConnectingMessage,
  LiveV2EndingMessage,
  LiveV2SessionStatus,
)

from ...network import (
  WS_STATES,
  AsyncHttpClient,
  AsyncWebSocketSession,
  WebSocketClient,
)
from ._helpers import (
  LiveV2SessionEventsMixin,
  emit_session_ending_events,
  emit_started_if_needed,
  maybe_emit_start_session_message,
  parse_ws_message,
  send_audio_in_chunks,
  should_emit_ws_message,
  trim_acknowledged_audio_buffer,
  with_acknowledgments_enabled,
)
from .generated_types import (
  LiveV2InitRequest,
  LiveV2InitResponse,
)


@final
class LiveV2AsyncSession(LiveV2SessionEventsMixin):
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
    ws_client: WebSocketClient,
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
      options = with_acknowledgments_enabled(self._options)
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

      self._status = emit_started_if_needed(self._event_emitter, self._status, session)
      maybe_emit_start_session_message(self._event_emitter, self._options, session)
      self._connect_ws_task = asyncio.create_task(self._connect_ws(session.url))
    except Exception as err:
      _ = self._event_emitter.emit("error", err)
      self._do_destroy(1006, "Couldn't start a new session")

  async def _connect_ws(self, ws_url: str) -> None:
    if self._abort.is_set():
      return

    ws = self._ws_client.create_async_session(ws_url)
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
        with contextlib.suppress(Exception):
          send_audio_in_chunks(ws, self._audio_buffer)

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
        message = parse_ws_message(raw)
      except Exception as parse_err:
        _ = self._event_emitter.emit("error", parse_err)
        return

      if should_emit_ws_message(message, self._options.messages_config):
        _ = self._event_emitter.emit("message", message)

      if getattr(message, "type", None) == "audio_chunk":
        data = getattr(message, "data", None)
        if getattr(message, "acknowledged", False) and data:
          byte_end = int((data.byte_range)[1])
          self._audio_buffer, self._bytes_sent = trim_acknowledged_audio_buffer(
            self._audio_buffer,
            self._bytes_sent,
            byte_end,
          )

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

    self._status = emit_session_ending_events(self._event_emitter, self._status, code, reason)

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
