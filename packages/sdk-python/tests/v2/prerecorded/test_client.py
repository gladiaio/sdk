"""Tests for the high-level Gladia client (pre-recorded v2 sync and async)."""

from __future__ import annotations

from gladiaio_sdk.client import GladiaClient
from gladiaio_sdk.client_options import GladiaClientOptions, HttpRetryOptions
from gladiaio_sdk.version import SDK_VERSION

from .conftest import FakePreRecordedV2AsyncClient, FakePreRecordedV2Client


def test_pre_recorded_v2_merges_inline_overrides(patched_pre_recorded_v2_client):
  """Pre-recorded sync: each parameter override is merged and passed to PreRecordedV2Client."""
  base_headers = {"x-gladia-version": "base"}
  base_options = GladiaClientOptions(
    api_key="base-key",
    api_url="https://api.example.com",
    region="eu-west",
    http_headers=base_headers.copy(),
    http_timeout=5,
  )

  client = GladiaClient(base_options)

  merged_client = client.pre_recorded_v2(
    api_key="override-key",
    api_url="https://pr.example.org",
    region="us-west",
    http_headers={"x-gladia-version": "override", "X-Custom": "1"},
    http_timeout=60,
    http_retry=HttpRetryOptions(max_attempts=3),
  )

  assert isinstance(merged_client, FakePreRecordedV2Client)
  options = merged_client.options

  assert options is not client.options
  assert options.api_key == "override-key"
  assert options.api_url == "https://pr.example.org"
  assert options.region == "us-west"
  assert options.http_timeout == 60
  assert options.http_retry.max_attempts == 3

  expected_version = f"SdkPython/{SDK_VERSION}"
  assert options.http_headers["x-gladia-key"] == "override-key"
  assert options.http_headers["x-gladia-version"] == f"override {expected_version}"
  assert options.http_headers["X-Custom"] == "1"

  assert len(patched_pre_recorded_v2_client) == 1


def test_pre_recorded_v2_accepts_prebuilt_options(patched_pre_recorded_v2_client):
  """Pre-recorded sync: accepts a single GladiaClientOptions instance."""
  client = GladiaClient(api_key="base-key", api_url="https://api.example.com")

  provided = GladiaClientOptions(
    api_key="provided-key",
    api_url="https://alt.example.net",
    region="us-west",
    http_headers={"x-gladia-version": "provided"},
    http_timeout=120,
    http_retry=HttpRetryOptions(max_attempts=6),
  )

  merged_client = client.pre_recorded_v2(provided)

  assert isinstance(merged_client, FakePreRecordedV2Client)
  options = merged_client.options

  assert options.api_key == "provided-key"
  assert options.api_url == "https://alt.example.net"
  assert options.region == "us-west"
  assert options.http_timeout == 120
  assert options.http_retry.max_attempts == 6

  expected_version = f"SdkPython/{SDK_VERSION}"
  assert options.http_headers["x-gladia-key"] == "provided-key"
  assert options.http_headers["x-gladia-version"] == f"provided {expected_version}"

  assert len(patched_pre_recorded_v2_client) == 1


def test_pre_recorded_v2_default_http_timeout_300(patched_pre_recorded_v2_client):
  """Pre-recorded sync: default http_timeout is 300 when not overridden."""
  client = GladiaClient(
    api_key="base-key",
    api_url="https://api.example.com",
    http_timeout=10,
  )

  merged_client = client.pre_recorded_v2()

  assert isinstance(merged_client, FakePreRecordedV2Client)
  assert merged_client.options.http_timeout == 300
  assert len(patched_pre_recorded_v2_client) == 1


def test_pre_recorded_v2_inline_http_timeout_not_overridden(patched_pre_recorded_v2_client):
  """Pre-recorded sync: explicit http_timeout is preserved (no 300 default)."""
  client = GladiaClient(api_key="base-key", api_url="https://api.example.com")

  merged_client = client.pre_recorded_v2(http_timeout=90)

  assert isinstance(merged_client, FakePreRecordedV2Client)
  assert merged_client.options.http_timeout == 90
  assert len(patched_pre_recorded_v2_client) == 1


def test_pre_recorded_v2_async_merges_inline_overrides(patched_pre_recorded_v2_async_client):
  """Pre-recorded async: each parameter override is merged and passed to PreRecordedV2AsyncClient."""
  base_headers = {"x-gladia-version": "base"}
  base_options = GladiaClientOptions(
    api_key="base-key",
    api_url="https://api.example.com",
    region="eu-west",
    http_headers=base_headers.copy(),
    http_timeout=5,
  )

  client = GladiaClient(base_options)

  merged_client = client.pre_recorded_v2_async(
    api_key="override-key",
    api_url="https://pr-async.example.org",
    region="us-west",
    http_headers={"x-gladia-version": "override", "X-Custom": "1"},
    http_timeout=60,
    http_retry=HttpRetryOptions(max_attempts=3),
  )

  assert isinstance(merged_client, FakePreRecordedV2AsyncClient)
  options = merged_client.options

  assert options is not client.options
  assert options.api_key == "override-key"
  assert options.api_url == "https://pr-async.example.org"
  assert options.region == "us-west"
  assert options.http_timeout == 60
  assert options.http_retry.max_attempts == 3

  expected_version = f"SdkPython/{SDK_VERSION}"
  assert options.http_headers["x-gladia-key"] == "override-key"
  assert options.http_headers["x-gladia-version"] == f"override {expected_version}"
  assert options.http_headers["X-Custom"] == "1"

  assert len(patched_pre_recorded_v2_async_client) == 1


def test_pre_recorded_v2_async_accepts_prebuilt_options(patched_pre_recorded_v2_async_client):
  """Pre-recorded async: accepts a single GladiaClientOptions instance."""
  client = GladiaClient(api_key="base-key", api_url="https://api.example.com")

  provided = GladiaClientOptions(
    api_key="provided-key",
    api_url="https://alt.example.net",
    region="us-west",
    http_headers={"x-gladia-version": "provided"},
    http_timeout=120,
    http_retry=HttpRetryOptions(max_attempts=6),
  )

  merged_client = client.pre_recorded_v2_async(provided)

  assert isinstance(merged_client, FakePreRecordedV2AsyncClient)
  options = merged_client.options

  assert options.api_key == "provided-key"
  assert options.api_url == "https://alt.example.net"
  assert options.region == "us-west"
  assert options.http_timeout == 120
  assert options.http_retry.max_attempts == 6

  expected_version = f"SdkPython/{SDK_VERSION}"
  assert options.http_headers["x-gladia-key"] == "provided-key"
  assert options.http_headers["x-gladia-version"] == f"provided {expected_version}"

  assert len(patched_pre_recorded_v2_async_client) == 1


def test_pre_recorded_v2_async_default_http_timeout_300(patched_pre_recorded_v2_async_client):
  """Pre-recorded async: default http_timeout is 300 when not overridden."""
  client = GladiaClient(
    api_key="base-key",
    api_url="https://api.example.com",
    http_timeout=10,
  )

  merged_client = client.pre_recorded_v2_async()

  assert isinstance(merged_client, FakePreRecordedV2AsyncClient)
  assert merged_client.options.http_timeout == 300
  assert len(patched_pre_recorded_v2_async_client) == 1


def test_pre_recorded_v2_async_inline_http_timeout_not_overridden(
  patched_pre_recorded_v2_async_client,
):
  """Pre-recorded async: explicit http_timeout is preserved (no 300 default)."""
  client = GladiaClient(api_key="base-key", api_url="https://api.example.com")

  merged_client = client.pre_recorded_v2_async(http_timeout=90)

  assert isinstance(merged_client, FakePreRecordedV2AsyncClient)
  assert merged_client.options.http_timeout == 90
  assert len(patched_pre_recorded_v2_async_client) == 1
