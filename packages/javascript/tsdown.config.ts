import { defineConfig, type Options } from 'tsdown'

const baseConfig: Options = {
  entry: 'src/index.ts',
  outDir: 'dist',
  platform: 'neutral',
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['ws'],
  exports: true,
}

export default defineConfig([
  {
    ...baseConfig,
    format: ['esm', 'cjs'],
  },
  {
    ...baseConfig,
    format: ['iife'],
    target: 'es2020',
    minify: false,
    globalName: 'Gladia',
    noExternal: ['eventemitter3'],
  },
])
