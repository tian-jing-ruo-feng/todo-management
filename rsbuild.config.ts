import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
// Docs: https://rsbuild.rs/config/
import pkg from './package.json'
export default defineConfig({
  plugins: [pluginReact()],
  resolve: {
    alias: {
      '@': './src',
    },
  },
  html: {
    title: pkg.name,
  },
  output: {
    assetPrefix:
      process.env.NODE_ENV === 'production' ? '/todo-management/' : '/',
  },
})
