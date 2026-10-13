"""Request URLs must keep the path prefix of ``api_url`` (proxy or router in front of the API)."""

from __future__ import annotations

import asyncio
from typing import Any

import httpx
import pytest

from gladiaio_sdk.client_options import HttpRetryOptions
from gladiaio_sdk.network import AsyncHttpClient, HttpClient


def _ok(method: str, url: Any) -> httpx.Response:
  return httpx.Response(200, json={}, request=httpx.Request(method, url))


def _sync_request_url(
  monkeypatch: pytest.MonkeyPatch,
  base_url: str,
  url: str,
  query_params: dict[str, str] | None = None,
) -> str:
  client = HttpClient(
    base_url=base_url,
    headers={},
    query_params=query_params or {},
    retry=HttpRetryOptions(max_attempts=1),
    timeout=2,
  )
  captured: list[str] = []

  def fake_request(method: str, request_url: Any, **_kwargs: Any) -> httpx.Response:
    captured.append(str(request_url))
    return _ok(method, request_url)

  monkeypatch.setattr(client._client, "request", fake_request)
  client.get(url)
  return captured[0]


def _async_request_url(
  monkeypatch: pytest.MonkeyPatch,
  base_url: str,
  url: str,
  query_params: dict[str, str] | None = None,
) -> str:
  client = AsyncHttpClient(
    base_url=base_url,
    headers={},
    query_params=query_params or {},
    retry=HttpRetryOptions(max_attempts=1),
    timeout=2,
  )
  captured: list[str] = []

  async def fake_request(method: str, request_url: Any, **_kwargs: Any) -> httpx.Response:
    captured.append(str(request_url))
    return _ok(method, request_url)

  monkeypatch.setattr(client._client, "request", fake_request)
  asyncio.run(client.get(url))
  return captured[0]


@pytest.fixture(params=["sync", "async"])
def request_url(request: pytest.FixtureRequest, monkeypatch: pytest.MonkeyPatch):
  fn = _sync_request_url if request.param == "sync" else _async_request_url

  def _call(base_url: str, url: str, query_params: dict[str, str] | None = None) -> str:
    return fn(monkeypatch, base_url, url, query_params)

  return _call


@pytest.mark.parametrize(
  "base_url", ["http://localhost:8001/gladia", "http://localhost:8001/gladia/"]
)
@pytest.mark.parametrize(
  "path",
  [
    "/v2/live",
    "/v2/live/abc-123",
    "/v2/pre-recorded",
    "/v2/pre-recorded/abc-123/file",
    "/v2/upload",
  ],
)
def test_keeps_api_url_path_prefix(request_url, base_url: str, path: str):
  assert request_url(base_url, path) == f"http://localhost:8001/gladia{path}"


@pytest.mark.parametrize("base_url", ["https://api.gladia.io", "https://api.gladia.io/"])
def test_api_url_without_path_is_unchanged(request_url, base_url: str):
  assert request_url(base_url, "/v2/live/abc-123") == "https://api.gladia.io/v2/live/abc-123"


def test_merges_base_and_endpoint_query_strings(request_url):
  url = request_url(
    "http://localhost:8001/gladia?tenant=acme", "/v2/pre-recorded?offset=20&limit=10"
  )
  parsed = httpx.URL(url)
  assert parsed.path == "/gladia/v2/pre-recorded"
  assert parsed.params["tenant"] == "acme"
  assert parsed.params["offset"] == "20"
  assert parsed.params["limit"] == "10"


def test_default_query_params_are_added_with_prefix(request_url):
  url = request_url("http://localhost:8001/gladia", "/v2/live?region=eu-west", {"version": "1"})
  parsed = httpx.URL(url)
  assert parsed.path == "/gladia/v2/live"
  assert parsed.params["region"] == "eu-west"
  assert parsed.params["version"] == "1"


def test_absolute_url_is_kept_as_is(request_url):
  url = request_url("http://localhost:8001/gladia", "http://localhost:8001/other/v2/live")
  assert url == "http://localhost:8001/other/v2/live"


def test_repeated_query_keys_are_kept(request_url):
  url = request_url(
    "http://localhost:8001/gladia",
    "/v2/pre-recorded?status=done&status=error",
    {"version": "1", "status": "queued"},
  )
  parsed = httpx.URL(url)
  assert parsed.params.get_list("status") == ["done", "error"]
  assert parsed.params["version"] == "1"
