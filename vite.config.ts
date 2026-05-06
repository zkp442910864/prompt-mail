import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [UnoCSS(), react()],
  // Vite 7 默认使用 oxc 转换 ts/jsx/tsx 文件，无需额外配置
  server: {
    port: 9090,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
