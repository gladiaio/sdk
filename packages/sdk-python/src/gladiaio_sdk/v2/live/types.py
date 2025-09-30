from dataclasses import dataclass


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
