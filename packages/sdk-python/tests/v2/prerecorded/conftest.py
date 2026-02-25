"""Fixtures for pre-recorded client tests."""

from __future__ import annotations

import pytest

from gladiaio_sdk.client_options import GladiaClientOptions


class FakePreRecordedV2Client:
  def __init__(self, options: GladiaClientOptions) -> None:  # pragma: no cover
    self.options = options


class FakePreRecordedV2AsyncClient:
  def __init__(self, options: GladiaClientOptions) -> None:  # pragma: no cover
    self.options = options


@pytest.fixture
def patched_pre_recorded_v2_client(monkeypatch):
  created: list[FakePreRecordedV2Client] = []

  def _factory(options: GladiaClientOptions) -> FakePreRecordedV2Client:
    client = FakePreRecordedV2Client(options)
    created.append(client)
    return client

  monkeypatch.setattr("gladiaio_sdk.client.PreRecordedV2Client", _factory)
  return created


@pytest.fixture
def patched_pre_recorded_v2_async_client(monkeypatch):
  created: list[FakePreRecordedV2AsyncClient] = []

  def _factory(options: GladiaClientOptions) -> FakePreRecordedV2AsyncClient:
    client = FakePreRecordedV2AsyncClient(options)
    created.append(client)
    return client

  monkeypatch.setattr("gladiaio_sdk.client.PreRecordedV2AsyncClient", _factory)
  return created
