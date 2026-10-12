from gladiaio_sdk.v2.prerecorded.core import PreRecordedV2TranscriptionOptions


def test_transcription_options_keep_unknown_fields():
  options = PreRecordedV2TranscriptionOptions(diarization=True, extra={"unknown_option": 1})
  assert options.to_dict() == {"diarization": True, "unknown_option": 1}
