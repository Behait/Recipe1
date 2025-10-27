import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8788', // `wrangler pages dev` 的默认地址
        changeOrigin: true,
      },
    },
  },
})
