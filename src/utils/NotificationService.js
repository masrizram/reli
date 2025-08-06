import { eventBus } from '../core/EventBus.js'

/**
 * Notification service for browser notifications and in-app alerts
 */
export class NotificationService {
    constructor() {
        this.permission = 'default'
        this.notifications = []
        this.maxNotifications = 50

        // Check initial permission
        if ('Notification' in window) {
            this.permission = Notification.permission
        }
    }

    /**
     * Check if notifications are supported
     * @returns {boolean} Support status
     */
    isSupported() {
        return 'Notification' in window
    }

    /**
     * Request notification permission
     * @returns {Promise<string>} Permission status
     */
    async requestPermission() {
        if (!this.isSupported()) {
            throw new Error('Notifications tidak didukung oleh browser ini')
        }

        if (this.permission === 'granted') {
            return 'granted'
        }

        try {
            this.permission = await Notification.requestPermission()
            eventBus.emit('notification:permission-changed', this.permission)
            return this.permission
        } catch (error) {
            console.error('Error requesting notification permission:', error)
            throw error
        }
    }

    /**
     * Show browser notification
     * @param {string} title - Notification title
     * @param {Object} options - Notification options
     * @returns {Promise<Notification>} Notification instance
     */
    async showNotification(title, options = {}) {
        if (!this.isSupported()) {
            throw new Error('Notifications tidak didukung')
        }

        if (this.permission !== 'granted') {
            await this.requestPermission()
        }

        if (this.permission !== 'granted') {
            throw new Error('Permission untuk notifications ditolak')
        }

        const defaultOptions = {
            icon: '/manifest.json',
            badge: '/manifest.json',
            tag: 'reli-notification',
            requireInteraction: false,
            silent: false,
            ...options,
        }

        const notification = new Notification(title, defaultOptions)

        // Auto close after 5 seconds if not requiring interaction
        if (!defaultOptions.requireInteraction) {
            setTimeout(() => {
                notification.close()
            }, 5000)
        }

        // Track notification
        this.addToHistory({
            id: Date.now(),
            title,
            options: defaultOptions,
            timestamp: new Date(),
            type: 'browser',
        })

        eventBus.emit('notification:shown', { title, options: defaultOptions })

        return notification
    }

    /**
     * Show in-app notification
     * @param {string} message - Notification message
     * @param {Object} options - Notification options
     */
    showInApp(message, options = {}) {
        const notification = {
            id: Date.now(),
            message,
            type: options.type || 'info', // info, success, warning, error
            duration: options.duration || 5000,
            persistent: options.persistent || false,
            timestamp: new Date(),
            ...options,
        }

        this.addToHistory(notification)
        eventBus.emit('notification:in-app', notification)

        // Auto remove if not persistent
        if (!notification.persistent && notification.duration > 0) {
            setTimeout(() => {
                this.removeInApp(notification.id)
            }, notification.duration)
        }

        return notification
    }

    /**
     * Remove in-app notification
     * @param {number} id - Notification ID
     */
    removeInApp(id) {
        eventBus.emit('notification:remove', id)
    }

    /**
     * Show success notification
     * @param {string} message - Success message
     * @param {Object} options - Additional options
     */
    showSuccess(message, options = {}) {
        return this.showInApp(message, {
            ...options,
            type: 'success',
            icon: '✅',
        })
    }

    /**
     * Show error notification
     * @param {string} message - Error message
     * @param {Object} options - Additional options
     */
    showError(message, options = {}) {
        return this.showInApp(message, {
            ...options,
            type: 'error',
            icon: '❌',
            duration: 8000,
        })
    }

    /**
     * Show warning notification
     * @param {string} message - Warning message
     * @param {Object} options - Additional options
     */
    showWarning(message, options = {}) {
        return this.showInApp(message, {
            ...options,
            type: 'warning',
            icon: '⚠️',
            duration: 6000,
        })
    }

    /**
     * Show info notification
     * @param {string} message - Info message
     * @param {Object} options - Additional options
     */
    showInfo(message, options = {}) {
        return this.showInApp(message, {
            ...options,
            type: 'info',
            icon: 'ℹ️',
        })
    }

    /**
     * Add notification to history
     * @param {Object} notification - Notification data
     */
    addToHistory(notification) {
        this.notifications.unshift(notification)

        // Limit history size
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications)
        }
    }

    /**
     * Get notification history
     * @param {number} limit - Number of notifications to return
     * @returns {Array} Notification history
     */
    getHistory(limit = 10) {
        return this.notifications.slice(0, limit)
    }

    /**
     * Clear notification history
     */
    clearHistory() {
        this.notifications = []
        eventBus.emit('notification:history-cleared')
    }

    /**
     * Get permission status
     * @returns {string} Permission status
     */
    getPermission() {
        return this.permission
    }

    /**
     * Check if notifications are enabled
     * @returns {boolean} Enabled status
     */
    isEnabled() {
        return this.permission === 'granted'
    }

    /**
     * Schedule notification
     * @param {string} title - Notification title
     * @param {Object} options - Notification options
     * @param {number} delay - Delay in milliseconds
     * @returns {number} Timer ID
     */
    scheduleNotification(title, options = {}, delay = 0) {
        return setTimeout(() => {
            this.showNotification(title, options)
        }, delay)
    }

    /**
     * Cancel scheduled notification
     * @param {number} timerId - Timer ID
     */
    cancelScheduled(timerId) {
        clearTimeout(timerId)
    }

    /**
     * Show earnings alert
     * @param {number} earnings - Current earnings
     * @param {number} threshold - Threshold amount
     */
    showEarningsAlert(earnings, threshold) {
        if (earnings < threshold) {
            this.showWarning(
                `Pendapatan hari ini (Rp ${this.formatCurrency(earnings)}) masih di bawah target (Rp ${this.formatCurrency(threshold)})`,
                {
                    persistent: true,
                    action: 'Lihat Optimizer',
                    actionCallback: () => eventBus.emit('navigate', 'optimizer'),
                }
            )
        } else {
            this.showSuccess(`Target pendapatan tercapai! Rp ${this.formatCurrency(earnings)}`, {
                duration: 8000,
            })
        }
    }

    /**
     * Show fuel efficiency alert
     * @param {number} efficiency - Current efficiency (km/l)
     * @param {number} expected - Expected efficiency
     */
    showFuelEfficiencyAlert(efficiency, expected) {
        if (efficiency < expected * 0.8) {
            this.showWarning(`Efisiensi BBM rendah: ${efficiency.toFixed(1)} km/l (target: ${expected} km/l)`, {
                action: 'Tips Hemat BBM',
                actionCallback: () => eventBus.emit('show-fuel-tips'),
            })
        }
    }

    /**
     * Format currency for notifications
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID').format(Math.round(amount || 0))
    }
}

// Global notification service instance
export const notificationService = new NotificationService()
