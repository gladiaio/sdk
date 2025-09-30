import os
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Literal, cast

# Region parameter
Region = Literal["eu-west", "us-west"]


@dataclass(frozen=True, slots=True)
class HttpRetryOptions:
  max_attempts: int = 2
  status_codes: list[int | tuple[int, int]] = field(
    default_factory=lambda: [408, 413, (500, 599), 429]
  )
  delay: Callable[[int], float] = lambda attempt: min(0.3 * (2.0 ** (attempt - 1)), 10)

  def __post_init__(self) -> None:
    object.__setattr__(self, "max_attempts", max(0, self.max_attempts))


@dataclass(frozen=True, slots=True)
class WebSocketRetryOptions:
  max_attempts_per_connection: int = 5
  delay: Callable[[int], float] = lambda attempt: min(0.3 * (2.0 ** (attempt - 1)), 2)
  max_connections: int = 0
  close_codes: list[int | tuple[int, int]] = field(
    default_factory=lambda: [(1002, 4399), (4500, 9999)]
  )

  def __post_init__(self) -> None:
    object.__setattr__(
      self, "max_attempts_per_connection", max(0, self.max_attempts_per_connection)
    )
    object.__setattr__(self, "max_connections", max(0, self.max_connections))


@dataclass(frozen=True, slots=True)
class GladiaClientOptions:
  api_key: str | None = os.environ.get("GLADIA_API_KEY")
  api_url: str = os.environ.get("GLADIA_API_URL", "https://api.gladia.io")
  region: Region | None = cast(Region | None, os.environ.get("GLADIA_REGION"))
  http_headers: dict[str, str] = field(default_factory=dict)
  http_retry: HttpRetryOptions = HttpRetryOptions()
  http_timeout: float = 10
  ws_retry: WebSocketRetryOptions = WebSocketRetryOptions()
  ws_timeout: float = 10

  def __post_init__(self) -> None:
    object.__setattr__(self, "http_timeout", max(0, self.http_timeout))
    object.__setattr__(self, "ws_timeout", max(0, self.ws_timeout))
