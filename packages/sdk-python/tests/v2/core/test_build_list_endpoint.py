"""Unit tests for V2JobCore.build_list_endpoint query encoding."""

from __future__ import annotations

from urllib.parse import parse_qs, urlparse

from gladiaio_sdk.v2.core import V2JobCore


def test_build_list_endpoint_without_params() -> None:
  core = V2JobCore(base_path="/v2/pre-recorded", kind="Pre-recorded")
  assert core.build_list_endpoint() == "/v2/pre-recorded"
  assert core.build_list_endpoint(None) == "/v2/pre-recorded"


def test_build_list_endpoint_keeps_only_query_of_pagination_url() -> None:
  core = V2JobCore(base_path="/v2/live", kind="Live")
  next_url = "https://api.gladia.io/v2/live?offset=20&limit=20&status=done"
  assert (
    core.build_list_endpoint(
      {
        "url": next_url,
        "offset": 0,
        "status": ["error"],
      }
    )
    == "/v2/live?offset=20&limit=20&status=done"
  )


def test_build_list_endpoint_never_keeps_origin_of_pagination_url() -> None:
  core = V2JobCore(base_path="/v2/live", kind="Live")
  assert (
    core.build_list_endpoint({"url": "http://attacker.example/v2/live?offset=20&limit=20"})
    == "/v2/live?offset=20&limit=20"
  )
  assert (
    core.build_list_endpoint({"url": "//attacker.example/v2/live?offset=20"})
    == "/v2/live?offset=20"
  )


def test_build_list_endpoint_accepts_relative_prefixed_and_trailing_slash_urls() -> None:
  core = V2JobCore(base_path="/v2/live", kind="Live")
  assert core.build_list_endpoint({"url": "/v2/live?offset=20"}) == "/v2/live?offset=20"
  assert (
    core.build_list_endpoint({"url": "https://proxy.example/gladia/v2/live/?offset=20"})
    == "/v2/live?offset=20"
  )
  assert core.build_list_endpoint({"url": "https://api.gladia.io/v2/live"}) == "/v2/live"


def test_build_list_endpoint_always_targets_the_collection() -> None:
  live = V2JobCore(base_path="/v2/live", kind="Live")
  prerecorded = V2JobCore(base_path="/v2/pre-recorded", kind="Pre-recorded")
  assert live.build_list_endpoint({"url": "http://169.254.169.254/latest/meta-data/"}) == "/v2/live"
  assert (
    prerecorded.build_list_endpoint(
      {"url": "https://api.gladia.io/v2/transcription?status=done&offset=20&limit=20"}
    )
    == "/v2/pre-recorded?status=done&offset=20&limit=20"
  )
  assert live.build_list_endpoint({"url": "?offset=20"}) == "/v2/live?offset=20"


def test_build_list_endpoint_serializes_scalars() -> None:
  core = V2JobCore(base_path="/v2/live", kind="Live")
  url = core.build_list_endpoint(
    {
      "offset": 10,
      "limit": 5,
      "date": "2026-09-10",
      "before_date": "2026-09-10T10:38:56.452Z",
      "after_date": "2026-09-01T00:00:00.000Z",
    }
  )
  parsed = urlparse(url)
  assert parsed.path == "/v2/live"
  qs = parse_qs(parsed.query)
  assert qs["offset"] == ["10"]
  assert qs["limit"] == ["5"]
  assert qs["date"] == ["2026-09-10"]
  assert qs["before_date"] == ["2026-09-10T10:38:56.452Z"]
  assert qs["after_date"] == ["2026-09-01T00:00:00.000Z"]


def test_build_list_endpoint_serializes_status_repeated() -> None:
  core = V2JobCore(base_path="/v2/pre-recorded", kind="Pre-recorded")
  url = core.build_list_endpoint({"status": ["done", "error"]})
  assert "status=done" in url
  assert "status=error" in url
  assert url.count("status=") == 2


def test_build_list_endpoint_serializes_custom_metadata_brackets() -> None:
  core = V2JobCore(base_path="/v2/pre-recorded", kind="Pre-recorded")
  url = core.build_list_endpoint({"custom_metadata": {"user": "John Doe", "env": "prod"}})
  qs = parse_qs(urlparse(url).query)
  assert qs["custom_metadata[user]"] == ["John Doe"]
  assert qs["custom_metadata[env]"] == ["prod"]


def test_build_list_endpoint_omits_none_values() -> None:
  core = V2JobCore(base_path="/v2/live", kind="Live")
  url = core.build_list_endpoint({"offset": 0, "limit": None, "status": None})
  assert url == "/v2/live?offset=0"
