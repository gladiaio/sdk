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
