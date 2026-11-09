# E2E Go

End-to-end smoke tests for `github.com/gladiaio/sdk-go`, aligned with `e2e-python` and `e2e-node-esm`.

## Requirements

- Go 1.22+
- `GLADIA_API_KEY` — tests that call Gladia's API are **skipped** when this is unset (local runs without credentials stay green)

## Run

From the monorepo root:

```sh
export GLADIA_API_KEY="..."
bun nx run e2e-go:test
```

Or:

```sh
cd e2e/e2e-go && go test -timeout 10m ./...
```

## Coverage

| Test | Mirrors |
| ---- | ------- |
| `TestPreRecordedUploadAndPoll` | Python/JS pre-recorded upload + poll |
| `TestPreRecordedUploadFileRejectsURL` | upload with URL raises |
| `TestLiveSessionSplitInfinity` | `test_live_v2_session` / `split infinity` |
| `TestLiveJobGet` | live job management `get` after session |

Audio fixtures live in `../../data/` (shared with other E2E projects).
