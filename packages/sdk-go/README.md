# Gladia Go SDK (`github.com/gladiaio/sdk-go`)

Official Gladia API client for Go (scaffold — types and module layout; HTTP/WebSocket clients coming next).

## Install

```sh
go get github.com/gladiaio/sdk-go@v0.0.0
```

## Module layout

| Path | Package | Contents |
| ---- | ------- | -------- |
| `/` | `gladia` | Root package (module entry) |
| `v2/live` | `live` | Live V2 OpenAPI-generated types |
| `v2/prerecorded` | `prerecorded` | Pre-recorded V2 OpenAPI-generated types |
| `version` | `version` | Build-time SDK version string |

Types are regenerated from the Gladia OpenAPI schema via the monorepo `generator` package:

```sh
bun nx run generator:generate
```

## Development (monorepo)

```sh
bun nx run sdk-go:build
bun nx run sdk-go:test
```

Set `GLADIA_API_KEY` when you add integration tests later.
