import os
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Literal, cast

# Region parameter
Region = Literal["eu-west", "us-west"]

# Default timeouts (seconds) for general HTTP / WebSocket clients.
DEFAULT_HTTP_TIMEOUT: float = 10
DEFAULT_WS_TIMEOUT: float = 10


@dataclass(frozen=True, slots=True)
class PreRecordedV2Timeouts:
  """HTTP and flow timeouts for pre-recorded V2 (seconds).

  ``poll``, ``create_and_poll``, and ``transcribe`` accept ``timeout=None`` to wait
  indefinitely. When those parameters are omitted, these values apply.
  """

  transcribe: float = 7200
  poll: float = 7200
  create_and_poll: float = 7200

  upload_file: float = 300
  get_file: float = 300

  create: float = 30
  delete: float = 30

  get: float = 10

  def __post_init__(self) -> None:
    for name in (
      "transcribe",
      "create",
      "upload_file",
      "get",
      "delete",
      "poll",
      "create_and_poll",
    ):
      v = max(0, float(getattr(self, name)))
      object.__setattr__(self, name, v)


@dataclass(frozen=True, slots=True)
class HttpRetryOptions:
  """Retry behavior for HTTP requests. Retries are not triggered after a timeout."""

  max_attempts: int = 2
  status_codes: list[int | tuple[int, int]] = field(
    default_factory=lambda: [408, 413, (500, 599), 429]
  )
  """Delay in seconds between attempts. Callable(attempt_number) -> seconds."""
  delay: Callable[[int], float] = lambda attempt: min(0.3 * (2.0 ** (attempt - 1)), 10)

  def __post_init__(self) -> None:
    object.__setattr__(self, "max_attempts", max(0, self.max_attempts))


@dataclass(frozen=True, slots=True)
class WebSocketRetryOptions:
  """Retry behavior for WebSocket connections. Attempt count resets after a successful connection. Retries are not triggered after a timeout."""

  max_attempts_per_connection: int = 5
  """Delay in seconds between reconnection attempts. Callable(attempt_number) -> seconds."""
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
  """Top-level client options. Timeouts are in seconds (unlike the JS SDK, which uses milliseconds).

  Pre-recorded V2 uses :class:`PreRecordedV2Timeouts` for per-operation HTTP limits and
  default poll/transcribe deadlines; see ``prerecorded_timeouts``.
  """

  api_key: str | None = os.environ.get("GLADIA_API_KEY")
  api_url: str = os.environ.get("GLADIA_API_URL", "https://api.gladia.io")
  region: Region | None = cast(Region | None, os.environ.get("GLADIA_REGION"))
  http_headers: dict[str, str] = field(default_factory=dict)
  http_retry: HttpRetryOptions = HttpRetryOptions()
  """HTTP request timeout in seconds. Default 10. Retries are not triggered after a timeout."""
  http_timeout: float = DEFAULT_HTTP_TIMEOUT
  prerecorded_timeouts: PreRecordedV2Timeouts = field(default_factory=PreRecordedV2Timeouts)
  ws_retry: WebSocketRetryOptions = WebSocketRetryOptions()
  """WebSocket connection timeout in seconds. Default 10. Retries are not triggered after a timeout."""
  ws_timeout: float = DEFAULT_WS_TIMEOUT

  def __post_init__(self) -> None:
    object.__setattr__(self, "http_timeout", max(0, self.http_timeout))
    object.__setattr__(self, "ws_timeout", max(0, self.ws_timeout))
