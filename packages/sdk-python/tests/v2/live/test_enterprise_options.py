"""The options only the Gladia Enterprise API knows (``LiveV2EnterpriseInitRequest``): typed,
sent as they are, and still readable after a round trip through a dict."""

from __future__ import annotations

from gladiaio_sdk import LiveV2EnterpriseInitRequest, LiveV2InitRequest
from gladiaio_sdk.v2.live._helpers import build_init_body, parse_init_options


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
