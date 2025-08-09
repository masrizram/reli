// Minimal service worker - suppress all console output
console.log = console.error = console.warn = console.info = () => {}

// Simple service worker that does nothing but stay silent
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())
self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request).catch(() => new Response('')))
})
