from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Literal

if TYPE_CHECKING:
  from .generated_types import LiveV2MessagesConfig

LiveV2SessionStatus = Literal["starting", "started", "connecting", "connected", "ending", "ended"]


@dataclass(frozen=True, slots=True)
class LiveV2ConnectSessionOptions:
  id: str
  url: str
  created_at: str | None = None
  messages_config: LiveV2MessagesConfig | None = None


@dataclass(frozen=True, slots=True)
class LiveV2ConnectingMessage:
  attempt: int


@dataclass(frozen=True, slots=True)
class LiveV2ConnectedMessage:
  attempt: int


@dataclass(frozen=True, slots=True)
class LiveV2EndingMessage:
  code: int
  reason: str | None = None


@dataclass(frozen=True, slots=True)
class LiveV2EndedMessage:
  code: int
  reason: str | None = None
