from dataclasses import dataclass
from typing import Literal

LiveV2SessionStatus = Literal["starting", "started", "connecting", "connected", "ending", "ended"]


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
