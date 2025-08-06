import { eventBus } from './EventBus.js'
import { stateManager } from './StateManager.js'

/**
 * Base Component class with lifecycle methods and state management
 * All components should extend this class for consistency
 */
export class BaseComponent {
    constructor(props = {}) {
        this.props = props
        this.element = null
        this.mounted = false
        this.subscriptions = []
        this.eventListeners = []

        // Bind methods
        this.render = this.render.bind(this)
        this.mount = this.mount.bind(this)
        this.unmount = this.unmount.bind(this)
        this.update = this.update.bind(this)
    }

    /**
     * Component lifecycle - called before render
     */
    beforeMount() {
        // Override in child classes
    }

    /**
     * Component lifecycle - called after render
     */
    afterMount() {
        // Override in child classes
    }

    /**
     * Component lifecycle - called before unmount
     */
    beforeUnmount() {
        // Override in child classes
    }

    /**
     * Render component - must be implemented by child classes
     * @returns {HTMLElement} Component element
     */
    render() {
        throw new Error('render() method must be implemented')
    }

    /**
     * Mount component to DOM
     * @param {HTMLElement} parent - Parent element
     */
    mount(parent = null) {
        if (this.mounted) return

        this.beforeMount()

        this.element = this.render()

        if (parent) {
            parent.appendChild(this.element)
        }

        this.mounted = true
        this.afterMount()

        return this.element
    }

    /**
     * Unmount component from DOM
     */
    unmount() {
        if (!this.mounted) return

        this.beforeUnmount()

        // Clean up subscriptions
        this.subscriptions.forEach(unsubscribe => unsubscribe())
        this.subscriptions = []

        // Clean up event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler)
        })
        this.eventListeners = []

        // Remove from DOM
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element)
        }

        this.mounted = false
        this.element = null
    }

    /**
     * Update component
     * @param {Object} newProps - New props
     */
    update(newProps = {}) {
        this.props = { ...this.props, ...newProps }

        if (this.mounted && this.element) {
            const newElement = this.render()
            this.element.parentNode?.replaceChild(newElement, this.element)
            this.element = newElement
        }
    }

    /**
     * Subscribe to state changes
     * @param {string} path - State path
     * @param {Function} callback - Callback function
     */
    subscribeToState(path, callback) {
        const unsubscribe = stateManager.subscribe(path, callback)
        this.subscriptions.push(unsubscribe)
        return unsubscribe
    }

    /**
     * Subscribe to events
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    subscribeToEvent(event, callback) {
        const unsubscribe = eventBus.on(event, callback)
        this.subscriptions.push(unsubscribe)
        return unsubscribe
    }

    /**
     * Add event listener with cleanup tracking
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    addEventListener(element, event, handler) {
        element.addEventListener(event, handler)
        this.eventListeners.push({ element, event, handler })
    }

    /**
     * Emit event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        eventBus.emit(event, data)
    }

    /**
     * Get state
     * @param {string} path - State path
     * @returns {*} State value
     */
    getState(path) {
        return stateManager.getState(path)
    }

    /**
     * Set state
     * @param {string} path - State path
     * @param {*} value - New value
     */
    setState(path, value) {
        stateManager.setState(path, value)
    }

    /**
     * Create element with attributes and children
     * @param {string} tag - HTML tag
     * @param {Object} attributes - Element attributes
     * @param {...(string|HTMLElement)} children - Child elements
     * @returns {HTMLElement} Created element
     */
    createElement(tag, attributes = {}, ...children) {
        const element = document.createElement(tag)

        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value
            } else if (key === 'innerHTML') {
                element.innerHTML = value
            } else if (key.startsWith('on') && typeof value === 'function') {
                const event = key.slice(2).toLowerCase()
                this.addEventListener(element, event, value)
            } else {
                element.setAttribute(key, value)
            }
        })

        // Add children
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child))
            } else if (child instanceof HTMLElement) {
                element.appendChild(child)
            } else if (child instanceof BaseComponent) {
                element.appendChild(child.render())
            }
        })

        return element
    }

    /**
     * Format currency for Indonesian locale
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID').format(Math.round(amount || 0))
    }

    /**
     * Format date for Indonesian locale
     * @param {Date} date - Date to format
     * @returns {string} Formatted date
     */
    formatDate(date = new Date()) {
        return date.toLocaleDateString('id-ID')
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout
        return (...args) => {
            clearTimeout(timeout)
            timeout = setTimeout(() => func.apply(this, args), wait)
        }
    }

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle
        return (...args) => {
            if (!inThrottle) {
                func.apply(this, args)
                inThrottle = true
                setTimeout(() => (inThrottle = false), limit)
            }
        }
    }
}
