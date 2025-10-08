# Gladia SDK

This repository contains source code for the official Gladia SDK.

## Setup

This section will help you get started with the project.

### Prerequisites

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

### Installation

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
