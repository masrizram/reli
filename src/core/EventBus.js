/**
 * Central Event Bus for application-wide communication
 * Implements Observer pattern for loose coupling between components
 */
export class EventBus {
    constructor() {
        this.events = new Map()
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set())
        }

        this.events.get(event).add(callback)

        // Return unsubscribe function
        return () => {
            const callbacks = this.events.get(event)
            if (callbacks) {
                callbacks.delete(callback)
                if (callbacks.size === 0) {
                    this.events.delete(event)
                }
            }
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data = null) {
        const callbacks = this.events.get(event)
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error(`Error in event callback for ${event}:`, error)
                }
            })
        }
    }

    /**
     * Subscribe to event once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event, callback) {
        const unsubscribe = this.on(event, data => {
            callback(data)
            unsubscribe()
        })
        return unsubscribe
    }

    /**
     * Remove all listeners for an event
     * @param {string} event - Event name
     */
    off(event) {
        this.events.delete(event)
    }

    /**
     * Clear all events
     */
    clear() {
        this.events.clear()
    }
}

// Global event bus instance
export const eventBus = new EventBus()
