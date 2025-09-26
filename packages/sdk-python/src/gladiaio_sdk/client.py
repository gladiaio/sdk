"""Gladia Python SDK client entrypoint."""

from __future__ import annotations

import os
from typing import cast, overload

from typing_extensions import Unpack

from gladiaio_sdk.client_options import (
  GladiaClientOptions,
  HttpRetryOptions,
  InternalGladiaClientOptions,
  Region,
  WebSocketRetryOptions,
)
from gladiaio_sdk.helpers import deep_merge_dicts
from gladiaio_sdk.v2.live.async_client import AsyncLiveV2Client


def _assert_valid_options(options: InternalGladiaClientOptions) -> None:
  try:
    from urllib.parse import urlparse

    url = urlparse(str(options.api_url))
  except Exception as err:
    raise ValueError(f'Invalid url: "{options.api_url}".') from err

  if not options.api_key and (url.hostname or "").endswith(".gladia.io"):
    raise ValueError('You have to set your "api_key" or define a proxy "api_url".')

  if url.scheme not in ["https", "http", "wss", "ws"]:
    raise ValueError(
      f"Only HTTP and WebSocket protocols are supported for api_url (received: {url.scheme})."
    )


def default_http_delay(attempt: int) -> float:
  return min(0.3 * (2 ** (attempt - 1)), 10)


def default_ws_delay(attempt: int) -> float:
  return min(0.3 * (2 ** (attempt - 1)), 2)


default_options: GladiaClientOptions = {
  "api_key": os.environ.get("GLADIA_API_KEY"),
  "api_url": os.environ.get("GLADIA_API_URL", "https://api.gladia.io"),
  "region": cast(Region | None, os.environ.get("GLADIA_REGION")),
  "http_headers": {
    "X-GLADIA-ORIGIN": "sdk/py",
  },
  "http_retry": {
    "max_attempts": 2,
    "status_codes": [408, 413, (500, 599), 429],
    "delay": default_http_delay,
  },
  "http_timeout": 10,
  "ws_retry": {
    "max_attempts_per_connection": 5,
    "close_codes": [(1002, 4399), (4500, 9999)],
    "delay": default_ws_delay,
    "max_connections": 0,
  },
  "ws_timeout": 10,
}


class GladiaClient:
  options: GladiaClientOptions

  @overload
  def __init__(
    self,
    *,
    api_key: str | None = ...,
    api_url: str | None = ...,
    region: Region | None = ...,
    http_headers: dict[str, str] | None = ...,
    http_retry: HttpRetryOptions | None = ...,
    http_timeout: float | None = ...,
    ws_retry: WebSocketRetryOptions | None = ...,
    ws_timeout: float | None = ...,
  ) -> None: ...
  def __init__(self, **opts: Unpack[GladiaClientOptions]) -> None:
    self.options = deep_merge_dicts(
      default_options,
      opts,
    )

  @overload
  def async_live_v2(
    self,
    *,
    api_key: str | None = ...,
    api_url: str | None = ...,
    region: Region | None = ...,
    http_headers: dict[str, str] | None = ...,
    http_retry: HttpRetryOptions | None = ...,
    http_timeout: float | None = ...,
    ws_retry: WebSocketRetryOptions | None = ...,
    ws_timeout: float | None = ...,
  ) -> AsyncLiveV2Client: ...
  def async_live_v2(self, **opts: Unpack[GladiaClientOptions]) -> AsyncLiveV2Client:
    merged_options = InternalGladiaClientOptions(
      **deep_merge_dicts(
        self.options,
        opts,
      ),
    )
    if merged_options.api_key:
      merged_options.http_headers = deep_merge_dicts(
        merged_options.http_headers,
        {
          "X-GLADIA-KEY": merged_options.api_key,
        },
      )

    # Validate
    _assert_valid_options(merged_options)

    return AsyncLiveV2Client(merged_options)
