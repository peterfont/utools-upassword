import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://47.93.6.36:8181', // API服务器地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '') // 去掉请求路径中的 /api 前缀
      },
      '/auth': {
        target: 'http://47.93.6.36:8181',
        changeOrigin: true
      }
    }
  }
})