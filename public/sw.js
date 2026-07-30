/*
 * One-release service-worker kill switch.
 *
 * Older Broono game deployments installed a root-scoped Workbox worker at
 * /sw.js. Browsers request this URL directly when checking for an update. This
 * replacement activates immediately, clears every cache, unregisters itself and
 * reloads open Broono tabs so they return to the network-hosted GLP app.
 */
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
    await self.registration.unregister()

    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    await Promise.all(clients.map((client) => client.navigate(client.url)))
  })())
})

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
