import {defineConfig} from 'vite';
export default defineConfig({build:{ssr:'scripts/benchmark-study.ts',outDir:'artifacts/benchmark',emptyOutDir:false,rolldownOptions:{output:{entryFileNames:'study.mjs'}}}});
