const CACHE_NAME = 'reli-v1'
const urlsToCache = [
    '/',
    '/index.html',
    '/src/main.js',
    '/src/organisms/App.js',
    '/src/molecules/PlatformInput.js',
    '/src/molecules/FuelInput.js',
    '/src/atoms/Button.js',
    '/src/atoms/Input.js',
    '/src/atoms/Label.js',
    '/src/utils/pwa.js',
    '/manifest.json',
]

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)))
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
