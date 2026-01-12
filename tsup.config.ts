import { defineConfig } from 'tsup'
import { builtinModules } from 'module'

const nodeExternals = [...builtinModules, ...builtinModules.map((m) => `node:${m}`)]

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['cjs'],
  target: 'node24',
  platform: 'node', // ⭐ 关键
  outDir: 'dist',
  sourcemap: false,
  minify: false,
  clean: true,
  splitting: false, // 单文件
  external: [...nodeExternals, 'pino', 'fastify'],
})
