from collections.abc import Callable
from dataclasses import dataclass
from typing import Literal, TypedDict

# Region parameter
Region = Literal["eu-west", "us-west"]


@dataclass
class InternalHttpRetryOptions:
  max_attempts: int
  status_codes: list[int | tuple[int, int]]
  delay: Callable[[int], float]


@dataclass
class InternalWebSocketRetryOptions:
  max_attempts_per_connection: int
  delay: Callable[[int], float]
  max_connections: int
  close_codes: list[int | tuple[int, int]]


@dataclass
class InternalGladiaClientOptions:
  api_url: str
  http_headers: dict[str, str]
  http_retry: InternalHttpRetryOptions
  http_timeout: float
  ws_retry: InternalWebSocketRetryOptions
  ws_timeout: float

  # optional parameters
  api_key: str | None = None
  region: Region | None = None

  def __post_init__(self) -> None:
    # Coerce nested dicts into their dataclass counterparts
    if isinstance(self.http_retry, dict):
      self.http_retry = InternalHttpRetryOptions(**self.http_retry)

    if isinstance(self.ws_retry, dict):
      self.ws_retry = InternalWebSocketRetryOptions(**self.ws_retry)


class HttpRetryOptions(TypedDict):
  max_attempts: int | None
  status_codes: list[int | tuple[int, int]] | None
  delay: Callable[[int], float] | None


class WebSocketRetryOptions(TypedDict):
  max_attempts_per_connection: int | None
  delay: Callable[[int], float] | None
  max_connections: int | None
  close_codes: list[int | tuple[int, int]] | None


class GladiaClientOptions(TypedDict):
  api_key: str | None
  api_url: str | None
  region: Region | None
  http_headers: dict[str, str] | None
  http_retry: HttpRetryOptions | None
  http_timeout: float | None
  ws_retry: WebSocketRetryOptions | None
  ws_timeout: float | None
