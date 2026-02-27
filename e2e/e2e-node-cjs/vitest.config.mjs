import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: import.meta.dirname,
  test: {
    name: 'e2e-node-cjs',
    watch: false,
    environment: 'node',
    testTimeout: 15_000,
    // CJS tests use node:test (Vitest cannot be require()d in CJS). Run with: node --test test/
    include: [],
    reporters: ['default'],
  },
})
