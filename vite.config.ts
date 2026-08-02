import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Broono is a conventional static application. It has no Worker, server function,
// runtime API, service-worker application cache, authentication, or billing layer.
// GitHub Pages serves the generated dist/ directory; user state remains local.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
