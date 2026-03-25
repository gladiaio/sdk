# Gladia SDK

This monorepo contains the source code for the official Gladia SDKs and the code generator that powers them.

| Package                                       | Description                             | Path                  |
| --------------------------------------------- | --------------------------------------- | --------------------- |
| [@gladiaio/sdk](packages/sdk-js/README.md)    | JavaScript / TypeScript SDK             | `packages/sdk-js`     |
| [gladiaio-sdk](packages/sdk-python/README.md) | Python SDK                              | `packages/sdk-python` |
| generator                                     | OpenAPI → SDK type generator (internal) | `packages/generator`  |

You can also check out [our code samples](https://github.com/gladiaio/gladia-samples).

## Repository architecture

```
├── packages/
│   ├── generator/          # Fetches Gladia OpenAPI schema and generates types
│   ├── sdk-js/             # JavaScript/TypeScript SDK (ESM, CJS, IIFE)
│   └── sdk-python/         # Python SDK (sync + async)
├── e2e/
│   ├── e2e-node-esm/       # E2E tests — Node ESM
│   ├── e2e-node-cjs/       # E2E tests — Node CJS
│   ├── e2e-python/         # E2E tests — Python
│   └── javascript-fixtures/
├── tools/scripts/           # Release & publish automation
└── .github/workflows/       # CI, release, publish pipelines
```

The repo is managed with [Nx](https://nx.dev) and uses **Bun** as the JavaScript package manager and **uv** for Python.

### How the code generator works

The generator (`packages/generator`) is central to this repo. It fetches the Gladia [OpenAPI schema](https://api.gladia.io/openapi.json) and produces typed definitions for each SDK:

```
OpenAPI schema (api.gladia.io/openapi.json)
        │
        ▼
   generator
    ├── Live V2
    │   ├──▶ packages/sdk-js/src/v2/live/generated-types.ts
    │   └──▶ packages/sdk-python/src/gladiaio_sdk/v2/live/generated_types.py
    └── PreRecorded V2
        ├──▶ packages/sdk-js/src/v2/prerecorded/generated-types.ts
        └──▶ packages/sdk-python/src/gladiaio_sdk/v2/prerecorded/generated_types.py
```

The generator extracts **Live V2** schemas (`StreamingRequest`, `InitStreamingResponse`, `CallbackLive*Message`, `WebhookLive*Payload`) and **PreRecorded V2** schemas (e.g. `PreRecordedV2InitTranscriptionRequest`, `PreRecordedV2Response`, upload/init types) and produces language-specific type definitions. Each language has its own generator class that extends `BaseGenerator` (`packages/generator/src/generators/base.ts`).

## Getting started

See [CONTRIBUTING.md](CONTRIBUTING.md) for full setup instructions. The short version:

```sh
# Prerequisites: Node.js (LTS), Bun, uv
bun install
bun nx run-many -t sync

# Verify everything works
bun nx run-many -t build,test,format:check,lint:check,type:check
```

## Contributing

### Commit convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint. Commits must follow the format:

```
<type>(optional scope): <description>
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

### Useful Nx commands

```sh
bun nx show projects                    # List all projects
bun nx run sdk-js:test                  # Run a single target
bun nx run-many -t test                 # Run a target across all projects
bun nx run-many -t lint:write           # Auto-fix lint issues
bun nx run-many -t format:write         # Auto-format code
bun nx graph                            # Visualize project dependency graph
```

### CI checks

Every pull request runs:

- **build** — all packages compile successfully
- **test** — unit and E2E tests pass
- **format:check** — Prettier (JS/TS) and Ruff (Python) formatting
- **lint:check** — ESLint (JS/TS) and Ruff (Python) linting
- **type:check** — `tsc --noEmit` (JS/TS) and `pyright` (Python)
- **version:check** — generated version files are committed
- **commitlint** — commit messages follow the conventional format
- **security** — dependency audit

## How to add a feature to an existing SDK

### 1. If the feature involves generated types (Live V2 or PreRecorded V2)

Generated type files are **auto-generated** — do not edit them manually. Instead:

1. If the API schema has changed, regenerate the types:

   ```sh
   bun nx run generator:generate
   ```

   This fetches the latest OpenAPI schema from `https://api.gladia.io/openapi.json`, runs the generator for both Live V2 and PreRecorded V2, and auto-formats the output.

2. Review the changes in the generated files for the surface you care about:
   - **Live V2:** `packages/sdk-js/src/v2/live/generated-types.ts`, `packages/sdk-python/src/gladiaio_sdk/v2/live/generated_types.py`
   - **PreRecorded V2:** `packages/sdk-js/src/v2/prerecorded/generated-types.ts`, `packages/sdk-python/src/gladiaio_sdk/v2/prerecorded/generated_types.py`

3. If the generator itself needs updating (e.g. to support a new schema pattern), edit the relevant generator in `packages/generator/src/generators/` and the shared logic in `packages/generator/src/generator.ts` (e.g. `preProcessSchemaForLiveV2`, `preProcessSchemaForPreRecordedV2`).

### 2. If the feature is SDK-specific logic

Each SDK follows a similar structure:

| Component                | JavaScript (`packages/sdk-js`)          | Python (`packages/sdk-python`)                                        |
| ------------------------ | --------------------------------------- | --------------------------------------------------------------------- |
| Entry point              | `src/index.ts`                          | `src/gladiaio_sdk/__init__.py`                                        |
| Client                   | `src/client.ts`                         | `src/gladiaio_sdk/client.py`                                          |
| HTTP client              | `src/network/httpClient.ts`             | `src/gladiaio_sdk/network/http_client.py`                             |
| WebSocket client         | `src/network/wsClient.ts`               | `src/gladiaio_sdk/network/websocket_client.py`                        |
| Live V2 session          | `src/v2/live/`                          | `src/gladiaio_sdk/v2/live/`                                           |
| Live V2 generated        | `src/v2/live/generated-types.ts`        | `src/gladiaio_sdk/v2/live/generated_types.py`                         |
| PreRecorded V2 client    | `src/v2/prerecorded/client.ts`          | `src/gladiaio_sdk/v2/prerecorded/client.py` (sync), `async_client.py` |
| PreRecorded V2 generated | `src/v2/prerecorded/generated-types.ts` | `src/gladiaio_sdk/v2/prerecorded/generated_types.py`                  |

Steps:

1. Make your changes in the appropriate SDK package.
2. Add or update tests (Vitest for JS, pytest for Python).
3. Run the relevant checks:

   ```sh
   # JavaScript SDK
   bun nx run sdk-js:build
   bun nx run sdk-js:test
   bun nx run sdk-js:lint:check
   bun nx run sdk-js:type:check

   # Python SDK
   bun nx run sdk-python:build
   bun nx run sdk-python:test
   bun nx run sdk-python:lint:check
   bun nx run sdk-python:type:check
   ```

4. Run E2E tests if applicable:
   ```sh
   bun nx run e2e-node-esm:test
   bun nx run e2e-node-cjs:test
   bun nx run e2e-python:test
   ```

### 3. Managing dependencies

```sh
# Add a dependency (flags after -- are passed to the underlying package manager)
bun nx run sdk-js:add -- ws
bun nx run sdk-js:add -- --dev vitest

# Python (uv)
bun nx run sdk-python:add -- httpx
```

## How to add a new SDK language

To add support for a new language (e.g. Go, Ruby, Java):

### 1. Create a new generator

Add a new generator class in `packages/generator/src/generators/`. Use the existing implementations as reference:

- `typescript.ts` — generates TypeScript interfaces and union types
- `python.ts` — generates Python dataclasses and Literal types

Your generator must extend `BaseGenerator` and implement:

| Method                             | Purpose                                            |
| ---------------------------------- | -------------------------------------------------- |
| `sdkName`                          | Folder name under `packages/` (e.g. `sdk-go`)      |
| `getFileExtension()`               | File extension (e.g. `.go`)                        |
| `getSourceFolder()`                | Source directory within the SDK package            |
| `formatFilename(filename)`         | Filename convention (kebab-case, snake_case, etc.) |
| `generateSingleLineComment(text)`  | Single-line comment syntax                         |
| `generateMultiLineComment(text)`   | Multi-line comment syntax                          |
| `generateTypeDefinition(schema)`   | How to render a type/class/struct from a schema    |
| `generateUnionType(name, schemas)` | How to render a union/sum type                     |
| `resolveUnionTypes(items)`         | How to resolve union member type names             |

### 2. Register the generator

In `packages/generator/src/generator.ts`, add your new generator to the constructor:

```typescript
import { YourNewGenerator } from './generators/your-language.ts'

// Inside the Generator constructor:
this.generators.push(new YourNewGenerator())
```

### 3. Create the SDK package

Create a new directory under `packages/` (matching the `sdkName` from your generator):

```
packages/sdk-<language>/
├── src/
│   └── v2/live/           # The generator will write here
├── project.json           # Nx project configuration
├── README.md
└── <language build config> (e.g. go.mod, Gemfile, pom.xml)
```

Set up the `project.json` with appropriate Nx targets (`build`, `test`, `lint:check`, `format:check`, `type:check`, etc.).

### 4. Add version management

Each SDK has a `scripts/write-version.mjs` script that syncs the version number from the package manifest into a source file. Create one for your SDK following the pattern in `packages/sdk-js/scripts/` or `packages/sdk-python/scripts/`.

### 5. Generate and verify

```sh
bun nx run generator:generate
bun nx run sdk-<language>:build
bun nx run sdk-<language>:test
```

### 6. Add E2E tests

Create a new E2E project under `e2e/` to validate the SDK works end-to-end. Follow the pattern established by `e2e/e2e-node-esm` or `e2e/e2e-python`.

### 7. Update this README

Add your new SDK to the package table at the top of this file and update any relevant sections.

## Release

Releases are managed through GitHub Actions with independent versioning per SDK. The workflow is:

1. **Release** — triggered manually via `workflow_dispatch`, bumps version, generates changelog, pushes tags.
2. **Publish** — triggered by new version tags (`sdk-*@*`) or manually, builds and publishes to the relevant registry (npm, PyPI, etc.).
