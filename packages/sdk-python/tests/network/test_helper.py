"""Tests for network URL helpers."""

from __future__ import annotations

from gladiaio_sdk.network.helper import build_url


def test_build_url_absolute_passthrough() -> None:
  assert (
    build_url("wss://api.gladia.io", "wss://api.gladia.io/v2/live/ws?token=abc")
    == "wss://api.gladia.io/v2/live/ws?token=abc"
  )


def test_build_url_joins_path_with_query_at_end() -> None:
  assert (
    build_url("https://api.gladia.io", "/v2/live/ws?token=abc")
    == "https://api.gladia.io/v2/live/ws?token=abc"
  )


def test_build_url_keeps_base_query_at_end() -> None:
  # String concatenation would produce ...?region=eu-west/v2/live
  assert (
    build_url("https://api.gladia.io?region=eu-west", "/v2/live")
    == "https://api.gladia.io/v2/live?region=eu-west"
  )


def test_build_url_merges_query_params_relative_wins() -> None:
  assert (
    build_url("https://api.gladia.io?region=eu-west", "/v2/live/ws?token=abc")
    == "https://api.gladia.io/v2/live/ws?region=eu-west&token=abc"
  )


def test_build_url_preserves_proxy_path_prefix() -> None:
  assert (
    build_url("wss://proxy.example/gladia", "/v2/live/ws?token=abc")
    == "wss://proxy.example/gladia/v2/live/ws?token=abc"
  )
