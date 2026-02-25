"""Fixtures for live client tests."""

from __future__ import annotations

import pytest

from gladiaio_sdk.client_options import GladiaClientOptions


class FakeLiveV2Client:
  def __init__(self, options: GladiaClientOptions) -> None:  # pragma: no cover
    self.options = options


class FakeLiveV2AsyncClient:
  def __init__(self, options: GladiaClientOptions) -> None:  # pragma: no cover
    self.options = options


@pytest.fixture
def patched_live_v2_client(monkeypatch):
  created: list[FakeLiveV2Client] = []

  def _factory(options: GladiaClientOptions) -> FakeLiveV2Client:
    client = FakeLiveV2Client(options)
    created.append(client)
    return client

  monkeypatch.setattr("gladiaio_sdk.client.LiveV2Client", _factory)
  return created


@pytest.fixture
def patched_async_live_v2_client(monkeypatch):
  created_clients: list[FakeLiveV2AsyncClient] = []

  def _factory(options: GladiaClientOptions) -> FakeLiveV2AsyncClient:
    client = FakeLiveV2AsyncClient(options)
    created_clients.append(client)
    return client

  monkeypatch.setattr("gladiaio_sdk.client.LiveV2AsyncClient", _factory)

  return created_clients
