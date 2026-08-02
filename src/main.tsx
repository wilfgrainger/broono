import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import './polish.css'

const RESTORE_SESSION_KEY = 'broono:glp-runtime-reset:v3'

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
    // Cleanup is deliberately best-effort. Rendering the health app takes priority.
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

  // When this bundle was reached through an obsolete service worker, reload once
  // after unregistering it so the next navigation is guaranteed to come from the
  // network rather than the retired styling-game cache.
  if (wasControlled && !window.sessionStorage.getItem(RESTORE_SESSION_KEY)) {
    window.sessionStorage.setItem(RESTORE_SESSION_KEY, 'complete')
    window.location.reload()
    return
  }

  renderApplication()
}

void bootstrap()
