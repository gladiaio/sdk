"""Live V2 Async Session test module."""

import asyncio
import re
import string

import pytest
from gladiaio_sdk import (
  GladiaClient,
  HttpError,
  LiveV2EndedMessage,
  LiveV2InitRequest,
  LiveV2LanguageConfig,
  LiveV2TranscriptMessage,
  LiveV2WebSocketMessage,
)

from tests.helpers import parse_audio_file, send_audio_file_async


@pytest.mark.asyncio
async def test_live_v2_async_session():
  """Test a live v2 async session."""
  audio_file = "short_split_infinity_16k.wav"
  audio_data = parse_audio_file(audio_file)

  live_session = (
    GladiaClient()
    .live_v2_async()
    .start_session(
      LiveV2InitRequest(
        **audio_data["audio_config"],
        language_config=LiveV2LanguageConfig(
          languages=["en"],
        ),
      )
    )
  )
  assert live_session.status == "starting"

  transcripts: list[LiveV2TranscriptMessage] = []
  ended_event = asyncio.Event()

  @live_session.on("message")
  def handle_message(message: LiveV2WebSocketMessage):  # pyright: ignore[reportUnusedFunction]
    print(message)
    if message.type == "transcript":
      transcripts.append(message)

  @live_session.once("error")
  def handle_error(error: Exception):  # pyright: ignore[reportUnusedFunction]
    if isinstance(error, HttpError):
      print(f"HttpError: {error.response_body} | {error}")
    else:
      print(error)

  @live_session.once("ended")
  def handle_ended(ended: LiveV2EndedMessage):  # pyright: ignore[reportUnusedFunction]
    print(f"Session ended: {ended}")
    ended_event.set()

  await send_audio_file_async(audio_data, live_session)
  live_session.stop_recording()
  assert live_session.status == "ending"

  _ = await ended_event.wait()
  assert live_session.status == "ended"

  for transcript in transcripts:
    assert transcript.type == "transcript"
    assert transcript.data.is_final

  assert re.match(
    rf"^\ssplit infinity[{re.escape(string.punctuation)}]*$",
    " ".join(transcript.data.utterance.text for transcript in transcripts),
    re.IGNORECASE,
  )
