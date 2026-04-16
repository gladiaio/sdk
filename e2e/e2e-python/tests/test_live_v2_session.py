"""Live V2 Session (sync/threaded) test module."""

import re
import string
import threading
from time import sleep

from gladiaio_sdk import (
  GladiaClient,
  HttpError,
  LiveV2EndedMessage,
  LiveV2InitRequest,
  LiveV2LanguageConfig,
  LiveV2MessagesConfig,
  LiveV2NamedEntityRecognitionMessage,
  LiveV2RealtimeProcessingConfig,
  LiveV2TranscriptMessage,
  LiveV2WebSocketMessage,
)

from tests.helpers import compute_chunk_size, parse_audio_file


def test_live_v2_session():
  """Test a live v2 sync session with sender thread."""
  audio_file = "short_split_infinity_16k.wav"
  audio_data = parse_audio_file(audio_file)

  live_session = (
    GladiaClient()
    .live_v2()
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
  ended_event = threading.Event()

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

  # Sender thread to avoid blocking message reception
  def _send_audio_thread() -> None:
    chunk_size = compute_chunk_size(audio_data, 0.05)
    for i in range(0, len(audio_data["raw_audio_data"]), chunk_size):
      if live_session.status == "ending" or live_session.status == "ended":
        break
      live_session.send_audio(audio_data["raw_audio_data"][i : i + chunk_size])
      sleep(0.05)
    live_session.stop_recording()

  sender = threading.Thread(target=_send_audio_thread, name="live-v2-sender", daemon=True)
  sender.start()

  # Optionally wait until WS connected before asserting further
  assert live_session.wait_until_ready(30.0) is True
  assert live_session.status in ("connected", "ending", "ended")

  # Wait for end of session
  assert ended_event.wait(60.0) is True
  assert live_session.status == "ended"

  for transcript in transcripts:
    assert transcript.type == "transcript"
    assert transcript.data.is_final

  assert re.match(
    rf"^\ssplit infinity[{re.escape(string.punctuation)}]*$",
    " ".join(transcript.data.utterance.text for transcript in transcripts),
    re.IGNORECASE,
  )


def test_live_v2_named_entity_recognition_detects_sasha_as_given_name():
  """Named entity recognition (live): anna-and-sasha audio should yield Sasha as NAME_GIVEN."""
  audio_file = "anna-and-sasha-16000.wav"
  audio_data = parse_audio_file(audio_file)

  transcripts: list[LiveV2TranscriptMessage] = []
  ner_messages: list[LiveV2NamedEntityRecognitionMessage] = []
  ended_event = threading.Event()

  live_session = (
    GladiaClient()
    .live_v2()
    .start_session(
      LiveV2InitRequest(
        **audio_data["audio_config"],
        language_config=LiveV2LanguageConfig(languages=["en"]),
        realtime_processing=LiveV2RealtimeProcessingConfig(named_entity_recognition=True),
        messages_config=LiveV2MessagesConfig(
          receive_final_transcripts=True,
          receive_realtime_processing_events=True,
        ),
      )
    )
  )
  assert live_session.status == "starting"

  @live_session.on("message")
  def handle_message(message: LiveV2WebSocketMessage):  # pyright: ignore[reportUnusedFunction]
    if message.type == "transcript":
      transcripts.append(message)
    elif message.type == "named_entity_recognition":
      ner_messages.append(message)

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

  def _send_audio_thread() -> None:
    chunk_size = compute_chunk_size(audio_data, 0.05)
    for i in range(0, len(audio_data["raw_audio_data"]), chunk_size):
      if live_session.status == "ending" or live_session.status == "ended":
        break
      live_session.send_audio(audio_data["raw_audio_data"][i : i + chunk_size])
      sleep(0.05)
    live_session.stop_recording()

  sender = threading.Thread(target=_send_audio_thread, name="live-v2-ner-sender", daemon=True)
  sender.start()

  assert live_session.wait_until_ready(30.0) is True
  assert ended_event.wait(120.0) is True
  assert live_session.status == "ended"

  full = " ".join(t.data.utterance.text for t in transcripts).lower()
  assert "sasha" in full

  raw_results: list = []
  for msg in ner_messages:
    if msg.data is not None:
      raw_results.extend(msg.data.results)

  sasha_as_given = [
    r for r in raw_results if "sasha" in r.text.lower() and r.entity_type.upper() == "NAME_GIVEN"
  ]
  assert sasha_as_given, (
    "expected a NAME_GIVEN entity whose text includes Sasha; "
    f"got {[(r.entity_type, r.text) for r in raw_results]}"
  )
