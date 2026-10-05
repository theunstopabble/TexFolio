import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@texfolio/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split vendor bundles for parallel loading and better caching
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            // Clerk SDK — heavy (~200KB), separate chunk for better caching
            if (id.includes('@clerk')) return 'clerk'
            // React core — rarely changes
            if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
            // Router
            if (id.includes('react-router')) return 'router'
            // React Query
            if (id.includes('@tanstack')) return 'query'
            // UI utilities
            if (id.includes('react-hot-toast') || id.includes('zustand')) return 'ui'
          }
        },
      },
    },
  },
})