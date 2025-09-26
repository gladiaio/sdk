from __future__ import annotations

import re
from typing import TYPE_CHECKING, final
from urllib.parse import urlparse

from gladiaio_sdk.client_options import InternalGladiaClientOptions
from gladiaio_sdk.network.async_http_client import AsyncHttpClient
from gladiaio_sdk.network.async_websocket_client import AsyncWebSocketClient
from gladiaio_sdk.v2.live.async_session import AsyncLiveV2Session

if TYPE_CHECKING:
  from gladiaio_sdk.v2.live.generated_types import LiveV2InitRequest


@final
class AsyncLiveV2Client:
  def __init__(self, options: InternalGladiaClientOptions) -> None:
    # Create HTTP client
    base_http_url = urlparse(options.api_url)
    base_http_url = base_http_url._replace(scheme=re.sub(r"^ws", "http", base_http_url.scheme))

    query_params: dict[str, str] = {}
    if options.region:
      query_params["region"] = options.region

    self._http_client = AsyncHttpClient(
      base_url=base_http_url.geturl(),
      headers=options.http_headers,
      query_params=query_params,
      retry=options.http_retry,
      timeout=options.http_timeout,
    )

    # Create WebSocket client
    base_ws_url = urlparse(options.api_url)
    base_ws_url = base_ws_url._replace(scheme=re.sub(r"^http", "ws", base_ws_url.scheme))
    self._ws_client = AsyncWebSocketClient(
      base_url=base_ws_url.geturl(),
      retry=options.ws_retry,
      timeout=options.ws_timeout,
    )

  def start_session(self, options: LiveV2InitRequest) -> AsyncLiveV2Session:
    return AsyncLiveV2Session(
      options=options, http_client=self._http_client, ws_client=self._ws_client
    )
