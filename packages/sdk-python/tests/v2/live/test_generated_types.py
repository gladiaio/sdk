from gladiaio_sdk.v2.live.generated_types import LiveV2StopRecordingAckMessage


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
    + '"type": "stop_recording", "error": {"message": "Error message"}}'
  )
