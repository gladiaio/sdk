# Pull request: Go SDK (`feat/sdk-go`)

Use this when opening the PR against `main`. Copy the title and body below into GitHub.

## Title

```
feat(sdk-go): add Go SDK with live WebSocket and Python-parity e2e
```

## Body

```markdown
## Summary

Adds **`github.com/gladiaio/sdk-go`**, a Go client aligned with the JavaScript and Python SDKs.

**Included**

- **Codegen** — `GoGenerator` in the monorepo; Live V2 and Pre-recorded V2 types from the same OpenAPI schema
- **Client** — `GladiaClient`, `clientoptions` (`GLADIA_API_KEY`, etc.), HTTP layer with redirect handling and credential stripping on cross-origin redirects (same idea as JS)
- **REST** — Pre-recorded V2 and Live V2 (upload, create, poll, transcribe, job CRUD)
- **Live streaming** — WebSocket sessions (`StartSession` / `ConnectSession`, audio, `SessionHandlers` callbacks)
- **Tooling** — Nx targets for `sdk-go`; Go 1.22 in CI
- **E2E** — `e2e/e2e-go` matches `e2e-python` pre-recorded + live coverage; **`GLADIA_API_KEY` required** (exits with code 1 if unset)

**Out of scope (for later)**

- pkg.go.dev publish / release workflow
- Separate async client package (layout mirrors JS/Python)

## Why

Gives Go users a first-class Gladia client in-repo with generated types and Python-aligned e2e coverage.

## Test plan

- [ ] `bun nx run-many -t build,test,format:check,lint:check,type:check -p sdk-go`
- [ ] `export GLADIA_API_KEY=...` then `bun nx run e2e-go:test` (allow up to ~45m; YouTube transcribe is slow)
- [ ] CI green on the PR (repo secret `GLADIA_API_KEY` must be set for e2e-go)
```
