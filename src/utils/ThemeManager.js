import { eventBus } from '../core/EventBus.js'

/**
 * Theme and preferences management service
 */
export class ThemeManager {
    constructor() {
        this.storageKey = 'reli-theme-preferences'
        this.currentTheme = 'light'
        this.preferences = {
            theme: 'light',
            fontSize: 'medium',
            animations: true,
            highContrast: false,
            colorBlindMode: false,
            language: 'id',
            currency: 'IDR',
            dateFormat: 'dd/mm/yyyy',
            numberFormat: 'id-ID',
        }

        this.themes = {
            light: {
                name: 'Light',
                icon: '☀️',
                colors: {
                    primary: '#3b82f6',
                    secondary: '#8b5cf6',
                    accent: '#06b6d4',
                    neutral: '#374151',
                    base: '#ffffff',
                    info: '#0ea5e9',
                    success: '#10b981',
                    warning: '#f59e0b',
                    error: '#ef4444',
                },
            },
            dark: {
                name: 'Dark',
                icon: '🌙',
                colors: {
                    primary: '#60a5fa',
                    secondary: '#a78bfa',
                    accent: '#22d3ee',
                    neutral: '#1f2937',
                    base: '#111827',
                    info: '#38bdf8',
                    success: '#34d399',
                    warning: '#fbbf24',
                    error: '#f87171',
                },
            },
            auto: {
                name: 'Auto',
                icon: '🌓',
                description: 'Follows system preference',
            },
        }

        // Don't auto-init, let main.js handle it
    }

    /**
     * Initialize theme manager
     */
    init() {
        this.loadPreferences()
        this.applyTheme()
        this.setupSystemThemeListener()
        this.setupAccessibilityFeatures()
    }

    /**
     * Load preferences from storage
     */
    loadPreferences() {
        try {
            const stored = localStorage.getItem(this.storageKey)
            if (stored) {
                this.preferences = { ...this.preferences, ...JSON.parse(stored) }
            }
        } catch (error) {
            console.warn('Failed to load theme preferences:', error)
        }
    }

    /**
     * Save preferences to storage
     */
    savePreferences() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.preferences))
            eventBus.emit('theme:preferences-saved', this.preferences)
        } catch (error) {
            console.error('Failed to save theme preferences:', error)
        }
    }

    /**
     * Set theme
     * @param {string} theme - Theme name
     */
    setTheme(theme) {
        if (!this.themes[theme] && theme !== 'auto') {
            console.warn(`Theme '${theme}' not found`)
            return
        }

        this.preferences.theme = theme
        this.applyTheme()
        this.savePreferences()

        eventBus.emit('theme:changed', {
            theme,
            preferences: this.preferences,
        })
    }

    /**
     * Apply current theme
     */
    applyTheme() {
        const theme = this.resolveTheme()
        this.currentTheme = theme

        // Apply to document
        document.documentElement.setAttribute('data-theme', theme)

        // Apply custom CSS variables if theme has colors
        if (this.themes[theme]?.colors) {
            this.applyCustomColors(this.themes[theme].colors)
        }

        // Apply other preferences
        this.applyFontSize()
        this.applyAnimations()
        this.applyAccessibilityFeatures()
    }

    /**
     * Resolve theme based on preferences and system
     */
    resolveTheme() {
        if (this.preferences.theme === 'auto') {
            return this.getSystemTheme()
        }
        return this.preferences.theme
    }

    /**
     * Get system theme preference
     */
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark'
        }
        return 'light'
    }

    /**
     * Apply custom colors
     */
    applyCustomColors(colors) {
        const root = document.documentElement

        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value)
        })
    }

    /**
     * Set font size
     * @param {string} size - Font size (small, medium, large, xl)
     */
    setFontSize(size) {
        this.preferences.fontSize = size
        this.applyFontSize()
        this.savePreferences()

        eventBus.emit('theme:font-size-changed', size)
    }

    /**
     * Apply font size
     */
    applyFontSize() {
        const sizes = {
            small: '14px',
            medium: '16px',
            large: '18px',
            xl: '20px',
        }

        const size = sizes[this.preferences.fontSize] || sizes.medium
        document.documentElement.style.setProperty('--base-font-size', size)
        document.body.style.fontSize = size
    }

    /**
     * Toggle animations
     * @param {boolean} enabled - Enable animations
     */
    setAnimations(enabled) {
        this.preferences.animations = enabled
        this.applyAnimations()
        this.savePreferences()

        eventBus.emit('theme:animations-changed', enabled)
    }

    /**
     * Apply animation preferences
     */
    applyAnimations() {
        if (this.preferences.animations) {
            document.body.classList.remove('no-animations')
        } else {
            document.body.classList.add('no-animations')
        }
    }

    /**
     * Set high contrast mode
     * @param {boolean} enabled - Enable high contrast
     */
    setHighContrast(enabled) {
        this.preferences.highContrast = enabled
        this.applyAccessibilityFeatures()
        this.savePreferences()

        eventBus.emit('theme:high-contrast-changed', enabled)
    }

    /**
     * Set color blind mode
     * @param {boolean} enabled - Enable color blind mode
     */
    setColorBlindMode(enabled) {
        this.preferences.colorBlindMode = enabled
        this.applyAccessibilityFeatures()
        this.savePreferences()

        eventBus.emit('theme:color-blind-changed', enabled)
    }

    /**
     * Apply accessibility features
     */
    applyAccessibilityFeatures() {
        const body = document.body

        // High contrast
        if (this.preferences.highContrast) {
            body.classList.add('high-contrast')
        } else {
            body.classList.remove('high-contrast')
        }

        // Color blind mode
        if (this.preferences.colorBlindMode) {
            body.classList.add('color-blind-mode')
        } else {
            body.classList.remove('color-blind-mode')
        }
    }

    /**
     * Set language
     * @param {string} language - Language code
     */
    setLanguage(language) {
        this.preferences.language = language
        document.documentElement.lang = language
        this.savePreferences()

        eventBus.emit('theme:language-changed', language)
    }

    /**
     * Set currency
     * @param {string} currency - Currency code
     */
    setCurrency(currency) {
        this.preferences.currency = currency
        this.savePreferences()

        eventBus.emit('theme:currency-changed', currency)
    }

    /**
     * Setup system theme change listener
     */
    setupSystemThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

            mediaQuery.addEventListener('change', e => {
                if (this.preferences.theme === 'auto') {
                    this.applyTheme()
                    eventBus.emit('theme:system-changed', e.matches ? 'dark' : 'light')
                }
            })
        }
    }

    /**
     * Setup accessibility features detection
     */
    setupAccessibilityFeatures() {
        // Detect reduced motion preference
        if (window.matchMedia) {
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

            if (reducedMotion.matches) {
                this.setAnimations(false)
            }

            reducedMotion.addEventListener('change', e => {
                if (e.matches) {
                    this.setAnimations(false)
                }
            })
        }

        // Detect high contrast preference
        if (window.matchMedia) {
            const highContrast = window.matchMedia('(prefers-contrast: high)')

            if (highContrast.matches) {
                this.setHighContrast(true)
            }

            highContrast.addEventListener('change', e => {
                this.setHighContrast(e.matches)
            })
        }
    }

    /**
     * Get available themes
     * @returns {Object} Available themes
     */
    getAvailableThemes() {
        return this.themes
    }

    /**
     * Get current theme
     * @returns {string} Current theme name
     */
    getCurrentTheme() {
        return this.currentTheme
    }

    /**
     * Get current preferences
     * @returns {Object} Current preferences
     */
    getPreferences() {
        return { ...this.preferences }
    }

    /**
     * Reset to default preferences
     */
    resetToDefaults() {
        this.preferences = {
            theme: 'light',
            fontSize: 'medium',
            animations: true,
            highContrast: false,
            colorBlindMode: false,
            language: 'id',
            currency: 'IDR',
            dateFormat: 'dd/mm/yyyy',
            numberFormat: 'id-ID',
        }

        this.applyTheme()
        this.savePreferences()

        eventBus.emit('theme:reset', this.preferences)
    }

    /**
     * Export preferences
     * @returns {string} JSON string of preferences
     */
    exportPreferences() {
        return JSON.stringify(this.preferences, null, 2)
    }

    /**
     * Import preferences
     * @param {string} preferencesJson - JSON string of preferences
     */
    importPreferences(preferencesJson) {
        try {
            const imported = JSON.parse(preferencesJson)
            this.preferences = { ...this.preferences, ...imported }
            this.applyTheme()
            this.savePreferences()

            eventBus.emit('theme:imported', this.preferences)
        } catch (error) {
            console.error('Failed to import preferences:', error)
            throw new Error('Invalid preferences format')
        }
    }

    /**
     * Get theme-aware color
     * @param {string} colorName - Color name
     * @returns {string} Color value
     */
    getColor(colorName) {
        const theme = this.themes[this.currentTheme]
        return theme?.colors?.[colorName] || colorName
    }

    /**
     * Format currency according to preferences
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat(this.preferences.numberFormat, {
            style: 'currency',
            currency: this.preferences.currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    /**
     * Format date according to preferences
     * @param {Date} date - Date to format
     * @returns {string} Formatted date
     */
    formatDate(date) {
        return new Intl.DateTimeFormat(this.preferences.language).format(date)
    }

    /**
     * Format number according to preferences
     * @param {number} number - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(number) {
        return new Intl.NumberFormat(this.preferences.numberFormat).format(number)
    }

    /**
     * Get localized text
     * @param {string} key - Text key
     * @param {Object} params - Parameters for interpolation
     * @returns {string} Localized text
     */
    getText(key, params = {}) {
        // This would integrate with a localization system
        // For now, return the key
        return key
    }

    /**
     * Check if dark mode is active
     * @returns {boolean} Is dark mode active
     */
    isDarkMode() {
        return this.currentTheme === 'dark'
    }

    /**
     * Check if animations are enabled
     * @returns {boolean} Are animations enabled
     */
    areAnimationsEnabled() {
        return this.preferences.animations
    }

    /**
     * Check if high contrast is enabled
     * @returns {boolean} Is high contrast enabled
     */
    isHighContrastEnabled() {
        return this.preferences.highContrast
    }

    /**
     * Get CSS custom properties for current theme
     * @returns {Object} CSS custom properties
     */
    getCSSProperties() {
        const theme = this.themes[this.currentTheme]
        const properties = {}

        if (theme?.colors) {
            Object.entries(theme.colors).forEach(([key, value]) => {
                properties[`--color-${key}`] = value
            })
        }

        properties['--base-font-size'] = this.getFontSizeValue()

        return properties
    }

    /**
     * Get font size value
     * @returns {string} Font size value
     */
    getFontSizeValue() {
        const sizes = {
            small: '14px',
            medium: '16px',
            large: '18px',
            xl: '20px',
        }
        return sizes[this.preferences.fontSize] || sizes.medium
    }
}

// Global theme manager instance
export const themeManager = new ThemeManager()
