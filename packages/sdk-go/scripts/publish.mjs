#!/usr/bin/env node

// Publishes the Go module (nx-release-publish target of sdk-go).
//
// Go has no package registry: `go get` resolves a version from a git tag. For a module in a
// repository subdirectory the tag must be prefixed with that subdirectory, so version X.Y.Z of
// github.com/gladiaio/sdk/packages/sdk-go is the tag `packages/sdk-go/vX.Y.Z`.
// This script creates and pushes that tag on HEAD, then asks proxy.golang.org to fetch the
// version so it is immediately available to `go get` and listed on pkg.go.dev.
//
// Usage: node scripts/publish.mjs [--dryRun]

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// nx:run-commands forwards options as `--dryRun=true` / `--dryRun`
const dryRun = process.argv.slice(2).some((arg) => /^--dry-?run(=true)?$/i.test(arg))

function git(...args) {
  return execFileSync('git', args, { cwd: projectRoot, encoding: 'utf8' }).trim()
}

function fail(message) {
  console.error(`[sdk-go] ${message}`)
  process.exit(1)
}

const version = readFileSync(resolve(projectRoot, 'sdk.version'), 'utf8').trim()
const match = /^(\d+)\.\d+\.\d+$/.exec(version)
if (!match) {
  fail(`sdk.version "${version}" is not MAJOR.MINOR.PATCH`)
}

const modulePath = /^module\s+(\S+)/m.exec(
  readFileSync(resolve(projectRoot, 'go.mod'), 'utf8')
)?.[1]
const repoRoot = git('rev-parse', '--show-toplevel')
const moduleDir = relative(repoRoot, projectRoot).split('\\').join('/')
const major = Number(match[1])
// v2+ modules need a /vN suffix in their module path (https://go.dev/ref/mod#major-version-suffixes)
const expectedModulePath = `github.com/gladiaio/sdk/${moduleDir}${major >= 2 ? `/v${major}` : ''}`
if (modulePath !== expectedModulePath) {
  fail(`go.mod module path is "${modulePath}", expected "${expectedModulePath}" for v${version}`)
}

const tag = `${moduleDir}/v${version}`
const head = git('rev-parse', 'HEAD')

const remoteTag = git('ls-remote', '--tags', 'origin', `refs/tags/${tag}`)
if (remoteTag) {
  // Tags are immutable for Go (the proxy and sum database cache them forever)
  const remoteSha = git('rev-parse', `${tag}^{commit}`)
  if (remoteSha !== head) {
    fail(
      `Tag ${tag} already exists on ${remoteSha}, not on HEAD (${head}). Release a new version instead.`
    )
  }
  console.log(`[sdk-go] Tag ${tag} already exists on HEAD, skipping the push.`)
} else if (dryRun) {
  console.log(`[sdk-go] Dry run: would push tag ${tag} on ${head}.`)
} else {
  git('tag', '-a', tag, '-m', `${modulePath} v${version}`, head)
  git('push', 'origin', `refs/tags/${tag}`)
  console.log(`[sdk-go] Pushed tag ${tag} on ${head}.`)
}

const proxyURL = `https://proxy.golang.org/${modulePath}/@v/v${version}.info`
if (dryRun) {
  console.log(`[sdk-go] Dry run: would request ${proxyURL}.`)
  process.exit(0)
}

// The proxy can take a moment to see a new tag; failures here are not fatal because the
// first `go get` of the version triggers the same fetch.
for (let attempt = 1; attempt <= 5; attempt++) {
  try {
    const res = await fetch(proxyURL)
    if (res.ok) {
      console.log(`[sdk-go] proxy.golang.org serves ${modulePath}@v${version}: ${await res.text()}`)
      process.exit(0)
    }
    console.warn(`[sdk-go] proxy.golang.org answered ${res.status} (attempt ${attempt}/5)`)
  } catch (error) {
    console.warn(`[sdk-go] proxy.golang.org request failed (attempt ${attempt}/5): ${error}`)
  }
  await new Promise((r) => setTimeout(r, attempt * 10_000))
}
console.warn(
  `[sdk-go] proxy.golang.org did not serve v${version} yet; it will on the first go get.`
)
