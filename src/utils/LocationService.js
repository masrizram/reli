import { eventBus } from '../core/EventBus.js'

/**
 * Location service for GPS tracking and geolocation features
 */
export class LocationService {
    constructor() {
        this.watchId = null
        this.currentPosition = null
        this.isTracking = false
        this.totalDistance = 0
        this.lastPosition = null
        this.trackingStartTime = null
        this.positions = []

        // Options for geolocation
        this.options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
        }
    }

    /**
     * Check if geolocation is supported
     * @returns {boolean} Support status
     */
    isSupported() {
        return 'geolocation' in navigator
    }

    /**
     * Get current position
     * @returns {Promise<Position>} Current position
     */
    async getCurrentPosition() {
        if (!this.isSupported()) {
            throw new Error('Geolocation tidak didukung oleh browser ini')
        }

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                position => {
                    this.currentPosition = position
                    eventBus.emit('location:position', position)
                    resolve(position)
                },
                error => {
                    eventBus.emit('location:error', error)
                    reject(this.getErrorMessage(error))
                },
                this.options
            )
        })
    }

    /**
     * Start GPS tracking
     * @returns {Promise<void>} Start tracking promise
     */
    async startTracking() {
        if (!this.isSupported()) {
            throw new Error('Geolocation tidak didukung oleh browser ini')
        }

        if (this.isTracking) {
            return
        }

        try {
            // Get initial position
            await this.getCurrentPosition()

            this.isTracking = true
            this.trackingStartTime = Date.now()
            this.totalDistance = 0
            this.positions = []
            this.lastPosition = this.currentPosition

            // Start watching position
            this.watchId = navigator.geolocation.watchPosition(
                position => this.handlePositionUpdate(position),
                error => this.handleError(error),
                this.options
            )

            eventBus.emit('location:tracking-started', {
                startTime: this.trackingStartTime,
                position: this.currentPosition,
            })
        } catch (error) {
            this.isTracking = false
            throw error
        }
    }

    /**
     * Stop GPS tracking
     */
    stopTracking() {
        if (!this.isTracking) {
            return
        }

        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId)
            this.watchId = null
        }

        const trackingData = {
            duration: Date.now() - this.trackingStartTime,
            distance: this.totalDistance,
            positions: this.positions,
            startTime: this.trackingStartTime,
            endTime: Date.now(),
        }

        this.isTracking = false

        eventBus.emit('location:tracking-stopped', trackingData)
        eventBus.emit('location:distance-update', {
            distance: this.totalDistance,
            duration: trackingData.duration,
        })
    }

    /**
     * Handle position updates during tracking
     * @param {Position} position - New position
     */
    handlePositionUpdate(position) {
        this.currentPosition = position
        this.positions.push({
            ...position,
            timestamp: Date.now(),
        })

        // Calculate distance if we have a previous position
        if (this.lastPosition) {
            const distance = this.calculateDistance(
                this.lastPosition.coords.latitude,
                this.lastPosition.coords.longitude,
                position.coords.latitude,
                position.coords.longitude
            )

            // Only add distance if movement is significant (> 10 meters)
            if (distance > 0.01) {
                this.totalDistance += distance
                this.lastPosition = position

                eventBus.emit('location:distance-update', {
                    distance: this.totalDistance,
                    increment: distance,
                    position,
                })
            }
        }

        eventBus.emit('location:position', position)
    }

    /**
     * Handle geolocation errors
     * @param {GeolocationPositionError} error - Geolocation error
     */
    handleError(error) {
        const errorMessage = this.getErrorMessage(error)
        eventBus.emit('location:error', { error, message: errorMessage })

        // Stop tracking on error
        if (this.isTracking) {
            this.stopTracking()
        }
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * @param {number} lat1 - Latitude 1
     * @param {number} lon1 - Longitude 1
     * @param {number} lat2 - Latitude 2
     * @param {number} lon2 - Longitude 2
     * @returns {number} Distance in kilometers
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
     * @param {number} degrees - Degrees
     * @returns {number} Radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180)
    }

    /**
     * Get user-friendly error message
     * @param {GeolocationPositionError} error - Geolocation error
     * @returns {string} Error message
     */
    getErrorMessage(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                return 'Akses lokasi ditolak. Silakan izinkan akses lokasi di browser.'
            case error.POSITION_UNAVAILABLE:
                return 'Informasi lokasi tidak tersedia.'
            case error.TIMEOUT:
                return 'Timeout mendapatkan lokasi. Coba lagi.'
            default:
                return 'Terjadi kesalahan saat mendapatkan lokasi.'
        }
    }

    /**
     * Get tracking status
     * @returns {Object} Tracking status
     */
    getTrackingStatus() {
        return {
            isTracking: this.isTracking,
            totalDistance: this.totalDistance,
            duration: this.trackingStartTime ? Date.now() - this.trackingStartTime : 0,
            currentPosition: this.currentPosition,
            positionCount: this.positions.length,
        }
    }

    /**
     * Reset tracking data
     */
    reset() {
        this.stopTracking()
        this.totalDistance = 0
        this.positions = []
        this.lastPosition = null
        this.trackingStartTime = null
    }

    /**
     * Export tracking data
     * @returns {Object} Tracking data
     */
    exportTrackingData() {
        return {
            totalDistance: this.totalDistance,
            duration: this.trackingStartTime ? Date.now() - this.trackingStartTime : 0,
            startTime: this.trackingStartTime,
            endTime: Date.now(),
            positions: this.positions,
            positionCount: this.positions.length,
        }
    }
}

// Global location service instance
export const locationService = new LocationService()
