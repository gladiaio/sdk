/// <reference types='vitest' />
import { defineConfig } from 'vite'

export default defineConfig({
  root: __dirname,
  test: {
    name: 'sdk-js',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts,mts,cts}', 'tests/**/*.{test,spec}.{js,ts,mts,cts}'],
    reporters: ['default'],
  },
})
