#!/usr/bin/env bun

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pyproject from '../pyproject.toml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const projectRoot = resolve(__dirname, '..')
const outputPath = resolve(projectRoot, 'src', 'gladiaio_sdk', 'version.py')

const version = pyproject.project?.version

if (typeof version !== 'string' || !version) {
  console.error('[sdk-python] Missing project.version in pyproject.toml')
  process.exit(1)
}

const content = `# This file is auto-generated. Do not edit manually.
SDK_VERSION = "${version}"
`

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, content, 'utf8')

console.log(`[sdk-python] Wrote ${outputPath} with version ${version}`)
