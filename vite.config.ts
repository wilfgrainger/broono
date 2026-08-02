import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The GLP frontend is a static React application. Keeping the Cloudflare Worker
// and PWA plugins in this build made the production output ambiguous and allowed
// an obsolete service worker to keep serving the retired game. The API remains
// a separate deployment; this build always emits a conventional dist/index.html
// for GitHub Pages.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
