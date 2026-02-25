"""Tests for the high-level Gladia client (live v2 sync and async)."""

from __future__ import annotations

from gladiaio_sdk.client import GladiaClient
from gladiaio_sdk.client_options import GladiaClientOptions, HttpRetryOptions, WebSocketRetryOptions
from gladiaio_sdk.version import SDK_VERSION

from .conftest import FakeLiveV2AsyncClient, FakeLiveV2Client


def test_live_v2_merges_inline_overrides(patched_live_v2_client):
  """Live (sync): each parameter override is merged and passed to LiveV2Client."""
  base_headers = {"x-gladia-version": "base", "Base-Header": "keep"}
  base_options = GladiaClientOptions(
    api_key="base-key",
    api_url="https://api.example.com",
    region="eu-west",
    http_headers=base_headers.copy(),
    http_timeout=5,
    ws_timeout=7,
  )

  client = GladiaClient(base_options)

  merged_client = client.live_v2(
    api_key="override-key",
    api_url="https://live.example.org",
    region="us-west",
    http_headers={"x-gladia-version": "override", "X-Custom": "1"},
    http_timeout=15,
    http_retry=HttpRetryOptions(max_attempts=3),
    ws_timeout=25,
    ws_retry=WebSocketRetryOptions(max_attempts_per_connection=4),
  )

  assert isinstance(merged_client, FakeLiveV2Client)
  options = merged_client.options

  assert options is not client.options
  assert client.options.api_key == "base-key"
  assert client.options.http_headers == base_headers

  assert options.api_key == "override-key"
  assert options.api_url == "https://live.example.org"
  assert options.region == "us-west"
  assert options.http_timeout == 15
  assert options.http_retry.max_attempts == 3
  assert options.ws_timeout == 25
  assert options.ws_retry.max_attempts_per_connection == 4

  expected_version = f"SdkPython/{SDK_VERSION}"
  assert options.http_headers["x-gladia-key"] == "override-key"
  assert options.http_headers["x-gladia-version"] == f"override {expected_version}"
  assert options.http_headers["X-Custom"] == "1"

  assert len(patched_live_v2_client) == 1


def test_live_v2_accepts_prebuilt_options(patched_live_v2_client):
  """Live (sync): accepts a single GladiaClientOptions instance."""
  client = GladiaClient(
    api_key="base-key",
    api_url="https://api.example.com",
    http_headers={"x-gladia-version": "base"},
  )

  provided = GladiaClientOptions(
    api_key="provided-key",
    api_url="https://alt.example.net",
    region="us-west",
    http_headers={"x-gladia-version": "provided"},
    http_timeout=12,
    http_retry=HttpRetryOptions(max_attempts=6),
    ws_timeout=4,
    ws_retry=WebSocketRetryOptions(max_attempts_per_connection=8),
  )

  merged_client = client.live_v2(provided)

  assert isinstance(merged_client, FakeLiveV2Client)
  options = merged_client.options

  assert options.api_key == "provided-key"
  assert options.api_url == "https://alt.example.net"
  assert options.region == "us-west"
  assert options.http_timeout == 12
  assert options.http_retry.max_attempts == 6
  assert options.ws_timeout == 4
  assert options.ws_retry.max_attempts_per_connection == 8

  expected_version = f"SdkPython/{SDK_VERSION}"
  assert options.http_headers["x-gladia-key"] == "provided-key"
  assert options.http_headers["x-gladia-version"] == f"provided {expected_version}"

  assert len(patched_live_v2_client) == 1


def test_async_live_v2_merges_inline_overrides(patched_async_live_v2_client):
  """Live async: each parameter override is merged and passed to LiveV2AsyncClient."""
  base_headers = {"x-gladia-version": "base", "Base-Header": "keep"}
  base_options = GladiaClientOptions(
    api_key="base-key",
    api_url="https://api.example.com",
    region="eu-west",
    http_headers=base_headers.copy(),
    http_timeout=5,
    ws_timeout=7,
  )

  client = GladiaClient(base_options)

  merged_client = client.live_v2_async(
    api_key="override-key",
    api_url="https://live-async.example.org",
    region="us-west",
    http_headers={"x-gladia-version": "override", "X-Custom": "1"},
    http_timeout=15,
    http_retry=HttpRetryOptions(max_attempts=3),
    ws_timeout=25,
    ws_retry=WebSocketRetryOptions(max_attempts_per_connection=4),
  )

  assert isinstance(merged_client, FakeLiveV2AsyncClient)
  options = merged_client.options

  assert options is not client.options
  assert client.options.api_key == "base-key"
  assert client.options.http_headers == base_headers

  assert options.api_key == "override-key"
  assert options.api_url == "https://live-async.example.org"
  assert options.region == "us-west"
  assert options.http_timeout == 15
  assert options.http_retry.max_attempts == 3
  assert options.ws_timeout == 25
  assert options.ws_retry.max_attempts_per_connection == 4

  expected_version = f"SdkPython/{SDK_VERSION}"
  assert options.http_headers["x-gladia-key"] == "override-key"
  assert options.http_headers["x-gladia-version"] == f"override {expected_version}"
  assert options.http_headers["X-Custom"] == "1"

  assert len(patched_async_live_v2_client) == 1


def test_async_live_v2_accepts_prebuilt_options(patched_async_live_v2_client):
  """Live async: accepts a single GladiaClientOptions instance."""
  client = GladiaClient(
    api_key="base-key",
    api_url="https://api.example.com",
    http_headers={"x-gladia-version": "base"},
  )

  provided = GladiaClientOptions(
    api_key="provided-key",
    api_url="https://alt.example.net",
    region="us-west",
    http_headers={"x-gladia-version": "provided"},
    http_timeout=12,
    http_retry=HttpRetryOptions(max_attempts=6),
    ws_timeout=4,
    ws_retry=WebSocketRetryOptions(max_attempts_per_connection=8),
  )

  merged_client = client.live_v2_async(provided)

  assert isinstance(merged_client, FakeLiveV2AsyncClient)
  options = merged_client.options

  assert options.api_key == "provided-key"
  assert options.api_url == "https://alt.example.net"
  assert options.region == "us-west"
  assert options.http_timeout == 12
  assert options.http_retry.max_attempts == 6
  assert options.ws_timeout == 4
  assert options.ws_retry.max_attempts_per_connection == 8

  expected_version = f"SdkPython/{SDK_VERSION}"
  assert options.http_headers["x-gladia-key"] == "provided-key"
  assert options.http_headers["x-gladia-version"] == f"provided {expected_version}"

  assert provided.api_key == "provided-key"
  assert provided.http_headers == {"x-gladia-version": "provided"}

  assert len(patched_async_live_v2_client) == 1
