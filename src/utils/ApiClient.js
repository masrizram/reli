/**
 * HTTP API Client with error handling and retry logic
 */
export class ApiClient {
    constructor(baseURL = '', options = {}) {
        this.baseURL = baseURL
        this.defaultOptions = {
            timeout: 10000,
            retries: 3,
            retryDelay: 1000,
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        }
    }

    /**
     * Make HTTP request with retry logic
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {Promise} Response promise
     */
    async request(url, options = {}) {
        const fullUrl = this.baseURL + url
        const config = {
            ...this.defaultOptions,
            ...options,
            headers: {
                ...this.defaultOptions.headers,
                ...options.headers,
            },
        }

        let lastError

        for (let attempt = 0; attempt <= config.retries; attempt++) {
            try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), config.timeout)

                const response = await fetch(fullUrl, {
                    ...config,
                    signal: controller.signal,
                })

                clearTimeout(timeoutId)

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }

                const contentType = response.headers.get('content-type')
                if (contentType && contentType.includes('application/json')) {
                    return await response.json()
                }

                return await response.text()
            } catch (error) {
                lastError = error

                if (attempt < config.retries) {
                    await this.delay(config.retryDelay * Math.pow(2, attempt))
                    continue
                }

                break
            }
        }

        throw lastError
    }

    /**
     * GET request
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {Promise} Response promise
     */
    async get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' })
    }

    /**
     * POST request
     * @param {string} url - Request URL
     * @param {*} data - Request data
     * @param {Object} options - Request options
     * @returns {Promise} Response promise
     */
    async post(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    /**
     * PUT request
     * @param {string} url - Request URL
     * @param {*} data - Request data
     * @param {Object} options - Request options
     * @returns {Promise} Response promise
     */
    async put(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        })
    }

    /**
     * DELETE request
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {Promise} Response promise
     */
    async delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' })
    }

    /**
     * Delay utility for retry logic
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}

// Mock API endpoints for demo purposes
export class MockApiClient extends ApiClient {
    constructor() {
        super('', { retries: 0 })
    }

    async request(url, options = {}) {
        // Simulate network delay
        await this.delay(Math.random() * 1000 + 500)

        // Mock responses based on URL
        switch (url) {
            case '/spbu':
                return this.getMockSPBU()
            case '/parking':
                return this.getMockParking()
            case '/hotspots':
                return this.getMockHotspots()
            case '/fuel-prices':
                return this.getMockFuelPrices()
            default:
                throw new Error(`Mock endpoint not found: ${url}`)
        }
    }

    getMockSPBU() {
        return [
            {
                id: 1,
                name: 'SPBU Shell Sudirman',
                distance: 0.8,
                price: 10150,
                rating: 4.5,
                address: 'Jl. Sudirman No. 123',
                coordinates: { lat: -6.2088, lng: 106.8456 },
            },
            {
                id: 2,
                name: 'SPBU Pertamina Thamrin',
                distance: 1.2,
                price: 10000,
                rating: 4.2,
                address: 'Jl. Thamrin No. 456',
                coordinates: { lat: -6.1944, lng: 106.8229 },
            },
            {
                id: 3,
                name: 'SPBU Total Kuningan',
                distance: 2.1,
                price: 10200,
                rating: 4.0,
                address: 'Jl. Kuningan No. 789',
                coordinates: { lat: -6.2297, lng: 106.8311 },
            },
        ]
    }

    getMockParking() {
        return [
            {
                id: 1,
                name: 'Plaza Indonesia Parking',
                distance: 0.5,
                price: 5000,
                availability: 'Available',
                type: 'Mall',
                address: 'Jl. Thamrin, Jakarta Pusat',
            },
            {
                id: 2,
                name: 'Grand Indonesia Parking',
                distance: 0.7,
                price: 4000,
                availability: 'Limited',
                type: 'Mall',
                address: 'Jl. Thamrin, Jakarta Pusat',
            },
        ]
    }

    getMockHotspots() {
        return [
            {
                area: 'Sudirman - Thamrin',
                demand: 'High',
                surge: 1.8,
                recommendation: 'Recommended',
                timeSlots: ['07:00-09:00', '17:00-20:00'],
            },
            {
                area: 'Senayan - SCBD',
                demand: 'Medium',
                surge: 1.3,
                recommendation: 'Good',
                timeSlots: ['11:00-14:00', '18:00-21:00'],
            },
            {
                area: 'Kemang - Blok M',
                demand: 'Low',
                surge: 1.0,
                recommendation: 'Avoid',
                timeSlots: ['10:00-16:00'],
            },
        ]
    }

    getMockFuelPrices() {
        return {
            pertalite: 10000,
            pertamax: 12400,
            pertamaxTurbo: 13400,
            solar: 6800,
            lastUpdated: new Date().toISOString(),
        }
    }
}
