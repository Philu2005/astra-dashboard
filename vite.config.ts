import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Only proxy backend API routes – NOT /auth/callback which is a frontend route
      '/auth/me': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/auth/exchange': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/auth/logout': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/auth/discord': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
