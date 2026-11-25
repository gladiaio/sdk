# Contributing

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (latest [Active LTS](https://nodejs.org/en/about/previous-releases#looking-for-the-latest-release-of-a-version-branch))
- **Bun**: https://bun.com/docs/installation
- **uv**: https://docs.astral.sh/uv/getting-started/installation/
- **Go** 1.22+ (for `packages/sdk-go`): https://go.dev/dl/

Run the following commands to check everything is correctly installed:

```sh
node --version
bun --version
uv --version
go version
```

> [!TIP]
> All commands below assumes you do not have NX's CLI installed separately, hence the use of `bun nx …`.
> If you want, you can install it directly on your system following those [instructions](https://nx.dev/getting-started/installation).

## Installation

1. **Install dependencies:**

```sh
bun install
bun nx run-many -t sync
```

2. **Verify the installation:**

```sh
bun nx run-many -t build,test,format:check,lint:check,type:check
```

You should see the following message:

```
Successfully ran targets build, test, format:check, lint:check, type:check for x projects
```

## Nx

[Nx](https://nx.dev) manages this monorepository.  
If you are using zsh, you can install [this completion plugin](https://github.com/jscutlery/nx-completion) to ease the usage of nx.

### Basic commands

To list all the available projects ([nx show](https://nx.dev/reference/core-api/nx/documents/show)):

```sh
bun nx show projects
```

To run a command on a single project ([nx run](https://nx.dev/reference/core-api/nx/documents/run#run)):

```sh
bun nx run sdk-js:test
```

To run several targets on one project (for example Go):

```sh
bun nx run-many -t build,test,format:check -p sdk-go
```

Only one `project:target` pair is allowed per `nx run`. Anything after it is forwarded to the underlying command. For Go that produces errors such as `malformed import path "sdk-go:test"`.

To run a command on multiple projects ([nx run-many](https://nx.dev/reference/core-api/nx/documents/run-many#runmany)):

```sh
bun nx run-many -t test
```

To see a graph of the projects and their dependencies ([nx graph](https://nx.dev/reference/core-api/nx/documents/dep-graph#graph)):

```sh
bun nx graph
```

### Troubleshooting

If you have an issue with Nx, you can clear the local cache and restart the Nx daemon ([nx reset](https://nx.dev/reference/core-api/nx/documents/reset#reset)):

```sh
bun nx reset
```

## Update generated code

Some files (mostly type and class) are generated from Gladia OpenAPI definitions.  
The generator project is located at `packages/generator`.  
Run the generator with the following command:

```sh
bun nx run generator:generate
```

## Go SDK

`packages/sdk-go` is a Go module (`github.com/gladiaio/sdk/packages/sdk-go`, package `gladia`). Its layout mirrors the JS and Python SDKs:

| Go                                          | JavaScript                             | Python                                          |
| ------------------------------------------- | -------------------------------------- | ----------------------------------------------- |
| `gladia` (`Client`)                         | `GladiaClient`                         | `GladiaClient`                                  |
| `clientoptions`                             | `GladiaClientOptions` in `types.ts`    | `client_options.py`                             |
| `network` (`HTTPClient`, `WebSocketClient`) | `network/httpClient.ts`, `wsClient.ts` | `network/http_client.py`, `websocket_client.py` |
| `v2/live`, `v2/prerecorded`                 | `v2/live/`, `v2/prerecorded/`          | `v2/live/`, `v2/prerecorded/`                   |
| `v2` (`JobCore`, list URLs)                 | `v2/build-list-url.ts` + shared logic  | `v2/core.py`                                    |

Generated types live in `v2/live/generated_types.go` and `v2/prerecorded/generated_types.go` (`packages/generator/src/generators/go.ts`, which applies Go initialisms such as `ID` and `URL`).

Run the checks (from the repo root):

```sh
bun nx run-many -t build,test,format:check,lint:check,type:check -p sdk-go
```

Run the unit tests with the race detector when touching live sessions or networking:

```sh
cd packages/sdk-go && go test -race ./...
```

E2E tests live in `e2e/e2e-go` and require `GLADIA_API_KEY` (`bun nx run e2e-go:test`, ~15–35 minutes).

Releases go through the same Release / Publish workflows as the other SDKs (see [Release](#release)).

## Handle package dependencies

Each package have their own dependencies.  
For JavaScript, the package manager used is **Bun**.
For Python, it's **uv**.  
Helper nx commands are available to avoid cd'ing into the folder each time.

To add, update or remove a dependency with nx, run:

```sh
bun nx run <project-name>:<add|update|remove> -- <package-to-add>
```

Every parameter after `--` are passed to the underlying package manager (**Bun** or **uv**).
So to add the `ws` package in devDependencies on project `sdk-js`, run the following:

```sh
bun nx run sdk-js:add -- --dev ws
```

But you can also call the package manager directly:

```sh
(cd packages/javascript && bun add --dev ws)
```

## Release

Each SDK is released independently through a pull request, since `main` only accepts pull requests.

1. Pick the version with [semver](https://semver.org) from the commits since the last release of the project: any breaking change → major, any `feat` → minor, otherwise patch.

   ```sh
   git log --oneline "$(git tag --list 'sdk-js@*' --sort=-v:refname | head -n 1)"..HEAD -- packages/sdk-js
   ```

2. Run **Actions > Release > Run workflow** with the project (`sdk-js`, `sdk-python` or `sdk-go`) and the version (for example `2.3.0`). It opens a `chore(release): sdk-js@2.3.0` pull request from the `release/sdk-js@2.3.0` branch, which bumps the manifest, the version file, the lockfiles and the changelog.
3. Review and merge the pull request once CI is green.
4. Merging it runs the **Publish** workflow: it checks that the merged version matches the branch, runs the checks, publishes the package to npm or PyPI, and creates the `sdk-js@2.3.0` tag and GitHub release on the merge commit.

### Go SDK releases

Go has no package registry: `go get` resolves versions from git tags, and a module in a subdirectory needs tags prefixed with that directory. So for `sdk-go`:

- The version lives in `packages/sdk-go/sdk.version` (bumped by the Release workflow through `tools/release/go-version-actions.cjs`; `version:write` regenerates `version/version.go`, sent in the `x-gladia-version` header).
- "Publishing" (`nx-release-publish` → `packages/sdk-go/scripts/publish.mjs`) pushes the module tag `packages/sdk-go/vX.Y.Z` on the merge commit, then asks proxy.golang.org to fetch it so `go get github.com/gladiaio/sdk/packages/sdk-go@vX.Y.Z` works right away and pkg.go.dev lists it. The `sdk-go@X.Y.Z` tag and GitHub release are created as for the other SDKs.
- A pushed version is permanent: proxy.golang.org and the checksum database cache it forever, so never move or delete a `packages/sdk-go/v*` tag. Release a new patch instead, and use a [`retract`](https://go.dev/ref/mod#go-mod-file-retract) directive in `go.mod` to flag a bad version.
- Stay on `v0.x` while the API may still change. `v1` is a compatibility promise; `v2+` requires changing the module path to `github.com/gladiaio/sdk/packages/sdk-go/v2` (the publish script refuses a mismatch).
- The repository `LICENSE` is added to the module by the Go tooling, so pkg.go.dev shows the docs.

If publishing fails, fix the cause and run **Actions > Publish > Run workflow** on `main` with the project to retry. It skips the GitHub release if the tag already exists.

To bump the version locally without the workflow (it does not commit), run:

```sh
bun run release -- --project sdk-js --version 2.3.0
```
