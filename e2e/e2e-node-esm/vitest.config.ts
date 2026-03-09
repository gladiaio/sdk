/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: __dirname,
  test: {
    name: 'e2e-node-esm',
    watch: false,
    environment: 'node',
    testTimeout: 300_000, // 5 min — E2E upload + poll can be slow
    include: ['test/**/*.test.{ts,mts,js,mjs}'],
    reporters: ['default'],
  },
})
