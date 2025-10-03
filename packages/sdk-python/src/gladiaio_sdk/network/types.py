from enum import Enum
from typing import Any, final


@final
class HttpError(Exception):
  def __init__(
    self,
    *,
    message: str,
    method: str,
    url: str,
    status: int,
    id: str | None = None,
    request_id: str | None = None,
    response_body: str | dict[str, Any] | None = None,
    response_headers: dict[str, str] | None = None,
    cause: BaseException | None = None,
  ) -> None:
    super().__init__(message)
    if cause is not None:
      self.__cause__ = cause
    self.name = "HttpError"
    self.method = method
    self.url = url
    self.status = status
    self.id = id
    self.request_id = request_id
    self.response_body = response_body
    self.response_headers = dict(response_headers or {})


@final
class TimeoutError(Exception):
  def __init__(self, message: str, timeout: float, *, cause: BaseException | None = None) -> None:
    super().__init__(message)
    if cause is not None:
      self.__cause__ = cause
    self.name = "TimeoutError"
    self.timeout = timeout


class WS_STATES(Enum):
  CONNECTING = 0
  OPEN = 1
  CLOSING = 2
  CLOSED = 3
