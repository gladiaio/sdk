from gladiaio_sdk.v2.live.generated_types import (
  LiveV2EndRecordingMessage,
  LiveV2EndRecordingMessageData,
)

msg = LiveV2EndRecordingMessage(
  session_id="123",
  created_at="2021-01-01",
  type="end_recording",
  data=LiveV2EndRecordingMessageData(
    recording_duration=10.0,
  ),
)

print(msg.data)

msg = LiveV2EndRecordingMessage.from_dict(
  {
    "session_id": "123",
    "created_at": "2021-01-01",
    "type": "end_recording",
    "data": {
      "recording_duration": 10.0,
    },
  }
)

print(msg.data.recording_duration)
