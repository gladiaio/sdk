# Gladia Python SDK

A Python SDK for the Gladia API.

## Requirements

You need Python 3.10+ for this package.  

## Installation

```bash
pip install gladiaio-sdk

# or with uv 

uv add gladiaio-sdk
```

## Usage

To use the SDK, import `GladiaClient` and create a new instance of it.

You can also configure `api_key`, `api_url` and `region` through their respective environment variables: `GLADIA_API_KEY`, `GLADIA_API_URL` and `GLADIA_REGION`.

## Pre-recorded transcription 

Get your API Key with the [quickstart](https://docs.gladia.io/chapters/introduction/getting-started) in 30 seconds !
```python
from gladiaio_sdk import GladiaClient

gladia_client = GladiaClient(api_key="GLADIA_API_KEY").prerecorded()

transcription = gladia_client.transcribe(
    audio_url="audio.mp3",
    options={
        "language_config": {
            "languages": ["en"],
        },
    },
)

print(transcription.result.transcription.full_transcript)
```

### Async pre-recorded

Use `prerecorded_async()`and `await` the async methods. The client shares the same options as the sync API.

```python
import asyncio

from gladiaio_sdk import GladiaClient


async def main() -> None:
    gladia_client = GladiaClient(api_key="GLADIA_API_KEY").prerecorded_async()

    transcription = await gladia_client.transcribe(
        audio_url="audio.mp3",
        options={
            "language_config": {
                "languages": ["en"],
            },
        },
    )

    print(transcription.result.transcription.full_transcript)


asyncio.run(main())
```

Check all the support languages [here](https://docs.gladia.io/chapters/language/supported-languages) and all the features of audio intelligence [here](https://docs.gladia.io/chapters/pre-recorded-stt/audio-intelligence) !



## Live transcription

```python
live_client = gladia_client.live()
```

And to get the async version:

```python
live_client = gladia_client.live_async()
```

Async live sessions schedule work on the asyncio event loop. Create the session **inside** a running loop (for example the body of `asyncio.run(main())`), not at import time or from synchronous code without a loop.

### Usage

Once you chose sync or async client, use it to run a Live session. Sync example:

```python
from gladiaio_sdk import (
  LiveV2EndedMessage,
  LiveV2InitRequest,
  LiveV2InitResponse,
  LiveV2LanguageConfig,
  LiveV2MessagesConfig,
  LiveV2WebSocketMessage,
)

# Create session
live_session = live_client.start_session(
  LiveV2InitRequest(
    language_config=LiveV2LanguageConfig(
      languages=["en"],
    ),
    messages_config=LiveV2MessagesConfig(
      receive_partial_transcripts=True,
    ),
  )
)


# Add listeners
@live_session.on("message")
def on_message(message: LiveV2WebSocketMessage):
  if message.type == "transcript":
    print(f"{'F' if message.data.is_final else 'P'} | {message.data.utterance.text.strip()}")


@live_session.once("started")
def on_started(response: LiveV2InitResponse):
  print(f"Session {response.id} started")


@live_session.on("error")
def on_error(error: Exception):
  print(f"An error occurred during live session: {error}")


@live_session.once("ended")
def on_ended(ended: LiveV2EndedMessage):
  print(f"Session {live_session.session_id} ended")


# Send audio
live_session.send_audio(audio_bytes)
# ...
live_session.send_audio(audio_bytes)

# Stop the recording when all audio have been sent.
# Remaining audio will be processed and after post-processing,
# the session is ended.
live_session.stop_recording()
```

Async example (same session API; use `live_async()` and run everything under `asyncio.run` or your app’s event loop):

```python
import asyncio

from gladiaio_sdk import (
    GladiaClient,
    LiveV2EndedMessage,
    LiveV2InitRequest,
    LiveV2InitResponse,
    LiveV2LanguageConfig,
    LiveV2MessagesConfig,
    LiveV2WebSocketMessage,
)


async def main() -> None:
    gladia_client = GladiaClient(api_key="GLADIA_API_KEY")
    live_client = gladia_client.live_async()
    session_done = asyncio.Event()

    live_session = live_client.start_session(
        LiveV2InitRequest(
            language_config=LiveV2LanguageConfig(
                languages=["en"],
            ),
            messages_config=LiveV2MessagesConfig(
                receive_partial_transcripts=True,
            ),
        )
    )

    @live_session.on("message")
    def on_message(message: LiveV2WebSocketMessage):
        if message.type == "transcript":
            print(f"{'F' if message.data.is_final else 'P'} | {message.data.utterance.text.strip()}")

    @live_session.once("started")
    def on_started(response: LiveV2InitResponse):
        print(f"Session {response.id} started")

    @live_session.on("error")
    def on_error(error: Exception):
        print(f"An error occurred during live session: {error}")
        session_done.set()

    @live_session.once("ended")
    def on_ended(ended: LiveV2EndedMessage):
        print(f"Session {live_session.session_id} ended")
        session_done.set()

    live_session.send_audio(audio_bytes)
    live_session.stop_recording()

    await session_done.wait()


asyncio.run(main())
```
