#!/usr/bin/env bun

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const projectRoot = resolve(__dirname, '..')
const pkgPath = resolve(projectRoot, 'package.json')
const srcDir = resolve(projectRoot, 'src')
const outPath = resolve(srcDir, 'version.ts')

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const version = pkg.version

mkdirSync(srcDir, { recursive: true })

const fileContents = `// This file is auto-generated during build. Do not edit manually.\nexport const SDK_VERSION = '${version}' as const\n`

writeFileSync(outPath, fileContents, 'utf8')
console.log(`[sdk-js] Wrote ${outPath} with version ${version}`)

// Also update the workspace version recorded in the repository lockfile.
// The Bun lockfile allows trailing commas, so we avoid JSON.parse and use a
// targeted regex replacement within the `workspaces["packages/sdk-js"]` block.
try {
  const repoRoot = resolve(projectRoot, '..', '..')
  const lockPath = resolve(repoRoot, 'bun.lock')
  const lockContents = readFileSync(lockPath, 'utf8')

  // Match the version property appearing near the start of the packages/sdk-js workspace block
  // e.g. "packages/sdk-js": { "name": "@gladiaio/sdk", "version": "0.5.2", ... }
  const pattern = /("packages\/sdk-js"\s*:\s*\{[\s\S]{0,2000}?"version"\s*:\s*")([^"]+)(")/

  if (!pattern.test(lockContents)) {
    console.warn(
      '[sdk-js] Could not locate packages/sdk-js version in bun.lock; no changes written'
    )
  } else {
    const updated = lockContents.replace(pattern, `$1${version}$3`)
    if (updated !== lockContents) {
      writeFileSync(lockPath, updated, 'utf8')
      console.log(`[sdk-js] Updated bun.lock workspace version for packages/sdk-js -> ${version}`)
    } else {
      console.log('[sdk-js] bun.lock already up-to-date for packages/sdk-js')
    }
  }
} catch (err) {
  console.warn('[sdk-js] Failed to update bun.lock:', err)
}
