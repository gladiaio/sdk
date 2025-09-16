import os
from asyncio import sleep as async_sleep
from time import sleep
from typing import TypedDict

from gladiaio_sdk import (
  LiveV2BitDepth,
  LiveV2Encoding,
  LiveV2SampleRate,
  LiveV2Session,
)


class LiveV2InitRequestAudioConfig(TypedDict):
  bit_depth: LiveV2BitDepth
  channels: int
  encoding: LiveV2Encoding
  sample_rate: LiveV2SampleRate


class AudioFile(TypedDict):
  raw_audio_data: bytes
  audio_config: LiveV2InitRequestAudioConfig


def parse_audio_file(file: str) -> AudioFile:
  with open(os.path.join(os.path.dirname(__file__), "../../../data", file), "rb") as f:
    file_content = f.read()

  # Validate basic RIFF/WAVE/fmt header
  if not (
    file_content[0:4] == b"RIFF"
    and file_content[8:12] == b"WAVE"
    and file_content[12:16] == b"fmt "
  ):
    raise ValueError("Unsupported file format")

  # Parse WAV header fields (little-endian)
  fmt_size = int.from_bytes(file_content[16:20], "little")
  format_code = int.from_bytes(file_content[20:22], "little")

  if format_code == 1:
    encoding: LiveV2Encoding = "wav/pcm"
  elif format_code == 6:
    encoding = "wav/alaw"
  elif format_code == 7:
    encoding = "wav/ulaw"
  else:
    raise ValueError("Unsupported encoding")

  channels = int.from_bytes(file_content[22:24], "little")
  sample_rate: LiveV2SampleRate = int.from_bytes(file_content[24:28], "little")
  bit_depth: LiveV2BitDepth = int.from_bytes(file_content[34:36], "little")

  # Locate the 'data' chunk, skipping any intervening chunks
  next_subchunk = 16 + 4 + fmt_size
  while file_content[next_subchunk : next_subchunk + 4] != b"data":
    chunk_size = int.from_bytes(file_content[next_subchunk + 4 : next_subchunk + 8], "little")
    next_subchunk += 8 + chunk_size

  data_size = int.from_bytes(file_content[next_subchunk + 4 : next_subchunk + 8], "little")
  raw_audio_data = file_content[next_subchunk + 8 : next_subchunk + 8 + data_size]

  return {
    "audio_config": {
      "encoding": encoding,
      "sample_rate": sample_rate,
      "channels": channels,
      "bit_depth": bit_depth,
    },
    "raw_audio_data": raw_audio_data,
  }


def compute_chunk_size(audio_file: AudioFile, chunk_duration=0.05) -> int:
  bytes_per_sample = audio_file["audio_config"]["bit_depth"] / 8
  bytes_per_second = (
    audio_file["audio_config"]["sample_rate"]
    * audio_file["audio_config"]["channels"]
    * bytes_per_sample
  )
  return round(chunk_duration * bytes_per_second)


async def send_audio_file_async(
  audio_file: AudioFile, live_session: LiveV2Session, chunk_duration=0.05
) -> None:
  chunk_size = compute_chunk_size(audio_file, chunk_duration)
  for i in range(0, len(audio_file["raw_audio_data"]), chunk_size):
    if live_session.status == "ending" or live_session.status == "ended":
      return
    live_session.send_audio(audio_file["raw_audio_data"][i : i + chunk_size])
    await async_sleep(chunk_duration)


def send_audio_file(
  audio_file: AudioFile, live_session: LiveV2Session, chunk_duration=0.05
) -> None:
  chunk_size = compute_chunk_size(audio_file, chunk_duration)
  for i in range(0, len(audio_file["raw_audio_data"]), chunk_size):
    if live_session.status == "ending" or live_session.status == "ended":
      return
    live_session.send_audio(audio_file["raw_audio_data"][i : i + chunk_size])
    sleep(chunk_duration)
