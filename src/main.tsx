import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
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
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
}

async function bootstrap() {
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
