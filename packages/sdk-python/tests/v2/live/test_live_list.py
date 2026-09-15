"""Unit tests for LiveV2Client / AsyncClient.list."""

from __future__ import annotations

import asyncio
import json
from typing import Any
from urllib.parse import parse_qs, urlparse

import pytest

from gladiaio_sdk.client_options import GladiaClientOptions, LiveV2Timeouts
from gladiaio_sdk.v2.live.async_client import LiveV2AsyncClient
from gladiaio_sdk.v2.live.client import LiveV2Client
from gladiaio_sdk.v2.live.generated_types import LiveV2ListParams, LiveV2ListResponse

LIST_BODY = {
  "first": "https://api.gladia.io/v2/live?offset=0&limit=20",
  "current": "https://api.gladia.io/v2/live?offset=0&limit=20",
  "next": None,
  "items": [],
}


class FakeResponse:
  def __init__(self, body: dict[str, Any]) -> None:
    self._body = body
    self.status_code = 200
    self.content = json.dumps(body).encode()

  def json(self) -> dict[str, Any]:
    return self._body


class FakeHttpClient:
  def __init__(self) -> None:
    self.get_calls: list[tuple[str, dict[str, Any]]] = []

  def get(self, url: str, options: dict[str, Any] | None = None, **kwargs: Any) -> FakeResponse:
    opts = options if options is not None else kwargs
    self.get_calls.append((url, opts))
    return FakeResponse(LIST_BODY)


class FakeAsyncHttpClient:
  def __init__(self) -> None:
    self.get_calls: list[tuple[str, dict[str, Any]]] = []

  async def get(
    self, url: str, options: dict[str, Any] | None = None, **kwargs: Any
  ) -> FakeResponse:
    opts = options if options is not None else kwargs
    self.get_calls.append((url, opts))
    return FakeResponse(LIST_BODY)


def _options() -> GladiaClientOptions:
  return GladiaClientOptions(
    api_key="test-key",
    live_timeouts=LiveV2Timeouts(list=54.321),
  )


def test_list_without_params_hits_collection_path() -> None:
  client = LiveV2Client(_options())
  fake = FakeHttpClient()
  client._http_client = fake  # type: ignore[method-assign]

  result = client.list()
  assert isinstance(result, LiveV2ListResponse)
  assert result.items == []
  assert len(fake.get_calls) == 1
  url, opts = fake.get_calls[0]
  assert url == "/v2/live"
  assert opts["request_timeout"] == pytest.approx(54.321)


def test_list_serializes_filters() -> None:
  client = LiveV2Client(_options())
  fake = FakeHttpClient()
  client._http_client = fake  # type: ignore[method-assign]

  client.list(
    LiveV2ListParams(
      offset=5,
      limit=10,
      status=["done", "error"],
      custom_metadata={"user": "John Doe"},
      before_date="2026-09-10T10:38:56.452Z",
    )
  )
  url, _ = fake.get_calls[0]
  parsed = urlparse(url)
  assert parsed.path == "/v2/live"
  qs = parse_qs(parsed.query)
  assert qs["offset"] == ["5"]
  assert qs["limit"] == ["10"]
  assert qs["status"] == ["done", "error"]
  assert qs["custom_metadata[user]"] == ["John Doe"]
  assert qs["before_date"] == ["2026-09-10T10:38:56.452Z"]


def test_list_follows_absolute_url() -> None:
  next_url = "https://api.gladia.io/v2/live?offset=20&limit=20&status=done"
  client = LiveV2Client(_options())
  fake = FakeHttpClient()
  client._http_client = fake  # type: ignore[method-assign]

  client.list(LiveV2ListParams(url=next_url, offset=0, status=["error"]))
  url, _ = fake.get_calls[0]
  assert url == next_url


def test_async_list_without_params() -> None:
  async def _run() -> None:
    client = LiveV2AsyncClient(_options())
    fake = FakeAsyncHttpClient()
    client._http_client = fake  # type: ignore[method-assign]

    result = await client.list()
    assert isinstance(result, LiveV2ListResponse)
    url, opts = fake.get_calls[0]
    assert url == "/v2/live"
    assert opts["request_timeout"] == pytest.approx(54.321)

  asyncio.run(_run())
