import { defineConfig } from 'tsup'
import pkg from './package.json'

// Get all dependencies from package.json
const allDependencies = Object.keys(pkg.dependencies || {}).concat(Object.keys(pkg.devDependencies || {}))

export default defineConfig({
  entry: ['src/server.ts'],

  format: ['cjs'],
  platform: 'node',
  target: 'node24',

  outDir: 'dist',
  clean: true,

  bundle: true, // ⭐ 打包所有依赖
  external: [], // ⭐ 不排除任何三方包
  splitting: false, // ⭐ 单文件
  minify: false,
  sourcemap: false,
  noExternal: allDependencies,
})
