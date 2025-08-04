const CACHE_NAME = 'reli-v2.0.0'
const STATIC_CACHE = 'reli-static-v2.0.0'
const DYNAMIC_CACHE = 'reli-dynamic-v2.0.0'

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/src/main.js',
    '/src/organisms/App.js',
    '/src/molecules/PlatformInput.js',
    '/src/molecules/FuelInput.js',
    '/src/molecules/AdditionalCosts.js',
    '/src/molecules/AnalyticsDashboard.js',
    '/src/molecules/SmartNotifications.js',
    '/src/molecules/LocationFeatures.js',
    '/src/molecules/AdvancedAnalytics.js',
    '/src/molecules/EarningsOptimizer.js',
    '/src/molecules/AutomationHub.js',
    '/src/atoms/Button.js',
    '/src/atoms/Input.js',
    '/src/atoms/Label.js',
    '/src/utils/storage.js',
    '/manifest.json',
]

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...')

    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static files')
                return cache.addAll(STATIC_FILES)
            })
            .then(() => {
                console.log('Service Worker: Static files cached successfully')
                return self.skipWaiting()
            })
            .catch(error => {
                console.error('Service Worker: Error caching static files:', error)
            })
    )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...')

    event.waitUntil(
        caches
            .keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache:', cacheName)
                            return caches.delete(cacheName)
                        }
                    })
                )
            })
            .then(() => {
                console.log('Service Worker: Activated successfully')
                return self.clients.claim()
            })
    )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event
    const url = new URL(request.url)

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return
    }

    // Skip external requests (Google Maps, APIs, etc.)
    if (!url.origin.includes(self.location.origin)) {
        return
    }

    event.respondWith(
        caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
                console.log('Service Worker: Serving from cache:', request.url)
                return cachedResponse
            }

            // Not in cache, fetch from network
            return fetch(request)
                .then(networkResponse => {
                    // Don't cache if not successful
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse
                    }

                    // Clone the response
                    const responseToCache = networkResponse.clone()

                    // Add to dynamic cache
                    caches.open(DYNAMIC_CACHE).then(cache => {
                        console.log('Service Worker: Caching dynamic resource:', request.url)
                        cache.put(request, responseToCache)
                    })

                    return networkResponse
                })
                .catch(error => {
                    console.error('Service Worker: Fetch failed:', error)

                    // Return offline fallback for HTML requests
                    if (request.headers.get('accept').includes('text/html')) {
                        return caches.match('/index.html')
                    }

                    throw error
                })
        })
    )
})

// Background sync for data synchronization
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync triggered:', event.tag)

    if (event.tag === 'reli-data-sync') {
        event.waitUntil(syncData())
    }
})

// Push notifications
self.addEventListener('push', event => {
    console.log('Service Worker: Push notification received')

    const options = {
        body: event.data ? event.data.text() : 'RELI notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1,
        },
        actions: [
            {
                action: 'open',
                title: 'Buka RELI',
                icon: '/icon-192.png',
            },
            {
                action: 'close',
                title: 'Tutup',
                icon: '/icon-192.png',
            },
        ],
    }

    event.waitUntil(self.registration.showNotification('RELI - Driver Assistant', options))
})

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked:', event.action)

    event.notification.close()

    if (event.action === 'open') {
        event.waitUntil(clients.openWindow('/'))
    }
})

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    console.log('Service Worker: Periodic sync triggered:', event.tag)

    if (event.tag === 'reli-periodic-sync') {
        event.waitUntil(periodicSync())
    }
})

// Message handler for communication with main thread
self.addEventListener('message', event => {
    console.log('Service Worker: Message received:', event.data)

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME })
    }

    if (event.data && event.data.type === 'CACHE_DATA') {
        cacheUserData(event.data.payload)
    }
})

// Sync data function
async function syncData() {
    try {
        console.log('Service Worker: Syncing data...')

        // Get data from IndexedDB or localStorage
        const data = await getStoredData()

        if (data) {
            // In a real app, send to server
            console.log('Service Worker: Data synced successfully')

            // Show success notification
            self.registration.showNotification('RELI - Sync Berhasil', {
                body: 'Data berhasil disinkronisasi',
                icon: '/icon-192.png',
                tag: 'sync-success',
            })
        }
    } catch (error) {
        console.error('Service Worker: Sync failed:', error)

        // Show error notification
        self.registration.showNotification('RELI - Sync Gagal', {
            body: 'Gagal sinkronisasi data. Akan dicoba lagi nanti.',
            icon: '/icon-192.png',
            tag: 'sync-error',
        })
    }
}

// Periodic sync function
async function periodicSync() {
    try {
        console.log('Service Worker: Running periodic sync...')

        // Perform maintenance tasks
        await cleanOldData()
        await optimizeCache()
        await syncData()

        console.log('Service Worker: Periodic sync completed')
    } catch (error) {
        console.error('Service Worker: Periodic sync failed:', error)
    }
}

// Get stored data
async function getStoredData() {
    try {
        // In a real app, use IndexedDB
        return new Promise(resolve => {
            // Simulate getting data
            resolve({ timestamp: Date.now(), data: 'sample' })
        })
    } catch (error) {
        console.error('Service Worker: Error getting stored data:', error)
        return null
    }
}

// Cache user data
async function cacheUserData(data) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE)
        const response = new Response(JSON.stringify(data))
        await cache.put('/user-data', response)
        console.log('Service Worker: User data cached')
    } catch (error) {
        console.error('Service Worker: Error caching user data:', error)
    }
}

// Clean old data
async function cleanOldData() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE)
        const requests = await cache.keys()

        const oldRequests = requests.filter(request => {
            // Remove data older than 30 days
            const url = new URL(request.url)
            const timestamp = url.searchParams.get('timestamp')
            if (timestamp) {
                const age = Date.now() - parseInt(timestamp)
                return age > 30 * 24 * 60 * 60 * 1000 // 30 days
            }
            return false
        })

        await Promise.all(oldRequests.map(request => cache.delete(request)))
        console.log(`Service Worker: Cleaned ${oldRequests.length} old entries`)
    } catch (error) {
        console.error('Service Worker: Error cleaning old data:', error)
    }
}

// Optimize cache
async function optimizeCache() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE)
        const requests = await cache.keys()

        // Keep only the most recent 100 entries
        if (requests.length > 100) {
            const oldRequests = requests.slice(100)
            await Promise.all(oldRequests.map(request => cache.delete(request)))
            console.log(`Service Worker: Optimized cache, removed ${oldRequests.length} entries`)
        }
    } catch (error) {
        console.error('Service Worker: Error optimizing cache:', error)
    }
}

// Error handler
self.addEventListener('error', event => {
    console.error('Service Worker: Global error:', event.error)
})

// Unhandled rejection handler
self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker: Unhandled rejection:', event.reason)
    event.preventDefault()
})
