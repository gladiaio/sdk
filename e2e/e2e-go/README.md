# E2E Go

End-to-end tests for `github.com/gladiaio/sdk-go`, aligned with `e2e-python` (pre-recorded + live V2).

## Requirements

- Go 1.22+
- **`GLADIA_API_KEY` is required.** If it is unset, `go test` exits immediately with code 1 (same expectation as `e2e-python`).

## Run

From the monorepo root:

```sh
export GLADIA_API_KEY="..."
bun nx run e2e-go:test
```

Or:

```sh
cd e2e/e2e-go && go test -timeout 45m ./...
```

Build the SDK first if needed:

```sh
bun nx run-many -t build,test -p sdk-go,e2e-go
```

## Coverage (parity with `e2e-python`)

**Pre-recorded V2:** `upload_file`, URL rejection, `create`, `poll`, `get`, `list`, `delete`, `delete` 404, `get_file`, `transcribe` (local, options, NER, YouTube URL), `create_and_poll`.

**Live V2 session:** split-infinity transcript, live NER (Sasha / `NAME_GIVEN`).

**Live V2 jobs:** `get`, `get_file`, `delete`, `delete` 404, `list`.

Audio fixtures: `../../data/` (shared with other E2E projects).

- Tests run **serially** (`-parallel 1`) and **live** cases share one session slot (mutex + cooldown between runs) for plans limited to a single concurrent live session.
- The full suite can take **10–30+ minutes** (YouTube transcribe and multiple live sessions are slow).
