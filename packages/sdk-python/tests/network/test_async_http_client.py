"""Python tests mirroring JS HttpClient tests (synchronous wrappers)."""

import asyncio
import json
from typing import TypedDict

import httpx
import pytest

from gladiaio_sdk.client_options import HttpRetryOptions
from gladiaio_sdk.network import (
  AsyncHttpClient,
  HttpError,
  TimeoutError,
  enrich_http_error_with_field_suggestions,
  format_invalid_field_suggestions,
)


def run(coro):
  return asyncio.run(coro)


def make_response(
  status: int, body: str = "ok", headers: dict[str, str] | None = None
) -> httpx.Response:
  req = httpx.Request("GET", "https://example.com/test")
  return httpx.Response(status, text=body, headers=headers or {}, request=req)


def new_http_client(
  base_url: str = "https://example.com",
  retry: HttpRetryOptions | None = None,
  timeout: float = 2,
  query_params: dict[str, str] | None = None,
) -> AsyncHttpClient:
  if retry is None:
    retry = HttpRetryOptions()
  return AsyncHttpClient(
    base_url=base_url,
    retry=HttpRetryOptions(
      max_attempts=retry.max_attempts,
      status_codes=retry.status_codes,
      delay=retry.delay,
    ),
    timeout=timeout,
    query_params=query_params or {},
    headers={},
  )


def test_retries_and_success(monkeypatch):
  calls = {"n": 0}

  client = new_http_client(
    retry=HttpRetryOptions(max_attempts=2, status_codes=[(500, 599)]),
  )

  async def fake_request(method, url, **kwargs):
    calls["n"] += 1
    if calls["n"] < 2:
      return make_response(500, "")
    return make_response(200, "ok")

  monkeypatch.setattr(client._client, "request", fake_request)

  res = run(client.get("/test"))
  assert res.status_code == 200
  assert calls["n"] == 2


def test_no_retry_on_timeout(monkeypatch):
  client = new_http_client(
    retry=HttpRetryOptions(max_attempts=5, status_codes=[0, 999]),
    timeout=0.05,
  )

  async def fake_request(method, url, **kwargs):
    raise httpx.TimeoutException("timeout")

  monkeypatch.setattr(client._client, "request", fake_request)

  with pytest.raises(TimeoutError):
    run(client.get("/timeout"))


def test_http_error_non_retryable(monkeypatch):
  client = new_http_client(
    retry=HttpRetryOptions(max_attempts=5, status_codes=[408, 413, 429, (500, 599)]),
  )

  async def fake_request(method, url, **kwargs):
    return make_response(404, "Not Found")

  monkeypatch.setattr(client._client, "request", fake_request)

  with pytest.raises(HttpError):
    run(client.get("/404"))


def test_http_error_includes_difflib_parameter_hints_for_typo(monkeypatch):
  client = new_http_client(
    retry=HttpRetryOptions(max_attempts=5, status_codes=[408, 413, 429, (500, 599)]),
  )
  payload = {
    "message": "Unknown field",
    "request_id": "G-test",
    "validation_errors": [{"loc": ["body", "languge"], "msg": "extra fields not permitted"}],
  }

  async def fake_request(method, url, **kwargs):
    return make_response(400, json.dumps(payload))

  monkeypatch.setattr(client._client, "request", fake_request)

  with pytest.raises(HttpError) as exc_info:
    run(client.get("/v2/pre-recorded"))
  err = exc_info.value
  assert err.invalid_parameters == ["languge"]
  assert "did you mean" in str(err).lower()
  assert "language" in str(err)


def test_http_error_string_validation_errors_show_affected_field_path(monkeypatch):
  client = new_http_client(
    retry=HttpRetryOptions(max_attempts=5, status_codes=[408, 413, 429, (500, 599)]),
  )
  msg = "language_config.languages must only contain the following values: af, am, ar, en"
  payload = {
    "message": "Invalid parameter(s). See validation_errors for more details.",
    "request_id": "G-test",
    "validation_errors": [msg],
  }

  async def fake_request(method, url, **kwargs):
    return make_response(400, json.dumps(payload))

  monkeypatch.setattr(client._client, "request", fake_request)

  with pytest.raises(HttpError) as exc_info:
    run(client.get("/v2/pre-recorded"))
  err = exc_info.value
  assert err.invalid_parameters == ["language_config.languages"]
  assert "Affected request field(s): language_config.languages" in str(err)
  assert msg in str(err)


def test_http_error_includes_validation_errors_in_message(monkeypatch):
  client = new_http_client(
    retry=HttpRetryOptions(max_attempts=5, status_codes=[408, 413, 429, (500, 599)]),
  )
  payload = {
    "message": "Invalid parameter(s). See validation_errors for more details.",
    "request_id": "G-7d29b8f8",
    "validation_errors": [{"loc": ["body", "audio_url"], "msg": "field required"}],
  }

  async def fake_request(method, url, **kwargs):
    return make_response(400, json.dumps(payload))

  monkeypatch.setattr(client._client, "request", fake_request)

  with pytest.raises(HttpError) as exc_info:
    run(client.get("/v2/pre-recorded"))
  err = exc_info.value
  assert err.validation_errors == payload["validation_errors"]
  assert err.invalid_parameters == ["audio_url"]
  assert "validation_errors:" in str(err)
  assert "audio_url" in str(err)
  assert "field required" in str(err)


def test_format_invalid_field_suggestions_typo():
  known = ("language", "audio_url", "diarization")
  hint = format_invalid_field_suggestions(["languge"], known)
  assert "language" in hint
  assert "languge" in hint


def test_enrich_http_error_appends_suggestions():
  err = HttpError(
    message="bad request",
    method="POST",
    url="https://example.com/v2/pre-recorded",
    status=400,
    invalid_parameters=["languge"],
  )
  enriched = enrich_http_error_with_field_suggestions(err, ("language", "audio_url"))
  assert enriched is not err
  assert "language" in str(enriched)
  assert "did you mean" in str(enriched)


def test_methods_and_url(monkeypatch):
  calls: list[tuple[str, str]] = []

  client = new_http_client()

  async def fake_request(method, url, **kwargs):
    calls.append((method, str(url)))
    return make_response(200)

  monkeypatch.setattr(client._client, "request", fake_request)

  run(client.get("/method"))
  assert calls[-1][0] == "GET" and "/method" in calls[-1][1]
  run(client.post("/method"))
  assert calls[-1][0] == "POST"
  run(client.put("/method"))
  assert calls[-1][0] == "PUT"
  run(client.delete("/method"))
  assert calls[-1][0] == "DELETE"


def test_retry_limits(monkeypatch):
  # limit 1: only initial attempt
  calls = {"n": 0}
  client = new_http_client(retry=HttpRetryOptions(max_attempts=1, status_codes=[(500, 599)]))

  async def r1(method, url, **kwargs):
    calls["n"] += 1
    return make_response(200)

  monkeypatch.setattr(client._client, "request", r1)
  run(client.get("/test"))
  assert calls["n"] == 1

  # limit 2: one retry
  calls = {"n": 0}
  client2 = new_http_client(retry=HttpRetryOptions(max_attempts=2, status_codes=[(500, 599)]))

  async def r2(method, url, **kwargs):
    calls["n"] += 1
    if calls["n"] < 2:
      return make_response(500, "")
    return make_response(200)

  monkeypatch.setattr(client2._client, "request", r2)
  run(client2.get("/test"))
  assert calls["n"] == 2

  # limit 0: unlimited retries until success on 5th
  calls = {"n": 0}
  client3 = new_http_client(retry=HttpRetryOptions(max_attempts=0, status_codes=[(500, 599)]))

  async def r3(method, url, **kwargs):
    calls["n"] += 1
    if calls["n"] < 5:
      return make_response(500, "")
    return make_response(200)

  monkeypatch.setattr(client3._client, "request", r3)
  run(client3.get("/test"))
  assert calls["n"] == 5


def test_query_params(monkeypatch):
  class Called(TypedDict):
    url: str | None

  called: Called = {"url": None}
  client = new_http_client(
    query_params={"apiKey": "test-key", "version": "1.0"},
  )

  async def fake_request(method, url, **kwargs):
    called["url"] = str(url)
    return make_response(200)

  monkeypatch.setattr(client._client, "request", fake_request)
  run(client.get("/query-test"))
  assert called["url"] is not None and called["url"].endswith(
    "/query-test?apiKey=test-key&version=1.0"
  )
