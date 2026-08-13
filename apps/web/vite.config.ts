import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
  server: {
    allowedHosts: ['fbf3-152-58-1-123.ngrok-free.app'],
    proxy: {
      // Dodo webhooks live on the API (5001); web is the public entry point.
      // Forward only the webhook path so /api/auth and other web routes are unaffected.
      '/api/webhook/dodo': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})

export default config
