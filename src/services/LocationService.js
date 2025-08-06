/**
 * Location Service
 * GPS tracking and location services for route optimization and hotspot analysis
 */

export class LocationService {
    constructor() {
        this.currentPosition = null
        this.watchId = null
        this.isTracking = false
        this.locationHistory = []
        this.hotspots = this.getDefaultHotspots()
    }

    /**
     * Check if geolocation permission is granted
     */
    async checkLocationPermission() {
        if (!navigator.permissions) {
            return 'unknown'
        }

        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' })
            return permission.state // 'granted', 'denied', or 'prompt'
        } catch (error) {
            console.warn('Could not check location permission:', error)
            return 'unknown'
        }
    }

    /**
     * Get current location with fallback for development
     */
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                // Fallback for development - use Jakarta coordinates
                console.warn('Geolocation not supported, using fallback location')
                this.currentPosition = {
                    latitude: -6.2088,
                    longitude: 106.8456,
                    accuracy: 100,
                    timestamp: new Date().toISOString(),
                    fallback: true
                }
                resolve(this.currentPosition)
                return
            }

            // Check if we're on HTTP (not HTTPS) and provide fallback
            if (location.protocol === 'http:' && location.hostname !== 'localhost') {
                console.warn('Geolocation requires HTTPS, using fallback location')
                this.currentPosition = {
                    latitude: -6.2088,
                    longitude: 106.8456,
                    accuracy: 100,
                    timestamp: new Date().toISOString(),
                    fallback: true
                }
                resolve(this.currentPosition)
                return
            }

            navigator.geolocation.getCurrentPosition(
                position => {
                    this.currentPosition = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString(),
                        fallback: false
                    }
                    resolve(this.currentPosition)
                },
                error => {
                    console.warn('Geolocation error, using fallback:', error)
                    // Use fallback location instead of rejecting
                    this.currentPosition = {
                        latitude: -6.2088,
                        longitude: 106.8456,
                        accuracy: 100,
                        timestamp: new Date().toISOString(),
                        fallback: true
                    }
                    resolve(this.currentPosition)
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000,
                }
            )
        })
    }

    /**
     * Start location tracking
     */
    async startTracking() {
        if (!navigator.geolocation) {
            throw new Error('Geolocation tidak didukung oleh browser ini')
        }

        if (this.isTracking) {
            return Promise.resolve()
        }

        // First get current position to check permissions
        try {
            await this.getCurrentLocation()
        } catch (error) {
            throw new Error(`Tidak dapat memulai tracking: ${error.message}`)
        }

        return new Promise((resolve, reject) => {
            this.watchId = navigator.geolocation.watchPosition(
                position => {
                    const locationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        speed: position.coords.speed,
                        heading: position.coords.heading,
                        timestamp: new Date().toISOString(),
                    }

                    this.currentPosition = locationData
                    this.locationHistory.push(locationData)

                    // Keep only last 100 locations
                    if (this.locationHistory.length > 100) {
                        this.locationHistory = this.locationHistory.slice(-100)
                    }

                    // Save to localStorage
                    this.saveLocationHistory()

                    // Dispatch custom event
                    window.dispatchEvent(
                        new CustomEvent('locationUpdate', {
                            detail: locationData,
                        })
                    )

                    // Resolve on first successful position
                    if (!this.isTracking) {
                        this.isTracking = true
                        resolve()
                    }
                },
                error => {
                    console.error('Location tracking error:', error)
                    this.isTracking = false

                    let errorMessage = 'Gagal tracking lokasi'
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Akses lokasi ditolak. Silakan izinkan akses lokasi di browser.'
                            break
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Informasi lokasi tidak tersedia'
                            break
                        case error.TIMEOUT:
                            errorMessage = 'Request lokasi timeout'
                            break
                    }

                    window.dispatchEvent(
                        new CustomEvent('locationError', {
                            detail: { ...error, message: errorMessage },
                        })
                    )

                    if (!this.isTracking) {
                        reject(new Error(errorMessage))
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 30000,
                }
            )
        })
    }

    /**
     * Stop location tracking
     */
    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId)
            this.watchId = null
        }
        this.isTracking = false
    }

    /**
     * Calculate distance between two points (Haversine formula)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371 // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1)
        const dLon = this.toRadians(lon2 - lon1)
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    /**
     * Convert degrees to radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180)
    }

    /**
     * Find nearby hotspots
     */
    findNearbyHotspots(latitude, longitude, radius = 5) {
        if (!latitude || !longitude) return []

        return this.hotspots
            .filter(hotspot => {
                const distance = this.calculateDistance(latitude, longitude, hotspot.latitude, hotspot.longitude)
                return distance <= radius
            })
            .sort((a, b) => {
                const distA = this.calculateDistance(latitude, longitude, a.latitude, a.longitude)
                const distB = this.calculateDistance(latitude, longitude, b.latitude, b.longitude)
                return distA - distB
            })
    }

    /**
     * Get route optimization suggestions
     */
    getRouteOptimization(currentLat, currentLon) {
        const nearbyHotspots = this.findNearbyHotspots(currentLat, currentLon, 10)
        const suggestions = []

        // Time-based recommendations
        const currentHour = new Date().getHours()

        if (currentHour >= 7 && currentHour <= 9) {
            suggestions.push({
                type: 'time',
                title: 'Jam Sibuk Pagi',
                description: 'Fokus pada area perkantoran dan stasiun',
                priority: 'high',
                areas: nearbyHotspots.filter(h => h.type === 'office' || h.type === 'transport'),
            })
        } else if (currentHour >= 11 && currentHour <= 14) {
            suggestions.push({
                type: 'time',
                title: 'Jam Makan Siang',
                description: 'Posisikan di area mall dan restoran',
                priority: 'high',
                areas: nearbyHotspots.filter(h => h.type === 'mall' || h.type === 'restaurant'),
            })
        } else if (currentHour >= 17 && currentHour <= 20) {
            suggestions.push({
                type: 'time',
                title: 'Jam Pulang Kerja',
                description: 'Fokus pada area perkantoran dan residential',
                priority: 'high',
                areas: nearbyHotspots.filter(h => h.type === 'office' || h.type === 'residential'),
            })
        } else if (currentHour >= 20 && currentHour <= 23) {
            suggestions.push({
                type: 'time',
                title: 'Jam Malam',
                description: 'Area hiburan dan residential',
                priority: 'medium',
                areas: nearbyHotspots.filter(h => h.type === 'entertainment' || h.type === 'residential'),
            })
        }

        // Distance-based recommendations
        if (nearbyHotspots.length > 0) {
            const closest = nearbyHotspots[0]
            const distance = this.calculateDistance(currentLat, currentLon, closest.latitude, closest.longitude)

            suggestions.push({
                type: 'distance',
                title: 'Hotspot Terdekat',
                description: `${closest.name} - ${distance.toFixed(1)} km`,
                priority: 'medium',
                areas: [closest],
            })
        }

        return suggestions
    }

    /**
     * Get location analytics
     */
    getLocationAnalytics() {
        const analytics = {
            totalLocations: this.locationHistory.length,
            trackingDuration: 0,
            averageSpeed: 0,
            totalDistance: 0,
            mostVisitedAreas: [],
            timeSpentInHotspots: 0,
        }

        if (this.locationHistory.length < 2) {
            return analytics
        }

        // Calculate tracking duration
        const firstLocation = this.locationHistory[0]
        const lastLocation = this.locationHistory[this.locationHistory.length - 1]
        analytics.trackingDuration = new Date(lastLocation.timestamp) - new Date(firstLocation.timestamp)

        // Calculate total distance and average speed
        let totalDistance = 0
        let totalSpeed = 0
        let speedCount = 0

        for (let i = 1; i < this.locationHistory.length; i++) {
            const prev = this.locationHistory[i - 1]
            const curr = this.locationHistory[i]

            const distance = this.calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude)
            totalDistance += distance

            if (curr.speed !== null && curr.speed !== undefined) {
                totalSpeed += curr.speed * 3.6 // Convert m/s to km/h
                speedCount++
            }
        }

        analytics.totalDistance = totalDistance
        analytics.averageSpeed = speedCount > 0 ? totalSpeed / speedCount : 0

        return analytics
    }

    /**
     * Save location history to localStorage
     */
    saveLocationHistory() {
        try {
            const data = {
                history: this.locationHistory.slice(-50), // Keep last 50 locations
                lastUpdate: new Date().toISOString(),
            }
            localStorage.setItem('reli-location-data', JSON.stringify(data))
        } catch (error) {
            console.error('Error saving location history:', error)
        }
    }

    /**
     * Load location history from localStorage
     */
    loadLocationHistory() {
        try {
            const data = JSON.parse(localStorage.getItem('reli-location-data') || '{}')
            if (data.history) {
                this.locationHistory = data.history
            }
        } catch (error) {
            console.error('Error loading location history:', error)
        }
    }

    /**
     * Get default hotspots (Jakarta area examples)
     */
    getDefaultHotspots() {
        return [
            // Perkantoran
            { id: 1, name: 'Sudirman CBD', type: 'office', latitude: -6.2088, longitude: 106.8456, demand: 'high' },
            {
                id: 2,
                name: 'Kuningan Business District',
                type: 'office',
                latitude: -6.2297,
                longitude: 106.8317,
                demand: 'high',
            },
            { id: 3, name: 'Thamrin', type: 'office', latitude: -6.1944, longitude: 106.8229, demand: 'high' },

            // Mall
            { id: 4, name: 'Grand Indonesia', type: 'mall', latitude: -6.1944, longitude: 106.8229, demand: 'high' },
            { id: 5, name: 'Plaza Indonesia', type: 'mall', latitude: -6.1944, longitude: 106.8229, demand: 'high' },
            { id: 6, name: 'Central Park', type: 'mall', latitude: -6.1781, longitude: 106.7906, demand: 'medium' },

            // Transportasi
            {
                id: 7,
                name: 'Stasiun Gambir',
                type: 'transport',
                latitude: -6.1667,
                longitude: 106.8333,
                demand: 'high',
            },
            {
                id: 8,
                name: 'Bandara Soekarno-Hatta',
                type: 'transport',
                latitude: -6.1256,
                longitude: 106.6559,
                demand: 'high',
            },
            {
                id: 9,
                name: 'Stasiun Tanah Abang',
                type: 'transport',
                latitude: -6.1867,
                longitude: 106.8133,
                demand: 'medium',
            },

            // Residential
            {
                id: 10,
                name: 'Kelapa Gading',
                type: 'residential',
                latitude: -6.1581,
                longitude: 106.9106,
                demand: 'medium',
            },
            {
                id: 11,
                name: 'Pondok Indah',
                type: 'residential',
                latitude: -6.2642,
                longitude: 106.7831,
                demand: 'medium',
            },
            { id: 12, name: 'Kemang', type: 'residential', latitude: -6.2614, longitude: 106.8161, demand: 'medium' },

            // Entertainment
            {
                id: 13,
                name: 'Senayan City',
                type: 'entertainment',
                latitude: -6.2297,
                longitude: 106.8019,
                demand: 'medium',
            },
            { id: 14, name: 'SCBD', type: 'entertainment', latitude: -6.2297, longitude: 106.8019, demand: 'high' },

            // Restaurant Areas
            {
                id: 15,
                name: 'PIK Avenue',
                type: 'restaurant',
                latitude: -6.1081,
                longitude: 106.7411,
                demand: 'medium',
            },
            { id: 16, name: 'Blok M', type: 'restaurant', latitude: -6.2447, longitude: 106.7997, demand: 'medium' },
        ]
    }

    /**
     * Get area recommendations based on time and location
     */
    getAreaRecommendations(currentLat, currentLon) {
        const currentHour = new Date().getHours()
        const currentDay = new Date().getDay() // 0 = Sunday, 6 = Saturday
        const isWeekend = currentDay === 0 || currentDay === 6

        let recommendations = []

        // Time-based recommendations
        if (currentHour >= 6 && currentHour <= 9) {
            recommendations.push({
                time: 'Pagi (06:00-09:00)',
                areas: ['Stasiun', 'Area Perkantoran', 'Residential'],
                reason: 'Jam berangkat kerja, banyak penumpang ke kantor',
                priority: 'high',
            })
        }

        if (currentHour >= 11 && currentHour <= 14) {
            recommendations.push({
                time: 'Siang (11:00-14:00)',
                areas: ['Mall', 'Restoran', 'Perkantoran'],
                reason: 'Jam makan siang dan belanja',
                priority: 'high',
            })
        }

        if (currentHour >= 17 && currentHour <= 20) {
            recommendations.push({
                time: 'Sore (17:00-20:00)',
                areas: ['Perkantoran', 'Stasiun', 'Mall'],
                reason: 'Jam pulang kerja dan belanja sore',
                priority: 'high',
            })
        }

        if (currentHour >= 19 && currentHour <= 23) {
            recommendations.push({
                time: 'Malam (19:00-23:00)',
                areas: ['Restoran', 'Hiburan', 'Residential'],
                reason: 'Jam makan malam dan hiburan',
                priority: 'medium',
            })
        }

        // Weekend adjustments
        if (isWeekend) {
            recommendations = recommendations.map(rec => ({
                ...rec,
                areas: rec.areas.filter(area => area !== 'Perkantoran').concat(['Mall', 'Hiburan', 'Wisata']),
                reason: rec.reason + ' (Weekend: fokus mall dan hiburan)',
            }))
        }

        return recommendations
    }
}

// Create singleton instance
export const locationService = new LocationService()
