import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  outDir: 'dist',
  platform: 'neutral',
  dts: true,
  clean: true,
  sourcemap: true,
  exports: true,
  format: ['esm', 'cjs'],
})
