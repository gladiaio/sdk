from gladiaio_sdk.v2.prerecorded.core import PreRecordedV2TranscriptionOptions


def test_transcription_options_keep_unknown_fields():
  options = PreRecordedV2TranscriptionOptions.from_dict({"diarization": True, "unknown_option": 1})
  assert options.unknown_option == 1  # pyright: ignore[reportAttributeAccessIssue]
  assert options.to_dict() == {"diarization": True, "unknown_option": 1}
