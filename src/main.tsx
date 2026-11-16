import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { syncColorSchemeAcrossTabs } from './utils/theme'
import '@fontsource-variable/inter/wght.css'
import '@fontsource/dm-serif-display/400.css'
import '@fontsource/dm-serif-display/400-italic.css'
import './index.css'
import './polish.css'

const RESTORE_SESSION_KEY = 'broono:local-runtime-reset:v1'

async function removeLegacyGameRuntime(): Promise<boolean> {
  const wasControlled = 'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller)

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    }

    if ('caches' in window) {
      const cacheNames = await window.caches.keys()
      await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)))
    }
  } catch {
    // Cleanup is best-effort. Rendering the local tracker takes priority.
  }

  return wasControlled
}

function renderApplication() {
  syncColorSchemeAcrossTabs()
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

async function bootstrap() {
  // Canonical host redirect. Lives here rather than inline in index.html so the
  // production Content-Security-Policy can forbid inline scripts.
  if (window.location.hostname === 'www.broono.app') {
    window.location.replace(`https://broono.app${window.location.pathname}${window.location.search}`)
    return
  }

  const wasControlled = await removeLegacyGameRuntime()

  // Reload once after retiring an obsolete root service worker so the local
  // edition is loaded directly from the current static GitHub Pages release.
  if (wasControlled && !window.sessionStorage.getItem(RESTORE_SESSION_KEY)) {
    window.sessionStorage.setItem(RESTORE_SESSION_KEY, 'complete')
    window.location.reload()
    return
  }

  renderApplication()
}

void bootstrap()
