# Gladia SDK JavaScript/TypeScript – Tests

### Run all unit tests:

```bash
npx vitest run
# or run only tests in tests/
npx vitest run tests/
```

### Run integration tests

```bash
export GLADIA_API_KEY=your_key
# Optional: for pre-recorded and live audio tests
export GLADIA_TEST_AUDIO_PATH=/path/to/small.wav
# or
export GLADIA_TEST_AUDIO_URL=https://example.com/audio.wav

npx vitest run tests/integration/ -v
```
