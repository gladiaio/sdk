"""Python tests mirroring JS HttpClient tests (synchronous wrappers)."""

import asyncio

import httpx
import pytest

from gladiaio_sdk.client_options import HttpRetryOptions, InternalHttpRetryOptions
from gladiaio_sdk.network.async_http_client import (
  AsyncHttpClient,
  HttpError,
  TimeoutError,
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
    retry = {}
  return AsyncHttpClient(
    base_url=base_url,
    retry=InternalHttpRetryOptions(
      max_attempts=retry.get("max_attempts", 0),
      status_codes=retry.get("status_codes", []),
      delay=retry.get("delay", lambda _: 0),
    ),
    timeout=timeout,
    query_params=query_params or {},
    headers={},
  )


def test_retries_and_success(monkeypatch):
  calls = {"n": 0}

  client = new_http_client(
    retry={"max_attempts": 2, "status_codes": [(500, 599)]},
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
    retry={"max_attempts": 5, "status_codes": [0, 999]},
    timeout=0.05,
  )

  async def fake_request(method, url, **kwargs):
    raise httpx.TimeoutException("timeout")

  monkeypatch.setattr(client._client, "request", fake_request)

  with pytest.raises(TimeoutError):
    run(client.get("/timeout"))


def test_http_error_non_retryable(monkeypatch):
  client = new_http_client(
    retry={"max_attempts": 5, "status_codes": [408, 413, 429, (500, 599)]},
  )

  async def fake_request(method, url, **kwargs):
    return make_response(404, "Not Found")

  monkeypatch.setattr(client._client, "request", fake_request)

  with pytest.raises(HttpError):
    run(client.get("/404"))


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
  client = new_http_client(retry={"max_attempts": 1, "status_codes": [(500, 599)]})

  async def r1(method, url, **kwargs):
    calls["n"] += 1
    return make_response(200)

  monkeypatch.setattr(client._client, "request", r1)
  run(client.get("/test"))
  assert calls["n"] == 1

  # limit 2: one retry
  calls = {"n": 0}
  client2 = new_http_client(retry={"max_attempts": 2, "status_codes": [(500, 599)]})

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
  client3 = new_http_client(retry={"max_attempts": 0, "status_codes": [(500, 599)]})

  async def r3(method, url, **kwargs):
    calls["n"] += 1
    if calls["n"] < 5:
      return make_response(500, "")
    return make_response(200)

  monkeypatch.setattr(client3._client, "request", r3)
  run(client3.get("/test"))
  assert calls["n"] == 5


def test_query_params(monkeypatch):
  called = {"url": None}
  client = new_http_client(
    query_params={"apiKey": "test-key", "version": "1.0"},
  )

  async def fake_request(method, url, **kwargs):
    called["url"] = str(url)
    return make_response(200)

  monkeypatch.setattr(client._client, "request", fake_request)
  run(client.get("/query-test"))
  assert called["url"].endswith("/query-test?apiKey=test-key&version=1.0")
