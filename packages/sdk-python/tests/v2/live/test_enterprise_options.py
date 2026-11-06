"""The options only the Gladia Enterprise API knows (``LiveV2EnterpriseInitRequest``): typed,
sent as they are, and still readable after a round trip through a dict."""

from __future__ import annotations

import warnings

import pytest

from gladiaio_sdk import LiveV2EnterpriseInitRequest, LiveV2InitRequest
from gladiaio_sdk.v2.live._helpers import build_init_body, parse_init_options
from gladiaio_sdk.v2.live.enterprise_types import (
  init_body_for,
  is_gladia_cloud,
  reset_enterprise_warnings,
)


def test_finals_is_sent_as_it_is() -> None:
  options = LiveV2EnterpriseInitRequest(encoding="wav/pcm", finals="sentence")
  assert isinstance(options, LiveV2InitRequest)  # start_session takes it like any init request
  assert options.to_dict() == {"encoding": "wav/pcm", "finals": "sentence"}
  assert build_init_body(options) == {
    "encoding": "wav/pcm",
    "finals": "sentence",
    "messages_config": {"receive_acknowledgments": True},
  }


def test_finals_is_omitted_when_unset() -> None:
  assert LiveV2EnterpriseInitRequest(encoding="wav/pcm").to_dict() == {"encoding": "wav/pcm"}


def test_round_trip_through_a_dict() -> None:
  options = LiveV2EnterpriseInitRequest.from_dict({"encoding": "wav/pcm", "finals": "endpointing"})
  assert options.finals == "endpointing"
  assert options.to_dict() == {"encoding": "wav/pcm", "finals": "endpointing"}
  # a plain dict stays the untyped way in: still sent as it is
  assert parse_init_options({"finals": "endpointing"}).to_dict() == {"finals": "endpointing"}


def test_the_cloud_api_gets_no_enterprise_field_and_one_warning() -> None:
  """The cloud API refuses an unknown field (400 "property finals should not exist"): the same
  code must run on both, so the field is dropped there, once warned."""
  reset_enterprise_warnings()
  assert is_gladia_cloud("https://api.gladia.io")
  assert not is_gladia_cloud("https://eu1.api.gladia.io")
  assert not is_gladia_cloud("http://localhost:8080")
  body = {"encoding": "wav/pcm", "finals": "sentence"}
  with pytest.warns(UserWarning, match='"finals" is a Gladia Enterprise option'):
    assert init_body_for(body, "https://api.gladia.io") == {"encoding": "wav/pcm"}
  with warnings.catch_warnings():
    warnings.simplefilter("error")  # the second drop is silent
    assert init_body_for(body, "https://api.gladia.io") == {"encoding": "wav/pcm"}
    # an Enterprise deployment, a proxy, or no URL known: sent as it is
    assert init_body_for(body, "https://eu1.api.gladia.io") is body
    assert init_body_for(body, None) is body
  assert body == {"encoding": "wav/pcm", "finals": "sentence"}  # never changed in place
