from __future__ import annotations

import re
from typing import TYPE_CHECKING, final
from urllib.parse import urlparse

from gladiaio_sdk.client_options import GladiaClientOptions
from gladiaio_sdk.network import HttpClient, WebSocketClient
from gladiaio_sdk.v2.core import V2JobCore
from gladiaio_sdk.v2.live.session import LiveV2Session
from gladiaio_sdk.v2.live.types import LiveV2ConnectSessionOptions

if TYPE_CHECKING:
  from gladiaio_sdk.v2.live.generated_types import LiveV2InitRequest, LiveV2Response


@final
class LiveV2Client:
  def __init__(self, options: GladiaClientOptions) -> None:
    base_http_url = urlparse(options.api_url)
    base_http_url = base_http_url._replace(scheme=re.sub(r"^ws", "http", base_http_url.scheme))

    self._http_client = HttpClient(
      base_url=base_http_url.geturl(),
      headers=options.http_headers,
      query_params={},
      retry=options.http_retry,
      timeout=options.http_timeout,
    )

    base_ws_url = urlparse(options.api_url)
    base_ws_url = base_ws_url._replace(scheme=re.sub(r"^http", "ws", base_ws_url.scheme))
    self._ws_client = WebSocketClient(
      base_url=base_ws_url.geturl(),
      retry=options.ws_retry,
      timeout=options.ws_timeout,
    )

    self._options = options
    self._core = V2JobCore(base_path="/v2/live", kind="Live")

  def start_session(self, options: LiveV2InitRequest) -> LiveV2Session:
    return LiveV2Session(
      options=options,
      http_client=self._http_client,
      ws_client=self._ws_client,
      region=self._options.region,
    )

  def connect_session(self, options: LiveV2ConnectSessionOptions) -> LiveV2Session:
    """Connect to an existing live session using its WebSocket URL and session ID.

    Skips session initialization and connects directly to the WebSocket.
    """
    from gladiaio_sdk.v2.live.generated_types import LiveV2InitRequest, LiveV2InitResponse

    existing_session = LiveV2InitResponse(
      id=options.id,
      url=options.url,
      created_at=options.created_at or "",
    )
    init_options = LiveV2InitRequest(messages_config=options.messages_config)
    return LiveV2Session(
      options=init_options,
      http_client=self._http_client,
      ws_client=self._ws_client,
      existing_session=existing_session,
    )

  def get(self, job_id: str) -> LiveV2Response:
    """Get a live job by ID.

    Args:
      job_id: The UUID of the live job.

    Returns:
      The full job response including status and result if done.
    """
    from gladiaio_sdk.v2.live.generated_types import LiveV2Response

    endpoint = self._core.build_job_endpoint(job_id)
    resp = self._http_client.get(endpoint, {"request_timeout": self._options.live_timeouts.get})
    return LiveV2Response.from_dict(resp.json())

  def delete(self, job_id: str) -> bool:
    """Delete a live job.

    Args:
      job_id: The UUID of the live job to delete.

    Returns:
      True if the job was deleted successfully (HTTP 202), False otherwise.
    """
    endpoint = self._core.build_job_endpoint(job_id)
    resp = self._http_client.delete(
      endpoint, {"request_timeout": self._options.live_timeouts.delete}
    )
    return resp.status_code == 202

  def get_file(self, job_id: str) -> bytes:
    """Download the audio file for a live job.

    Args:
      job_id: The UUID of the live job.

    Returns:
      The raw audio file bytes.
    """
    endpoint = self._core.build_job_file_endpoint(job_id)
    resp = self._http_client.get(
      endpoint, {"request_timeout": self._options.live_timeouts.get_file}
    )
    return resp.content
