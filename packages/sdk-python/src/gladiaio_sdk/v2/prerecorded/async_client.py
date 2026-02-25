"""Pre-recorded V2 async client implementation."""

from __future__ import annotations

import re
from typing import final
from urllib.parse import urlparse

from gladiaio_sdk.client_options import GladiaClientOptions
from gladiaio_sdk.network import AsyncHttpClient

from .async_session import PreRecordedV2AsyncSession


@final
class PreRecordedV2AsyncClient:
  """Async client for the Gladia Pre-Recorded V2 API.

  Provides methods to start a session for creating, polling, retrieving,
  listing, and deleting pre-recorded transcription jobs.
  """

  def __init__(self, options: GladiaClientOptions) -> None:
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

  def session(self) -> PreRecordedV2AsyncSession:
    return PreRecordedV2AsyncSession(http_client=self._http_client)
