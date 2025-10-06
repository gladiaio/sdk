"""Async and Synchronous HTTP client with retry and timeout support."""

import asyncio
import time
from typing import Any, final

import httpx

from gladiaio_sdk.client_options import HttpRetryOptions
from gladiaio_sdk.network.helper import matches_status


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


@final
class AsyncHttpClient:
  def __init__(
    self,
    base_url: str,
    headers: dict[str, str],
    query_params: dict[str, str],
    retry: HttpRetryOptions,
    timeout: float,
  ) -> None:
    self._base_url = base_url
    self._default_headers = headers
    self._default_query = query_params
    self._retry = retry
    self._timeout = timeout

    self._client = httpx.AsyncClient(base_url=self._base_url, timeout=self._timeout)

  async def close(self) -> None:
    await self._client.aclose()

  async def get(self, url: str, init: dict[str, Any] | None = None) -> httpx.Response:
    return await self._request("GET", url, init or {})

  async def post(
    self, url: str, init: dict[str, Any] | None = None, **kwargs: Any
  ) -> httpx.Response:
    merged: dict[str, Any] = {}
    if init:
      merged.update(init)
    if kwargs:
      merged.update(kwargs)
    return await self._request("POST", url, merged)

  async def put(self, url: str, init: dict[str, Any] | None = None) -> httpx.Response:
    return await self._request("PUT", url, init or {})

  async def delete(self, url: str, init: dict[str, Any] | None = None) -> httpx.Response:
    return await self._request("DELETE", url, init or {})

  async def _request(self, method: str, url: str, init: dict[str, Any]) -> httpx.Response:
    # Merge query params and base URL
    base = httpx.URL(self._base_url)
    request_url = base.join(url)
    # Preserve URL params; add defaults only if missing
    url_params = dict(httpx.QueryParams(request_url.query.decode()))
    # Start from default, then keep URL values intact
    params = dict(self._default_query)
    params.update(url_params)
    headers = {**self._default_headers, **dict(init.get("headers") or {})}
    data = init.get("body")
    json_body = init.get("json")

    overall_start = asyncio.get_event_loop().time()
    attempt_errors: list[BaseException] = []

    attempt = 0
    limit = self._retry.max_attempts

    while True:
      attempt += 1
      try:
        # Embed params into URL to mirror JS tests expectations
        if params:
          qp = httpx.QueryParams(params)
          request_url = request_url.copy_with(query=str(qp).encode())
        response = await self._client.request(
          method,
          request_url,
          headers=headers,
          content=data,
          json=json_body,
          timeout=self._timeout,
        )

        if 200 <= response.status_code < 300:
          return response

        http_err = _create_http_error(method, str(request_url), response)
        # Retry conditions
        should_retry = (limit == 0) or (attempt < limit)
        if should_retry and matches_status(response.status_code, self._retry.status_codes):
          await asyncio.sleep(self._retry.delay(attempt))
          continue
        # Throw immediately
        raise http_err
      except httpx.TimeoutException as err:
        # Do not retry on timeout
        elapsed = round((asyncio.get_event_loop().time() - overall_start), 3)
        raise TimeoutError(
          f"Request timed out after {self._timeout}s on attempt {attempt}"
          f" (duration={elapsed}s) for {method} {request_url}",
          self._timeout,
        ) from err
      except HttpError as err:
        # Already constructed HttpError from previous branch
        if attempt_errors:
          attempt_errors.append(err)
          elapsed = round((asyncio.get_event_loop().time() - overall_start), 3)
          raise Exception(
            f"HTTP request failed after {attempt} attempts over {elapsed}s"
            f" for {method} {request_url}",
          ) from Exception("All retry attempts failed", err)
        raise
      except Exception as err:
        # Network or other errors
        should_retry = (limit == 0) or (attempt < limit)
        if should_retry:
          attempt_errors.append(err)
          await asyncio.sleep(self._retry.delay(attempt))
          continue
        elapsed = round((asyncio.get_event_loop().time() - overall_start), 3)
        raise Exception(
          f"HTTP request failed after {attempt} attempts over {elapsed}s"
          f" for {method} {request_url}",
        ) from Exception("All retry attempts failed", err)


@final
class HttpClient:
  def __init__(
    self,
    base_url: str,
    headers: dict[str, str],
    query_params: dict[str, str],
    retry: HttpRetryOptions,
    timeout: float,
  ) -> None:
    self._base_url = base_url
    self._default_headers = headers
    self._default_query = query_params
    self._retry = retry
    self._timeout = timeout

    self._client = httpx.Client(base_url=self._base_url, timeout=self._timeout)

  def close(self) -> None:
    self._client.close()

  def get(self, url: str, init: dict[str, Any] | None = None) -> httpx.Response:
    return self._request("GET", url, init or {})

  def post(self, url: str, init: dict[str, Any] | None = None, **kwargs: Any) -> httpx.Response:
    merged: dict[str, Any] = {}
    if init:
      merged.update(init)
    if kwargs:
      merged.update(kwargs)
    return self._request("POST", url, merged)

  def put(self, url: str, init: dict[str, Any] | None = None) -> httpx.Response:
    return self._request("PUT", url, init or {})

  def delete(self, url: str, init: dict[str, Any] | None = None) -> httpx.Response:
    return self._request("DELETE", url, init or {})

  def _request(self, method: str, url: str, init: dict[str, Any]) -> httpx.Response:
    # Merge query params and base URL
    base = httpx.URL(self._base_url)
    request_url = base.join(url)
    # Preserve URL params; add defaults only if missing
    url_params = dict(httpx.QueryParams(request_url.query.decode()))
    # Start from default, then keep URL values intact
    params = dict(self._default_query)
    params.update(url_params)
    headers = {**self._default_headers, **dict(init.get("headers") or {})}
    data = init.get("body")
    json_body = init.get("json")

    overall_start = time.time()
    attempt_errors: list[BaseException] = []

    attempt = 0
    limit = self._retry.max_attempts

    while True:
      attempt += 1
      try:
        # Embed params into URL to mirror JS tests expectations
        if params:
          qp = httpx.QueryParams(params)
          request_url = request_url.copy_with(query=str(qp).encode())
        response = self._client.request(
          method,
          request_url,
          headers=headers,
          content=data,
          json=json_body,
          timeout=self._timeout,
        )

        if 200 <= response.status_code < 300:
          return response

        http_err = _create_http_error(method, str(request_url), response)
        # Retry conditions
        should_retry = (limit == 0) or (attempt < limit)
        if should_retry and matches_status(response.status_code, self._retry.status_codes):
          time.sleep(self._retry.delay(attempt))
          continue
        # Throw immediately
        raise http_err
      except httpx.TimeoutException as err:
        # Do not retry on timeout
        elapsed = round((time.time() - overall_start), 3)
        raise TimeoutError(
          f"Request timed out after {self._timeout}s on attempt {attempt}"
          f" (duration={elapsed}s) for {method} {request_url}",
          self._timeout,
        ) from err
      except HttpError as err:
        # Already constructed HttpError from previous branch
        if attempt_errors:
          attempt_errors.append(err)
          elapsed = round((time.time() - overall_start), 3)
          raise Exception(
            f"HTTP request failed after {attempt} attempts over {elapsed}s"
            f" for {method} {request_url}",
          ) from Exception("All retry attempts failed", err)
        raise
      except Exception as err:
        # Network or other errors
        should_retry = (limit == 0) or (attempt < limit)
        if should_retry:
          attempt_errors.append(err)
          time.sleep(self._retry.delay(attempt))
          continue
        elapsed = round((time.time() - overall_start), 3)
        raise Exception(
          f"HTTP request failed after {attempt} attempts over {elapsed}s"
          f" for {method} {request_url}",
        ) from Exception("All retry attempts failed", err)


def _create_http_error(method: str, url: str, response: httpx.Response) -> HttpError:
  message: str | None = None
  request_id: str | None = None
  call_id: str | None = None
  response_body: str | dict[str, Any] | None = None
  headers: dict[str, str] | None = None
  try:
    headers = {k.lower(): v for k, v in response.headers.items()}
    call_id = response.headers.get("x-aipi-call-id") or None
    text = response.text
    response_body = text
    try:
      data = response.json()
      response_body = data
      request_id = data.get("request_id")
      message = data.get("message")
    except Exception:
      pass
  except Exception:
    pass

  parts = [
    message or response.reason_phrase or "An error occurred",
    request_id or call_id,
    str(response.status_code),
    f"{method} {httpx.URL(url).path}",
  ]
  return HttpError(
    message=" | ".join([p for p in parts if p]),
    method=method,
    url=str(url),
    status=response.status_code,
    id=call_id,
    request_id=request_id,
    response_body=response_body,
    response_headers=headers or {},
  )
