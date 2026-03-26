"""Async and Synchronous HTTP client with retry and timeout support."""

import asyncio
import difflib
import json
import re
import time
from collections.abc import Sequence
from typing import Any, final

import httpx

from gladiaio_sdk.client_options import HttpRetryOptions
from gladiaio_sdk.network.helper import matches_status

_schema_field_names_cache: dict[str, frozenset[str]] = {}


def _flatten_json_keys(obj: Any, out: set[str] | None = None) -> set[str]:
  """Collect all string keys from nested dict/list JSON payloads."""
  if out is None:
    out = set()
  if isinstance(obj, dict):
    for k, v in obj.items():
      if isinstance(k, str):
        out.add(k)
      _flatten_json_keys(v, out)
  elif isinstance(obj, list):
    for item in obj:
      _flatten_json_keys(item, out)
  return out


# Leading "field" or dotted path before common API validation phrasing (string-form errors).
_STRING_VALIDATION_PATH = re.compile(
  r"^([a-zA-Z_][\w.]*)\s+(?:must\b|(?:is|are)\s+required\b|field\s+required\b)",
  re.MULTILINE,
)


def _paths_from_string_validation_errors(validation_errors: Any) -> list[str]:
  """Extract request field paths from API errors returned as plain strings."""
  if not isinstance(validation_errors, list):
    return []
  out: list[str] = []
  for item in validation_errors:
    if not isinstance(item, str):
      continue
    m = _STRING_VALIDATION_PATH.match(item.strip())
    if m:
      out.append(m.group(1))
  return list(dict.fromkeys(out))


def _loc_leaf_candidates_from_validation_errors(validation_errors: Any) -> set[str]:
  """Field-name candidates from every validation item's ``loc`` tail (and param/field keys)."""
  found: set[str] = set()
  if not isinstance(validation_errors, list):
    return found
  for item in validation_errors:
    if not isinstance(item, dict):
      continue
    for key in ("field", "param"):
      v = item.get(key)
      if isinstance(v, str):
        found.add(v)
    loc = item.get("loc")
    if isinstance(loc, list) and loc:
      last = loc[-1]
      if isinstance(last, str):
        found.add(last)
  return found


def _schema_field_names_for_url(url: str) -> frozenset[str]:
  """Top-level init request field names for Gladia REST paths; union of both if unknown."""
  path = httpx.URL(url).path.lower()
  if "/v2/pre-recorded" in path or "/v2/prerecorded" in path:
    key = "prerecorded"
  elif "/v2/live" in path:
    key = "live"
  else:
    key = "both"
  cached = _schema_field_names_cache.get(key)
  if cached is not None:
    return cached
  from dataclasses import fields

  if key == "prerecorded":
    from gladiaio_sdk.v2.prerecorded.generated_types import PreRecordedV2InitTranscriptionRequest

    out = frozenset(f.name for f in fields(PreRecordedV2InitTranscriptionRequest))
  elif key == "live":
    from gladiaio_sdk.v2.live.generated_types import LiveV2InitRequest

    out = frozenset(f.name for f in fields(LiveV2InitRequest))
  else:
    from gladiaio_sdk.v2.live.generated_types import LiveV2InitRequest
    from gladiaio_sdk.v2.prerecorded.generated_types import PreRecordedV2InitTranscriptionRequest

    s = {f.name for f in fields(PreRecordedV2InitTranscriptionRequest)}
    s.update(f.name for f in fields(LiveV2InitRequest))
    out = frozenset(s)
  _schema_field_names_cache[key] = out
  return out


def _append_parameter_name_suggestions(
  full_message: str,
  *,
  status_code: int,
  url: str,
  invalid_parameters: list[str],
  validation_errors: Any | None,
  request_json: dict[str, Any] | None,
) -> str:
  string_paths = _paths_from_string_validation_errors(validation_errors)
  if (not invalid_parameters and not string_paths) or not (400 <= status_code < 500):
    return full_message
  candidates: set[str] = set()
  candidates.update(_loc_leaf_candidates_from_validation_errors(validation_errors))
  if isinstance(request_json, dict):
    candidates.update(_flatten_json_keys(request_json))
  candidates.update(_schema_field_names_for_url(url))
  # Do not treat invalid names as "known good" (they appear in their own loc tails).
  bad = set(invalid_parameters)
  hint = format_invalid_field_suggestions(invalid_parameters, sorted(candidates - bad))
  parts: list[str] = [full_message]
  if hint:
    parts.append(hint)
  if string_paths:
    parts.append("Affected request field(s): " + ", ".join(string_paths))
  if len(parts) == 1:
    return full_message
  return "\n\n".join(parts)


def _parse_invalid_parameters_from_body(body: dict[str, Any]) -> list[str]:
  """Extract invalid parameter/field names from common API error response shapes."""
  params: list[str] = []
  # e.g. {"details": [{"field": "language", "msg": "..."}, ...]} or {"details": [{"loc": ["body", "language"]}, ...]}
  for detail in body.get("details") or body.get("errors") or []:
    if isinstance(detail, dict):
      field = detail.get("field") or detail.get("param") or detail.get("loc")
      if isinstance(field, str):
        params.append(field)
      elif isinstance(field, list) and len(field) >= 2:
        params.append(str(field[-1]))
  # e.g. {"errors": {"language": "Unknown field", ...}}
  errors = body.get("errors")
  if isinstance(errors, dict):
    for k in errors:
      if isinstance(k, str):
        params.append(k)
  return list(dict.fromkeys(params))  # preserve order, dedupe


def _parse_invalid_parameters_from_validation_errors(validation_errors: Any) -> list[str]:
  """Extract field names from a list-shaped validation_errors (e.g. FastAPI / Pydantic)."""
  params: list[str] = []
  if not isinstance(validation_errors, list):
    return params
  for item in validation_errors:
    if isinstance(item, str):
      m = _STRING_VALIDATION_PATH.match(item.strip())
      if m:
        params.append(m.group(1))
      continue
    if not isinstance(item, dict):
      continue
    field = item.get("field") or item.get("param")
    if isinstance(field, str):
      params.append(field)
      continue
    loc = item.get("loc")
    if isinstance(loc, list) and len(loc) >= 1:
      params.append(str(loc[-1]))
  return params


def collect_invalid_parameters(
  response_body: dict[str, Any] | None,
  validation_errors: Any | None,
) -> list[str]:
  """Merge invalid parameter names from response body and validation_errors."""
  merged: list[str] = []
  if isinstance(response_body, dict):
    merged.extend(_parse_invalid_parameters_from_body(response_body))
  merged.extend(_parse_invalid_parameters_from_validation_errors(validation_errors))
  return list(dict.fromkeys(merged))


def suggest_close_strings(
  word: str,
  candidates: Sequence[str],
  *,
  n: int = 3,
  cutoff: float = 0.6,
) -> list[str]:
  """Return up to ``n`` candidate strings most similar to ``word`` (difflib)."""
  return difflib.get_close_matches(word, list(candidates), n=n, cutoff=cutoff)


def format_invalid_field_suggestions(
  invalid: Sequence[str],
  known_fields: Sequence[str],
  *,
  n: int = 3,
  cutoff: float = 0.5,
) -> str:
  """Build hint lines for unknown API fields using similarity to known names."""
  known_list = list(known_fields)
  known_set = set(known_list)
  lines: list[str] = []
  for name in invalid:
    if not name or name in known_set:
      continue
    matches = suggest_close_strings(name, known_list, n=n, cutoff=cutoff)
    if not matches:
      continue
    shown = ", ".join(repr(m) for m in matches)
    lines.append(f"Unknown field {name!r} — did you mean {shown}?")
  return "\n".join(lines)


@final
class HttpError(Exception):
  """HTTP request error with optional validation details from the API.

  Attributes:
    message: Human-readable error message.
    method, url, status: Request method, URL, and HTTP status code.
    response_body: Raw response body (str or parsed dict).
    invalid_parameters: Names parsed from validation payloads (e.g. unknown or rejected
      body fields). Difflib-based 'did you mean' hints are appended to :attr:`message`
      when applicable. Plain-string ``validation_errors`` entries (e.g. ``field must …``)
      also populate :attr:`invalid_parameters` and an **Affected request field(s):** line
      when the field path can be parsed. For responses that include ``validation_errors``,
      :attr:`message` contains only that block plus hints—not the full ``response_body``. Use
      :func:`enrich_http_error_with_field_suggestions` to merge extra known field names
      for custom endpoints.
  """

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
    validation_errors: Any | None = None,
    invalid_parameters: list[str] | None = None,
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
    self.validation_errors = validation_errors
    self.invalid_parameters = list(invalid_parameters or [])


def enrich_http_error_with_field_suggestions(
  err: HttpError,
  known_fields: Sequence[str],
  *,
  status_codes: tuple[int, ...] = (400, 422),
) -> HttpError:
  """Return a copy of ``err`` with difflib-based field hints, or ``err`` if none apply."""
  if err.status not in status_codes or not err.invalid_parameters:
    return err
  hint = format_invalid_field_suggestions(err.invalid_parameters, known_fields)
  if not hint:
    return err
  return HttpError(
    message=f"{str(err)}\n\n{hint}",
    method=err.method,
    url=err.url,
    status=err.status,
    id=err.id,
    request_id=err.request_id,
    response_body=err.response_body,
    response_headers=err.response_headers,
    validation_errors=err.validation_errors,
    invalid_parameters=err.invalid_parameters,
  )


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

    self._client = httpx.AsyncClient(
      base_url=self._base_url, timeout=self._timeout, follow_redirects=True
    )

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
    files = init.get("files")
    req_timeout = init.get("request_timeout")
    effective_timeout = self._timeout if req_timeout is None else float(req_timeout)

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
          files=files,
          timeout=effective_timeout,
        )

        if 200 <= response.status_code < 300:
          return response

        http_err = _create_http_error(
          method,
          str(request_url),
          response,
          json_body if isinstance(json_body, dict) else None,
        )
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
          f"Request timed out after {effective_timeout}s on attempt {attempt}"
          f" (duration={elapsed}s) for {method} {request_url}",
          effective_timeout,
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

    self._client = httpx.Client(
      base_url=self._base_url, timeout=self._timeout, follow_redirects=True
    )

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
    files = init.get("files")
    req_timeout = init.get("request_timeout")
    effective_timeout = self._timeout if req_timeout is None else float(req_timeout)

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
          files=files,
          timeout=effective_timeout,
        )

        if 200 <= response.status_code < 300:
          return response

        http_err = _create_http_error(
          method,
          str(request_url),
          response,
          json_body if isinstance(json_body, dict) else None,
        )
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
          f"Request timed out after {effective_timeout}s on attempt {attempt}"
          f" (duration={elapsed}s) for {method} {request_url}",
          effective_timeout,
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


def _format_validation_errors_for_message(errors: Any) -> str:
  """Serialize API validation_errors for inclusion in HttpError string output."""
  try:
    return json.dumps(errors, indent=2, ensure_ascii=False, default=str)
  except TypeError:
    return str(errors)


def _create_http_error(
  method: str,
  url: str,
  response: httpx.Response,
  request_json: dict[str, Any] | None = None,
) -> HttpError:
  message: str | None = None
  request_id: str | None = None
  call_id: str | None = None
  response_body: str | dict[str, Any] | None = None
  headers: dict[str, str] | None = None
  validation_errors: Any | None = None
  try:
    headers = {k.lower(): v for k, v in response.headers.items()}
    call_id = response.headers.get("x-aipi-call-id") or None
    text = response.text
    response_body = text
    try:
      data = response.json()
      response_body = data
      if isinstance(data, dict):
        request_id = data.get("request_id") or data.get("requestId")
        message = data.get("message")
        validation_errors = data.get("validation_errors") or data.get("validationErrors")
    except Exception:
      pass
  except Exception:
    pass

  if validation_errors is not None:
    # Omit API message and full response body from the string; callers still have
    # HttpError.response_body / validation_errors on the exception object.
    full_message = f"validation_errors:\n{_format_validation_errors_for_message(validation_errors)}"
  else:
    parts = [
      message or response.reason_phrase or "An error occurred",
      request_id or call_id,
      str(response.status_code),
      f"{method} {httpx.URL(url).path}",
    ]
    full_message = " | ".join([p for p in parts if p])

  invalid_parameters = collect_invalid_parameters(
    response_body if isinstance(response_body, dict) else None,
    validation_errors,
  )
  full_message = _append_parameter_name_suggestions(
    full_message,
    status_code=response.status_code,
    url=str(url),
    invalid_parameters=invalid_parameters,
    validation_errors=validation_errors,
    request_json=request_json,
  )

  return HttpError(
    message=full_message,
    method=method,
    url=str(url),
    status=response.status_code,
    id=call_id,
    request_id=request_id,
    response_body=response_body,
    response_headers=headers or {},
    validation_errors=validation_errors,
    invalid_parameters=invalid_parameters,
  )
