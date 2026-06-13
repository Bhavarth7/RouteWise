import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { cli: 'src/cli/index.ts' },
    format: ['esm'],
    target: 'node20',
    platform: 'node',
    outDir: 'dist',
    clean: true,
    dts: false,
    sourcemap: true,
    banner: { js: '#!/usr/bin/env node' },
  },
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    target: 'node20',
    platform: 'node',
    outDir: 'dist',
    clean: false,
    dts: true,
    sourcemap: true,
  },
]);
