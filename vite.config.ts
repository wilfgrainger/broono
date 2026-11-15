import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Broono is a conventional static application. It has no Worker, server function,
// runtime API, service-worker application cache, authentication, or billing layer.
// GitHub Pages serves the generated dist/ directory; user state remains local.
// The dev server injects an inline React Refresh preamble, so index.html keeps
// 'unsafe-inline' for scripts. The production document has no inline scripts,
// so the build tightens script-src to same-origin files only.
function strictProductionCsp(): Plugin {
  return {
    name: 'broono-strict-production-csp',
    apply: 'build',
    transformIndexHtml(html) {
      const tightened = html.replace("script-src 'self' 'unsafe-inline'", "script-src 'self'")
      if (tightened === html) {
        throw new Error('Expected a script-src directive to tighten in index.html')
      }
      return tightened
    },
  }
}

// connect-src 'none' also blocks Vite's hot-reload WebSocket, so the dev server
// (only) allows same-origin connections. index.html itself stays at 'none'.
function devServerCsp(): Plugin {
  return {
    name: 'broono-dev-server-csp',
    apply: 'serve',
    transformIndexHtml(html, ctx) {
      return ctx.server ? html.replace("connect-src 'none'", "connect-src 'self' ws: wss:") : html
    },
  }
}

export default defineConfig({
  plugins: [react(), strictProductionCsp(), devServerCsp()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
