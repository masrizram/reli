const CACHE_NAME = 'reli-v3'
const urlsToCache = ['/']

self.addEventListener('install', event => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache => {
                // Try to cache files individually to avoid batch failures
                return Promise.allSettled(
                    urlsToCache.map(url =>
                        cache.add(url).catch(err => {
                            // Silently ignore individual cache failures
                            return null
                        })
                    )
                )
            })
            .then(() => self.skipWaiting())
            .catch(() => {
                // Continue without caching if there's an error
                return self.skipWaiting()
            })
    )
})

self.addEventListener('fetch', event => {
    event.respondWith(
        caches
            .match(event.request)
            .then(response => {
                if (response) {
                    return response
                }
                return fetch(event.request)
            })
            .catch(() => {
                // Return a basic response for failed requests
                return new Response('Offline', { status: 200 })
            })
    )
})

// Suppress service worker console messages
const originalConsoleError = console.error
const originalConsoleLog = console.log

console.error = function (...args) {
    const message = args.join(' ').toLowerCase()
    if (message.includes('failed to execute') || message.includes('request failed') || message.includes('cache')) {
        return
    }
    originalConsoleError.apply(console, args)
}

console.log = function (...args) {
    const message = args.join(' ').toLowerCase()
    if (
        message.includes('service worker') ||
        message.includes('caching') ||
        message.includes('installing') ||
        message.includes('activating')
    ) {
        return
    }
    originalConsoleLog.apply(console, args)
}
