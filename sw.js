// Suppress ALL console messages in service worker
console.log = () => {}
console.error = () => {}
console.warn = () => {}
console.info = () => {}

const CACHE_NAME = 'reli-v4'

self.addEventListener('install', event => {
    event.waitUntil(
        Promise.resolve()
            .then(() => self.skipWaiting())
            .catch(() => self.skipWaiting())
    )
})

self.addEventListener('activate', event => {
    event.waitUntil(
        caches
            .keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName)
                        }
                    })
                )
            })
            .then(() => self.clients.claim())
            .catch(() => self.clients.claim())
    )
})

self.addEventListener('fetch', event => {
    // Simple fetch without caching to avoid errors
    event.respondWith(
        fetch(event.request).catch(() => {
            return new Response('', { status: 200 })
        })
    )
})
