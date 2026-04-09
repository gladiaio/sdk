# Gladia Python SDK

A Python SDK for the [Gladia](https://www.gladia.io/) API.

## Requirements

You need **Python 3.10+** for this package.

## Installation

```bash
pip install gladiaio-sdk

# or with uv

uv add gladiaio-sdk
```

## Usage

Import **`GladiaClient`** and create an instance.

Provide an API key with **`api_key`** or the **`GLADIA_API_KEY`** environment variable. [Get your API key](https://docs.gladia.io/chapters/introduction/getting-started) in under a minute.

You can also set **`GLADIA_API_URL`** and **`GLADIA_REGION`** (`eu-west` / `us-west`).

### Sync client

```python
from gladiaio_sdk import GladiaClient

gladia_client = GladiaClient(api_key="your-api-key")
```

## Pre-recorded transcription

**`transcribe()`** accepts a path, **`Path`**, binary file object, or **`http(s)` URL**. It uploads when needed, then polls until the job completes.

```python
from gladiaio_sdk import GladiaClient

gladia_client = GladiaClient(api_key="your-api-key")

transcription = gladia_client.prerecorded().transcribe(
    "audio.mp3",
    {
        "language_config": {
            "languages": ["en"],
        },
    },
)

print(transcription.result.transcription.full_transcript)
```

See all the [supported languages](https://docs.gladia.io/chapters/language/supported-languages) here !

Pass the **options** as second argument to enable all the features from **[Audio intelligence](https://docs.gladia.io/chapters/pre-recorded-stt/audio-intelligence)** — diarization, translation, PII redaction, and more.

### Async pre-recorded

Use **`prerecorded_async()`** and **`await`** the same methods. Options match the sync API.

```python
import asyncio

from gladiaio_sdk import GladiaClient


async def main() -> None:
    gladia_client = GladiaClient(api_key="your-api-key")

    transcription = await gladia_client.prerecorded_async().transcribe(
        "audio.mp3",
        {
            "language_config": {
                "languages": ["en"],
            },
        },
    )

    print(transcription.result.transcription.full_transcript)


asyncio.run(main())
```

## Live transcription

Get a live client from your **`GladiaClient`**:

```python
live_client = gladia_client.live()
```

Async version:

```python
live_client = gladia_client.live_async()
```

```python
from gladiaio_sdk import (
    LiveV2EndedMessage,
    LiveV2InitRequest,
    LiveV2InitResponse,
    LiveV2LanguageConfig,
    LiveV2MessagesConfig,
    LiveV2WebSocketMessage,
)

live_session = live_client.start_session(
    LiveV2InitRequest(
        model="solaria-1",
        encoding="wav/pcm",
        sample_rate=16000,
        bit_depth=16,
        channels=1,
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


@live_session.once("ended")
def on_ended(ended: LiveV2EndedMessage):
    print(f"Session {live_session.session_id} ended")


live_session.send_audio(audio_bytes)
live_session.stop_recording()
```

Use **`LiveV2InitRequest`** fields for realtime/post-processing options — see **[Live STT features](https://docs.gladia.io/chapters/live-stt/features)** and the [live init API](https://docs.gladia.io/api-reference/v2/live/init).

### Async live

Same session API; use **`live_async()`** and run under **`asyncio.run`** or your app loop:

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
    gladia_client = GladiaClient(api_key="your-api-key")
    live_client = gladia_client.live_async()
    session_done = asyncio.Event()

    live_session = live_client.start_session(
        LiveV2InitRequest(
            model="solaria-1",
            encoding="wav/pcm",
            sample_rate=16000,
            bit_depth=16,
            channels=1,
            language_config=LiveV2LanguageConfig(languages=["en"]),
            messages_config=LiveV2MessagesConfig(receive_partial_transcripts=True),
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

When you need the session id from an async session: **`await live_session.get_session_id()`**. For a sync session, use **`live_session.session_id`** after **`started`**.

## Documentation

- [Pre-recorded quickstart](https://docs.gladia.io/chapters/pre-recorded-stt/quickstart)
- [Live quickstart](https://docs.gladia.io/chapters/live-stt/quickstart)

## License

MIT
