import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
// Docs: https://rsbuild.rs/config/
import pkg from './package.json'

// 根据环境模式动态设置 assetPrefix
const getAssetPrefix = (env, envMode) => {
  const mode = envMode || env

  if (mode === process.env.VITE_ENV_MODE) {
    return process.env.VITE_BASE_URL
  }

  // github -> /todo-management/
  if (mode === 'production') {
    return '/todo-management/'
  }

  // 开发环境 -> /
  return '/'
}

export default defineConfig(({ env, envMode }) => ({
  plugins: [pluginReact()],
  server: {
    proxy: {
      '/api/bing': {
        target: 'https://www.bing.com',
        changeOrigin: true,
        pathRewrite: { '^/api/bing': '' },
      },
    },
  },
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
    assetPrefix: getAssetPrefix(env, envMode),
  },
}))
