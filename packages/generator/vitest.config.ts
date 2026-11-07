/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: __dirname,
  test: {
    name: 'generator',
    watch: false,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    reporters: ['default'],
  },
})
