import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

const RESTORE_CACHE_KEY = 'broono:glp-restore:2026-07-30'

async function removeLegacyGameCache() {
  try {
    if (window.localStorage.getItem(RESTORE_CACHE_KEY)) return
    window.localStorage.setItem(RESTORE_CACHE_KEY, 'complete')

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    }

    if ('caches' in window) {
      const cacheNames = await window.caches.keys()
      await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)))
    }
  } catch {
    // Cache cleanup is best-effort. The application must still start normally.
  }
}

void removeLegacyGameCache()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
