"""Gladia Python SDK client entrypoint."""

from __future__ import annotations

import dataclasses
from typing import cast, overload

from gladiaio_sdk.client_options import (
  GladiaClientOptions,
  HttpRetryOptions,
  Region,
  WebSocketRetryOptions,
)
from gladiaio_sdk.v2.live.async_client import LiveV2AsyncClient
from gladiaio_sdk.v2.live.client import LiveV2Client
from gladiaio_sdk.version import SDK_VERSION


def normalize_gladia_headers(headers: dict[str, str]) -> dict[str, str]:
  new_headers: dict[str, str] = {}
  for key, value in headers.items():
    lc_key = key.lower()
    if lc_key.startswith("x-gladia-"):
      new_headers[lc_key] = value
    else:
      new_headers[key] = value
  return new_headers


def _assert_valid_options(options: GladiaClientOptions) -> None:
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


gladia_version = f"SdkPython/{SDK_VERSION}"


class GladiaClient:
  """
  Entrypoint for Gladia SDK
  """

  options: GladiaClientOptions

  @overload
  def __init__(
    self,
    *,
    api_key: str | None = None,
    api_url: str | None = None,
    region: Region | None = None,
    http_headers: dict[str, str] | None = None,
    http_retry: HttpRetryOptions | None = None,
    http_timeout: float | None = None,
    ws_retry: WebSocketRetryOptions | None = None,
    ws_timeout: float | None = None,
  ) -> None: ...
  @overload
  def __init__(
    self,
    opts: GladiaClientOptions,
  ) -> None: ...
  def __init__(self, *args, **kwargs) -> None:
    self.options = args[0] if len(args) > 0 and args[0] else GladiaClientOptions(**kwargs)

  @overload
  def live_v2(
    self,
    *,
    api_key: str | None = None,
    api_url: str | None = None,
    region: Region | None = None,
    http_headers: dict[str, str] | None = None,
    http_retry: HttpRetryOptions | None = None,
    http_timeout: float | None = None,
    ws_retry: WebSocketRetryOptions | None = None,
    ws_timeout: float | None = None,
  ) -> LiveV2Client: ...
  @overload
  def live_v2(
    self,
    opts: GladiaClientOptions,
  ) -> LiveV2Client: ...
  def live_v2(self, *args, **kwargs) -> LiveV2Client:
    merged_options = self._merge_options(*args, **kwargs)
    return LiveV2Client(merged_options)

  @overload
  def live_v2_async(
    self,
    *,
    api_key: str | None = None,
    api_url: str | None = None,
    region: Region | None = None,
    http_headers: dict[str, str] | None = None,
    http_retry: HttpRetryOptions | None = None,
    http_timeout: float | None = None,
    ws_retry: WebSocketRetryOptions | None = None,
    ws_timeout: float | None = None,
  ) -> LiveV2AsyncClient: ...
  @overload
  def live_v2_async(
    self,
    opts: GladiaClientOptions,
  ) -> LiveV2AsyncClient: ...
  def live_v2_async(self, *args, **kwargs) -> LiveV2AsyncClient:
    merged_options = self._merge_options(*args, **kwargs)
    return LiveV2AsyncClient(merged_options)

  def _merge_options(self, *args, **kwargs) -> GladiaClientOptions:
    merged_options: GladiaClientOptions = self.options
    if len(args) > 0 and args[0]:
      merged_options = cast(GladiaClientOptions, args[0])
    else:
      merged_options = dataclasses.replace(self.options, **kwargs)

    http_headers = normalize_gladia_headers(merged_options.http_headers)

    if merged_options.api_key:
      http_headers["x-gladia-key"] = merged_options.api_key
    if "x-gladia-version" in http_headers:
      http_headers["x-gladia-version"] = (
        f"{merged_options.http_headers['x-gladia-version'].strip()} {gladia_version}"
      )
    else:
      http_headers["x-gladia-version"] = gladia_version

    merged_options = dataclasses.replace(merged_options, http_headers=http_headers)

    # Validate
    _assert_valid_options(merged_options)

    return merged_options
