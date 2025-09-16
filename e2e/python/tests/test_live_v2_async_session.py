"""Live V2 Async Session test module."""

import pytest

from tests.helpers import parse_audio_file


@pytest.mark.asyncio
async def test_live_v2_async_session():
  """Test a live v2 async session."""
  audio_file = "short_split_infinity_16k.wav"
  audio_data = parse_audio_file(audio_file)

  assert audio_data["audio_config"]["sample_rate"] == 16000
  assert audio_data["audio_config"]["channels"] == 1
  assert audio_data["audio_config"]["bit_depth"] == 32
  assert audio_data["audio_config"]["encoding"] == "wav/pcm"
  assert len(audio_data["raw_audio_data"]) == 128004
