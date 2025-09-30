"""Tests for the high-level Gladia client."""

from __future__ import annotations

import pytest

from gladiaio_sdk.client import GladiaClient
from gladiaio_sdk.client_options import GladiaClientOptions, HttpRetryOptions, WebSocketRetryOptions
from gladiaio_sdk.version import SDK_VERSION


class FakeLiveV2AsyncClient:
  def __init__(self, options: GladiaClientOptions) -> None:  # pragma: no cover - simple carrier
    self.options = options


@pytest.fixture
def patched_async_live_v2_client(monkeypatch):
  created_clients: list[FakeLiveV2AsyncClient] = []

  def _factory(options: GladiaClientOptions) -> FakeLiveV2AsyncClient:
    client = FakeLiveV2AsyncClient(options)
    created_clients.append(client)
    return client

  monkeypatch.setattr("gladiaio_sdk.client.LiveV2AsyncClient", _factory)

  return created_clients


def test_async_live_v2_merges_inline_overrides(patched_async_live_v2_client):
  base_headers = {"x-gladia-version": "base", "Base-Header": "keep"}
  base_options = GladiaClientOptions(
    api_key="base-key",
    api_url="https://api.example.com",
    http_headers=base_headers.copy(),
    http_timeout=5,
    ws_timeout=7,
  )

  client = GladiaClient(base_options)

  merged_client = client.live_v2_async(
    api_key="override-key",
    http_headers={"x-gladia-version": "override", "X-Custom": "1"},
    http_timeout=-15,
    http_retry=HttpRetryOptions(max_attempts=3),
    ws_timeout=-25,
    ws_retry=WebSocketRetryOptions(max_attempts_per_connection=4),
  )

  assert isinstance(merged_client, FakeLiveV2AsyncClient)
  options = merged_client.options

  # Ensure we are not mutating the instance stored on GladiaClient
  assert options is not client.options
  assert client.options.api_key == "base-key"
  assert client.options.http_headers == base_headers

  # Overrides are honored and sanitized via __post_init__
  assert options.api_key == "override-key"
  assert options.api_url == "https://api.example.com"
  assert options.http_timeout == 0
  assert options.http_retry.max_attempts == 3
  assert options.ws_timeout == 0
  assert options.ws_retry.max_attempts_per_connection == 4

  expected_version = f"SdkPython/{SDK_VERSION}"
  assert options.http_headers["x-gladia-key"] == "override-key"
  assert options.http_headers["x-gladia-version"] == f"override {expected_version}"
  assert options.http_headers["X-Custom"] == "1"

  assert len(patched_async_live_v2_client) == 1


def test_async_live_v2_accepts_prebuilt_options(patched_async_live_v2_client):
  client = GladiaClient(
    api_key="base-key",
    api_url="https://api.example.com",
    http_headers={"x-gladia-version": "base"},
  )

  provided = GladiaClientOptions(
    api_key="provided-key",
    api_url="https://alt.example.net",
    http_headers={"x-gladia-version": "provided"},
    http_timeout=12,
    http_retry=HttpRetryOptions(max_attempts=6),
    ws_timeout=4,
    ws_retry=WebSocketRetryOptions(max_attempts_per_connection=8),
  )

  merged_client = client.live_v2_async(provided)

  assert isinstance(merged_client, FakeLiveV2AsyncClient)
  options = merged_client.options

  # The provided options should be used (without inheriting base client overrides)
  assert options.api_key == "provided-key"
  assert options.api_url == "https://alt.example.net"
  assert options.http_timeout == 12
  assert options.http_retry.max_attempts == 6
  assert options.ws_timeout == 4
  assert options.ws_retry.max_attempts_per_connection == 8

  expected_version = f"SdkPython/{SDK_VERSION}"
  assert options.http_headers["x-gladia-key"] == "provided-key"
  assert options.http_headers["x-gladia-version"] == f"provided {expected_version}"

  # The original GladiaClientOptions instance passed in remains untouched
  assert provided.api_key == "provided-key"
  assert provided.http_headers == {"x-gladia-version": "provided"}

  assert len(patched_async_live_v2_client) == 1
