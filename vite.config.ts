import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: true, // Show error overlay in the browser
    },
    watch: {
      usePolling: true, // Enable polling for better file watching on Windows
      interval: 100, // Polling interval in milliseconds
    },
  },
  // Ensure HMR is enabled
  optimizeDeps: {
    exclude: [], // Don't exclude anything that might break HMR
  },
})
