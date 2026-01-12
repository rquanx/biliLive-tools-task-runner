import { defineConfig } from 'vite'
import path from 'path'
import { builtinModules } from 'module'

// Keep Node built-ins external but bundle all project dependencies.
const nodeExternals = [...builtinModules, ...builtinModules.map((m) => `node:${m}`)]

export default defineConfig({
  build: {
    target: 'node24',
    outDir: 'dist',
    minify: false,
    sourcemap: false,
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/server.ts'),
      formats: ['cjs'],
      fileName: () => 'server',
    },
    rollupOptions: {
      external: nodeExternals,
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'server.js',
      },
    },
  },
})
