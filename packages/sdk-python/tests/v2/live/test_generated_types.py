import pytest

from gladiaio_sdk.v2.live.generated_types import (
  LiveV2InitRequest,
  LiveV2MessagesConfig,
  LiveV2StopRecordingAckMessage,
  LiveV2TranscriptMessage,
  LiveV2UnknownWebSocketMessage,
  create_live_v2_web_socket_message_from_dict,
)


def test_message_from_dict_to_dict_without_error():
  message_data = {
    "session_id": "123",
    "created_at": "2021-01-01T00:00:00Z",
    "acknowledged": True,
    "type": "stop_recording",
    "data": {
      "recording_duration": 10,
      "recording_left_to_process": 10,
    },
  }
  message = LiveV2StopRecordingAckMessage.from_dict({**message_data, "error": None})
  assert message.error is None
  assert message.data is not None
  assert message.data.recording_duration == 10
  assert message.data.recording_left_to_process == 10
  assert message.to_dict() == message_data


def test_message_from_dict_to_dict_with_error():
  message_data = {
    "session_id": "123",
    "created_at": "2021-01-01T00:00:00Z",
    "acknowledged": True,
    "type": "stop_recording",
    "error": {
      "message": "Error message",
    },
  }
  message = LiveV2StopRecordingAckMessage.from_dict({**message_data, "data": None})
  assert message.data is None
  assert message.error is not None
  assert message.error.message == "Error message"
  assert message.to_dict() == message_data


def test_message_from_json_to_json_without_error():
  message_json: str = """{
  "session_id": "123",
  "created_at": "2021-01-01T00:00:00Z",
  "acknowledged": true,
  "type": "stop_recording",
  "data": {
    "recording_duration": 10,
    "recording_left_to_process": 10
  },
  "error": null
  }"""
  message = LiveV2StopRecordingAckMessage.from_json(message_json)
  assert message.error is None
  assert message.data is not None
  assert message.data.recording_duration == 10
  assert message.data.recording_left_to_process == 10
  assert (
    message.to_json()
    == '{"session_id": "123", "created_at": "2021-01-01T00:00:00Z", "acknowledged": true, '
    + '"type": "stop_recording", '
    + '"data": {"recording_duration": 10.0, "recording_left_to_process": 10.0}}'
  )


def test_message_from_json_to_json_with_error():
  message_json: str = """{
  "session_id": "123",
  "created_at": "2021-01-01T00:00:00Z",
  "acknowledged": true,
  "type": "stop_recording",
  "data": null,
  "error": {
    "message": "Error message"
  },
  "unknown_field": "unknown_value"
  }"""
  message = LiveV2StopRecordingAckMessage.from_json(message_json)
  assert message.data is None
  assert message.error is not None
  assert message.error.message == "Error message"
  assert (
    message.to_json()
    == '{"session_id": "123", "created_at": "2021-01-01T00:00:00Z", "acknowledged": true, '
    + '"type": "stop_recording", "error": {"message": "Error message"}, '
    + '"unknown_field": "unknown_value"}'
  )


def test_init_request_keeps_unknown_fields():
  options = LiveV2InitRequest.from_dict({"encoding": "wav/pcm", "pii": True, "numerals": True})
  assert options.to_dict() == {"encoding": "wav/pcm", "pii": True, "numerals": True}


def test_unknown_fields_do_not_make_dataclasses_unhashable():
  config = LiveV2MessagesConfig.from_dict({"receive_errors": True, "unknown": {"a": 1}})
  assert hash(config) == hash(LiveV2MessagesConfig(receive_errors=True))
  assert config != LiveV2MessagesConfig(receive_errors=True)


def test_nested_unknown_fields_survive_parsing():
  word = {"word": "hi", "start": 0.0, "end": 0.5, "confidence": 1.0, "speaker": 1}
  utterance = {
    "start": 0.0,
    "end": 0.5,
    "confidence": 1.0,
    "channel": 0,
    "words": [word],
    "text": "hi",
    "language": "en",
    "text_raw": "Hi",
  }
  payload = {
    "session_id": "123",
    "created_at": "2021-01-01T00:00:00Z",
    "type": "transcript",
    "data": {"id": "u1", "is_final": True, "utterance": utterance},
  }
  message = LiveV2TranscriptMessage.from_dict(payload)
  assert message.data is not None
  # Readable as attributes at runtime, like in the JS SDK; type checkers don't know them
  assert message.data.utterance.text_raw == "Hi"  # pyright: ignore[reportAttributeAccessIssue]
  assert message.data.utterance.words[0].speaker == 1  # pyright: ignore[reportAttributeAccessIssue]
  assert message.to_dict() == payload


def test_missing_attribute_still_raises():
  message = LiveV2MessagesConfig(receive_errors=True)
  assert not hasattr(message, "text_raw")
  with pytest.raises(AttributeError, match="'LiveV2MessagesConfig' object has no attribute"):
    _ = message.text_raw  # pyright: ignore[reportAttributeAccessIssue]


def test_unknown_message_type_exposes_its_fields():
  payload = {"type": "end_of_turn", "session_id": "123", "data": {"probability": 0.9}, "foo": 1}
  message = create_live_v2_web_socket_message_from_dict(payload)
  assert isinstance(message, LiveV2UnknownWebSocketMessage)
  assert message.type == "end_of_turn"
  assert message.data == {"probability": 0.9}
  assert message.foo == 1  # pyright: ignore[reportAttributeAccessIssue]
  assert message.to_dict() == payload
