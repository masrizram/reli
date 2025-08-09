const CACHE_NAME = 'reli-v2'
const urlsToCache = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', event => {
    console.log('Service Worker: Installing...')
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching static files')
                return cache.addAll(urlsToCache)
            })
            .then(() => {
                console.log('Service Worker: Static files cached successfully')
                return self.skipWaiting()
            })
            .catch(error => {
                console.error('Service Worker: Error caching static files:', error)
                // Continue without caching if there's an error
                return self.skipWaiting()
            })
    )
})

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response
            }
            return fetch(event.request)
        })
    )
})
