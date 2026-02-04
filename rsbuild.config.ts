import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
// Docs: https://rsbuild.rs/config/
import pkg from './package.json'
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    // 将 VITE_ 前缀的环境变量注入到前端代码
    define: {
      'import.meta.env.VITE_ENCRYPTION_KEY': JSON.stringify(
        process.env.VITE_ENCRYPTION_KEY || ''
      ),
      'import.meta.env.VITE_DATABASE_URL': JSON.stringify(
        process.env.VITE_DATABASE_URL || ''
      ),
    },
  },
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
