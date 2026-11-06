from __future__ import annotations

from gladiaio_sdk import LiveV2XmlEvent, is_xml_event, parse_xml_event
from gladiaio_sdk.v2.live.generated_types import LiveV2TranscriptMessage


def _message(text: str, event_id: str = "xml_3f9a1c2e_00000007") -> dict:
  return {
    "type": "transcript",
    "session_id": "0199d7a2-5c3e-7b41-9f0a-3c2d1e4f5a6b",
    "created_at": "2026-11-06T15:02:11.402Z",
    "data": {
      "id": event_id,
      "is_final": True,
      "utterance": {
        "text": text,
        "start": 3.84,
        "end": 3.84,
        "channel": 0,
        "language": "fr",
        "confidence": 1,
        "words": [],
      },
    },
  }


EOT = '<end_of_turn channel="0" probability="0.97" reason="model" end="3.84"/>'


def test_an_end_of_turn_tag_is_read_back() -> None:
  event = parse_xml_event(_message(EOT))
  assert event == LiveV2XmlEvent(
    tag="end_of_turn",
    attributes={"channel": "0", "probability": "0.97", "reason": "model", "end": "3.84"},
  )
  assert event is not None
  assert event.error is None


def test_the_sdk_typed_message_works_too() -> None:
  message = LiveV2TranscriptMessage.from_dict(_message(EOT))
  assert is_xml_event(message)
  event = parse_xml_event(message)
  assert event is not None
  assert event.tag == "end_of_turn"


def test_text_and_children_and_escapes() -> None:
  text = (
    '<named_entities channel="0" start="1.02" end="3.84">'
    '<entity entity_type="ORG" start="3.1" end="3.4">Tom &amp; Jerry</entity></named_entities>'
  )
  event = parse_xml_event(text)
  assert event is not None
  assert event.tag == "named_entities"
  [entity] = event.children
  assert entity.attributes["entity_type"] == "ORG"
  assert entity.text == "Tom & Jerry"


def test_a_failed_event_gives_its_reason() -> None:
  event = parse_xml_event('<translation from="fr" to="en" error="translation timed out"/>')
  assert event is not None
  assert event.error == "translation timed out"


def test_speech_and_other_messages_are_not_events() -> None:
  speech = _message("Bonjour, je voudrais réserver une table.", event_id="00_00000003")
  assert not is_xml_event(speech)
  assert parse_xml_event(speech) is None
  assert parse_xml_event({"type": "speech_start", "data": {"time": 1.0}}) is None
  assert parse_xml_event("hello") is None
  assert parse_xml_event("<broken") is None
