# Gladia SDK Python – Tests

## Unit tests (no API key or audio required)

Run all unit tests:

```bash
uv run pytest
# or
uv run pytest tests/v2/
```

### Run integration tests

```bash
export GLADIA_API_KEY=your_key
# Optional: for pre-recorded and live audio tests
export GLADIA_TEST_AUDIO_PATH=/path/to/small.wav
# or
export GLADIA_TEST_AUDIO_URL=https://example.com/audio.wav

uv run pytest tests/integration/ -v
```
