# Contributing

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (latest [Active LTS](https://nodejs.org/en/about/previous-releases#looking-for-the-latest-release-of-a-version-branch))
- **Bun**: https://bun.com/docs/installation
- **uv**: https://docs.astral.sh/uv/getting-started/installation/

Run the following commands to check everything is correctly installed:

```sh
node --version
bun --version
uv --version
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

2. Run **Actions > Release > Run workflow** with the project (`sdk-js` or `sdk-python`) and the version (for example `2.3.0`). It opens a `chore(release): sdk-js@2.3.0` pull request from the `release/sdk-js@2.3.0` branch, which bumps the manifest, the version file, the lockfiles and the changelog.
3. Review and merge the pull request once CI is green.
4. Merging it runs the **Publish** workflow: it checks that the merged version matches the branch, runs the checks, publishes the package to npm or PyPI, and creates the `sdk-js@2.3.0` tag and GitHub release on the merge commit.

If publishing fails, fix the cause and run **Actions > Publish > Run workflow** on `main` with the project to retry. It skips the GitHub release if the tag already exists.

To bump the version locally without the workflow (it does not commit), run:

```sh
bun run release -- --project sdk-js --version 2.3.0
```
