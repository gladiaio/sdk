"""x-gladia-key must not be forwarded on cross-origin redirects.

Production trigger: GET /v2/.../file → 302 to signed object storage.
"""

from __future__ import annotations

import asyncio
import threading
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any

import pytest

from gladiaio_sdk import GladiaClient
from gladiaio_sdk.client_options import HttpRetryOptions
from gladiaio_sdk.network import AsyncHttpClient, HttpClient


@dataclass
class CapturedRequest:
  path: str
  headers: dict[str, str]


@dataclass
class RedirectPair:
  origin_base: str
  sink_origin: str
  captured: list[CapturedRequest] = field(default_factory=list)
  origin_captured: list[CapturedRequest] = field(default_factory=list)
  _servers: list[HTTPServer] = field(default_factory=list)
  _threads: list[threading.Thread] = field(default_factory=list)

  def close(self) -> None:
    for server in self._servers:
      server.shutdown()
      server.server_close()
    for thread in self._threads:
      thread.join(timeout=2)


SECRET_KEY = "DUMMY-KEY-REDIRECT-LEAK-TEST"


def _start_redirect_pair() -> RedirectPair:
  pair = RedirectPair(origin_base="", sink_origin="")

  class SinkHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
      pair.captured.append(
        CapturedRequest(
          path=self.path,
          headers={k.lower(): v for k, v in self.headers.items()},
        )
      )
      body = b"file-bytes"
      self.send_response(200)
      self.send_header("Content-Type", "application/octet-stream")
      self.send_header("Content-Length", str(len(body)))
      self.end_headers()
      self.wfile.write(body)

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
      return

  class OriginHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
      pair.origin_captured.append(
        CapturedRequest(
          path=self.path,
          headers={k.lower(): v for k, v in self.headers.items()},
        )
      )
      location = f"{pair.sink_origin}/collect{self.path}"
      self.send_response(302)
      self.send_header("Location", location)
      self.end_headers()

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
      return

  sink = HTTPServer(("127.0.0.1", 0), SinkHandler)
  origin = HTTPServer(("127.0.0.1", 0), OriginHandler)
  pair.sink_origin = f"http://127.0.0.1:{sink.server_address[1]}"
  pair.origin_base = f"http://127.0.0.1:{origin.server_address[1]}"
  pair._servers = [sink, origin]

  for server in pair._servers:
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    pair._threads.append(thread)

  return pair


@pytest.fixture
def redirect_pair():
  pair = _start_redirect_pair()
  try:
    yield pair
  finally:
    pair.close()


def _no_retry() -> HttpRetryOptions:
  return HttpRetryOptions(max_attempts=1, status_codes=[], delay=lambda _n: 0)


def test_sync_http_client_does_not_forward_x_gladia_key_on_cross_origin_redirect(
  redirect_pair: RedirectPair,
) -> None:
  client = HttpClient(
    base_url=redirect_pair.origin_base,
    headers={
      "x-gladia-key": SECRET_KEY,
      "x-gladia-version": "SdkPython/test",
    },
    query_params={},
    retry=_no_retry(),
    timeout=5.0,
  )
  try:
    response = client.get("/v2/pre-recorded/job-id/file")
    assert response.status_code == 200
    assert response.content == b"file-bytes"
  finally:
    client.close()

  assert len(redirect_pair.captured) == 1
  assert redirect_pair.origin_captured[0].headers["x-gladia-key"] == SECRET_KEY
  assert "x-gladia-key" not in redirect_pair.captured[0].headers
  assert redirect_pair.captured[0].headers["x-gladia-version"] == "SdkPython/test"


def test_async_http_client_does_not_forward_x_gladia_key_on_cross_origin_redirect(
  redirect_pair: RedirectPair,
) -> None:
  async def run() -> None:
    client = AsyncHttpClient(
      base_url=redirect_pair.origin_base,
      headers={
        "x-gladia-key": SECRET_KEY,
        "x-gladia-version": "SdkPython/test",
      },
      query_params={},
      retry=_no_retry(),
      timeout=5.0,
    )
    try:
      response = await client.get("/v2/pre-recorded/job-id/file")
      assert response.status_code == 200
      assert response.content == b"file-bytes"
    finally:
      await client.close()

  asyncio.run(run())

  assert len(redirect_pair.captured) == 1
  assert "x-gladia-key" not in redirect_pair.captured[0].headers


def test_prerecorded_get_file_does_not_forward_x_gladia_key_on_cross_origin_redirect(
  redirect_pair: RedirectPair,
) -> None:
  gladia = GladiaClient(
    api_key=SECRET_KEY,
    api_url=redirect_pair.origin_base,
    http_retry=_no_retry(),
    http_timeout=5.0,
  )
  content = gladia.prerecorded().get_file("job-id")
  assert content == b"file-bytes"

  assert len(redirect_pair.captured) == 1
  assert "x-gladia-key" not in redirect_pair.captured[0].headers


def test_live_get_file_does_not_forward_x_gladia_key_on_cross_origin_redirect(
  redirect_pair: RedirectPair,
) -> None:
  gladia = GladiaClient(
    api_key=SECRET_KEY,
    api_url=redirect_pair.origin_base,
    http_retry=_no_retry(),
    http_timeout=5.0,
  )
  content = gladia.live().get_file("job-id")
  assert content == b"file-bytes"

  assert len(redirect_pair.captured) == 1
  assert "x-gladia-key" not in redirect_pair.captured[0].headers
