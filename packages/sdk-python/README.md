# Gladia Python SDK

A Python SDK for the Gladia API.

## Requirements

You need Python 3.10+ for this package.  
It may work on lower versions but they are not supported / tested.

## Installation

### Using pip

```bash
pip install gladiaio-sdk
```

### Using uv

```bash
uv add gladiaio-sdk
```

## Usage

To use the SDK, import `GladiaClient` and create a new instance of it.

You can also configure `api_key`, `api_url` and `region` through their respective environment variables: `GLADIA_API_KEY`, `GLADIA_API_URL` and `GLADIA_REGION`.

```python
from gladiaio_sdk import GladiaClient

gladia_client = GladiaClient(
  api_key="your_api_key"
)
```

## Live V2

### Usage

```python
from gladiaio_sdk import (
  GladiaClient,
  LiveV2EndedMessage,
  LiveV2InitRequest,
  LiveV2InitResponse,
  LiveV2LanguageConfig,
  LiveV2MessagesConfig,
  LiveV2WebSocketMessage,
)

gladia_client = GladiaClient(api_key="your_api_key")

# Create session
live_session = gladia_client.live_v2_async().start_session(
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
