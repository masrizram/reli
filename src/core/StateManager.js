import { eventBus } from './EventBus.js'

/**
 * Global State Manager with reactive updates
 * Implements centralized state management pattern
 */
export class StateManager {
    constructor() {
        this.state = {
            // Platform data
            platforms: {
                grab: { topup: 0, sisa: 0, kotor: 0 },
                maxim: { topup: 0, sisa: 0, kotor: 0 },
                gojek: { topup: 0, sisa: 0, kotor: 0 },
                indrive: { topup: 0, sisa: 0, kotor: 0 },
            },

            // Fuel data
            fuel: {
                jarak: 0,
                konsumsi: 14,
                harga: 10000,
                literTerpakai: 0,
                biayaBBM: 0,
            },

            // Additional costs
            additionalCosts: {
                parkir: 0,
                makan: 0,
                kuota: 0,
                tol: 0,
                lainnya: 0,
                total: 0,
            },

            // Calculated results
            results: {
                totalKotor: 0,
                biayaBBM: 0,
                totalAdditionalCosts: 0,
                pendapatanBersih: 0,
            },

            // UI state
            ui: {
                currentView: 'dashboard',
                sidebarCollapsed: false,
                loading: false,
                notifications: [],
            },

            // Settings
            settings: {
                autoCalculate: true,
                autoSave: true,
                notifications: true,
                gpsTracking: false,
            },
        }

        this.subscribers = new Map()
    }

    /**
     * Get current state
     * @param {string} path - State path (optional)
     * @returns {*} State value
     */
    getState(path = null) {
        if (!path) return this.state

        return path.split('.').reduce((obj, key) => obj?.[key], this.state)
    }

    /**
     * Update state and notify subscribers
     * @param {string} path - State path
     * @param {*} value - New value
     */
    setState(path, value) {
        const keys = path.split('.')
        const lastKey = keys.pop()
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {}
            return obj[key]
        }, this.state)

        const oldValue = target[lastKey]
        target[lastKey] = value

        // Emit state change event
        eventBus.emit('state:change', {
            path,
            value,
            oldValue,
            state: this.state,
        })

        // Notify specific path subscribers
        this.notifySubscribers(path, value, oldValue)
    }

    /**
     * Subscribe to state changes
     * @param {string} path - State path to watch
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set())
        }

        this.subscribers.get(path).add(callback)

        return () => {
            const callbacks = this.subscribers.get(path)
            if (callbacks) {
                callbacks.delete(callback)
                if (callbacks.size === 0) {
                    this.subscribers.delete(path)
                }
            }
        }
    }

    /**
     * Notify subscribers of state changes
     * @param {string} path - State path
     * @param {*} value - New value
     * @param {*} oldValue - Old value
     */
    notifySubscribers(path, value, oldValue) {
        const callbacks = this.subscribers.get(path)
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(value, oldValue, path)
                } catch (error) {
                    console.error(`Error in state subscriber for ${path}:`, error)
                }
            })
        }
    }

    /**
     * Update platform data
     * @param {string} platform - Platform name
     * @param {Object} data - Platform data
     */
    updatePlatform(platform, data) {
        this.setState(`platforms.${platform}`, data)
        this.calculateResults()
    }

    /**
     * Update fuel data
     * @param {Object} data - Fuel data
     */
    updateFuel(data) {
        this.setState('fuel', { ...this.state.fuel, ...data })
        this.calculateResults()
    }

    /**
     * Update additional costs
     * @param {Object} data - Additional costs data
     */
    updateAdditionalCosts(data) {
        this.setState('additionalCosts', { ...this.state.additionalCosts, ...data })
        this.calculateResults()
    }

    /**
     * Calculate and update results
     */
    calculateResults() {
        const platforms = this.state.platforms
        const fuel = this.state.fuel
        const additionalCosts = this.state.additionalCosts

        const totalKotor = Object.values(platforms).reduce((sum, platform) => sum + platform.kotor, 0)
        const biayaBBM = Math.round(fuel.biayaBBM)
        const totalAdditionalCosts = additionalCosts.total
        const pendapatanBersih = totalKotor - biayaBBM - totalAdditionalCosts

        this.setState('results', {
            totalKotor,
            biayaBBM,
            totalAdditionalCosts,
            pendapatanBersih,
        })
    }

    /**
     * Reset state to initial values
     */
    reset() {
        this.setState('platforms', {
            grab: { topup: 0, sisa: 0, kotor: 0 },
            maxim: { topup: 0, sisa: 0, kotor: 0 },
            gojek: { topup: 0, sisa: 0, kotor: 0 },
            indrive: { topup: 0, sisa: 0, kotor: 0 },
        })

        this.setState('fuel', {
            jarak: 0,
            konsumsi: 14,
            harga: 10000,
            literTerpakai: 0,
            biayaBBM: 0,
        })

        this.setState('additionalCosts', {
            parkir: 0,
            makan: 0,
            kuota: 0,
            tol: 0,
            lainnya: 0,
            total: 0,
        })
    }
}

// Global state manager instance
export const stateManager = new StateManager()
