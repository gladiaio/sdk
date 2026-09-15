"""Unit tests for PreRecordedV2Client / AsyncClient.list."""

from __future__ import annotations

import asyncio
import json
from typing import Any
from urllib.parse import parse_qs, urlparse

import pytest

from gladiaio_sdk.client_options import GladiaClientOptions, PreRecordedV2Timeouts
from gladiaio_sdk.v2.prerecorded.async_client import PreRecordedV2AsyncClient
from gladiaio_sdk.v2.prerecorded.client import PreRecordedV2Client
from gladiaio_sdk.v2.prerecorded.generated_types import (
  PreRecordedV2ListParams,
  PreRecordedV2ListResponse,
)

LIST_BODY = {
  "first": "https://api.gladia.io/v2/pre-recorded?offset=0&limit=20",
  "current": "https://api.gladia.io/v2/pre-recorded?offset=0&limit=20",
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
    prerecorded_timeouts=PreRecordedV2Timeouts(list=12.345),
  )


def test_list_without_params_hits_collection_path() -> None:
  client = PreRecordedV2Client(_options())
  fake = FakeHttpClient()
  client._http_client = fake  # type: ignore[method-assign]

  result = client.list()
  assert isinstance(result, PreRecordedV2ListResponse)
  assert result.items == []
  assert len(fake.get_calls) == 1
  url, opts = fake.get_calls[0]
  assert url == "/v2/pre-recorded"
  assert opts["request_timeout"] == pytest.approx(12.345)


def test_list_serializes_filters() -> None:
  client = PreRecordedV2Client(_options())
  fake = FakeHttpClient()
  client._http_client = fake  # type: ignore[method-assign]

  client.list(
    PreRecordedV2ListParams(
      offset=5,
      limit=10,
      status=["done", "error"],
      custom_metadata={"user": "John Doe"},
      after_date="2026-09-01T00:00:00.000Z",
    )
  )
  url, _ = fake.get_calls[0]
  parsed = urlparse(url)
  assert parsed.path == "/v2/pre-recorded"
  qs = parse_qs(parsed.query)
  assert qs["offset"] == ["5"]
  assert qs["limit"] == ["10"]
  assert qs["status"] == ["done", "error"]
  assert qs["custom_metadata[user]"] == ["John Doe"]
  assert qs["after_date"] == ["2026-09-01T00:00:00.000Z"]


def test_list_follows_absolute_url() -> None:
  next_url = "https://api.gladia.io/v2/pre-recorded?offset=20&limit=20&status=done"
  client = PreRecordedV2Client(_options())
  fake = FakeHttpClient()
  client._http_client = fake  # type: ignore[method-assign]

  client.list(PreRecordedV2ListParams(url=next_url, offset=0, status=["error"]))
  url, _ = fake.get_calls[0]
  assert url == next_url


def test_async_list_without_params() -> None:
  async def _run() -> None:
    client = PreRecordedV2AsyncClient(_options())
    fake = FakeAsyncHttpClient()
    client._http_client = fake  # type: ignore[method-assign]

    result = await client.list()
    assert isinstance(result, PreRecordedV2ListResponse)
    url, opts = fake.get_calls[0]
    assert url == "/v2/pre-recorded"
    assert opts["request_timeout"] == pytest.approx(12.345)

  asyncio.run(_run())
