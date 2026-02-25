"""Fixtures for integration tests (real API).

Set GLADIA_API_KEY and optionally GLADIA_TEST_AUDIO_PATH or GLADIA_TEST_AUDIO_URL
to run these tests. They are skipped when the API key or audio source is not set.
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

from gladiaio_sdk import GladiaClient
from gladiaio_sdk.client_options import GladiaClientOptions


def _get_api_key() -> str | None:
  return os.environ.get("GLADIA_API_KEY")


def _get_audio_path() -> Path | None:
  raw = os.environ.get("GLADIA_TEST_AUDIO_PATH")
  if not raw:
    return None
  p = Path(raw)
  return p if p.is_file() else None


def _get_audio_url() -> str | None:
  raw = os.environ.get("GLADIA_TEST_AUDIO_URL")
  if not raw or not raw.startswith(("http://", "https://")):
    return None
  return raw


def _has_audio_source() -> bool:
  return _get_audio_path() is not None or _get_audio_url() is not None


requires_api_key = pytest.mark.skipif(
  not _get_api_key(),
  reason="GLADIA_API_KEY not set",
)

requires_audio = pytest.mark.skipif(
  not _has_audio_source(),
  reason="GLADIA_TEST_AUDIO_PATH or GLADIA_TEST_AUDIO_URL not set or invalid",
)


@pytest.fixture(scope="session")
def api_key() -> str | None:
  return _get_api_key()


@pytest.fixture(scope="session")
def options(api_key: str | None):
  if not api_key:
    pytest.skip("GLADIA_API_KEY not set")
  return GladiaClientOptions(
    api_key=api_key,
    api_url=os.environ.get("GLADIA_API_URL", "https://api.gladia.io"),
  )


@pytest.fixture(scope="session")
def gladia_client(options: GladiaClientOptions):
  return GladiaClient(options)


@pytest.fixture(scope="session")
def audio_path() -> Path | None:
  return _get_audio_path()


@pytest.fixture(scope="session")
def audio_url() -> str | None:
  return _get_audio_url()


@pytest.fixture(scope="session")
def audio_source(audio_path: Path | None, audio_url: str | None):
  """One of: Path to local file, or URL string. Skip if neither set."""
  if audio_path is not None:
    return audio_path
  if audio_url:
    return audio_url
  pytest.skip("GLADIA_TEST_AUDIO_PATH or GLADIA_TEST_AUDIO_URL not set or invalid")
