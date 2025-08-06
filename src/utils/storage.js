/**
 * Clean Storage Manager - No external dependencies
 */
export class StorageManager {
    constructor() {
        this.storageKey = 'reli-data'
        this.settingsKey = 'reli-settings'
        this.backupKey = 'reli-backup'
        this.version = '2.0'

        // Initialize storage
        this.initializeStorage()
    }

    /**
     * Initialize storage with migration if needed
     */
    initializeStorage() {
        try {
            const data = this.getAllData()
            if (!data._meta) {
                // Migrate from old version
                this.migrateFromV1()
            }
        } catch (error) {
            console.error('Storage initialization error:', error)
            this.resetStorage()
        }
    }

    /**
     * Migrate data from version 1.0 to 2.0
     */
    migrateFromV1() {
        const oldData = this.getAllData()
        const newData = {
            _meta: {
                version: this.version,
                created: new Date().toISOString(),
                lastModified: new Date().toISOString(),
            },
            daily: oldData,
        }

        localStorage.setItem(this.storageKey, JSON.stringify(newData))
        console.log('Storage migrated from v1.0 to v2.0')
    }

    /**
     * Save daily data with enhanced metadata
     * @param {Object} data - Daily data to save
     */
    saveDaily(data) {
        const today = new Date().toISOString().split('T')[0]
        const allData = this.getAllData()

        if (!allData.daily) {
            allData.daily = {}
        }

        allData.daily[today] = {
            ...data,
            timestamp: new Date().toISOString(),
            version: this.version,
            id: this.generateId(),
        }

        // Update metadata
        allData._meta = {
            ...allData._meta,
            lastModified: new Date().toISOString(),
            totalDays: Object.keys(allData.daily).length,
        }

        this.saveToStorage(allData)
        console.log(`Daily data saved for ${today}`)
    }

    /**
     * Get all data with structure validation
     * @returns {Object} All stored data
     */
    getAllData() {
        try {
            const data = localStorage.getItem(this.storageKey)
            const parsed = data ? JSON.parse(data) : {}

            // Ensure proper structure
            if (!parsed._meta) {
                parsed._meta = {
                    version: this.version,
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                }
            }

            if (!parsed.daily) {
                parsed.daily = {}
            }

            return parsed
        } catch (error) {
            console.error('Error loading data:', error)
            return this.getDefaultStructure()
        }
    }

    /**
     * Get default data structure
     * @returns {Object} Default structure
     */
    getDefaultStructure() {
        return {
            _meta: {
                version: this.version,
                created: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                totalDays: 0,
            },
            daily: {},
        }
    }

    /**
     * Get last N days of data with analytics
     * @param {number} days - Number of days to retrieve
     * @returns {Array} Array of daily data with analytics
     */
    getLastNDays(days = 7) {
        const allData = this.getAllData()
        const dates = Object.keys(allData.daily)
            .sort((a, b) => new Date(b) - new Date(a))
            .slice(0, days)

        const result = dates.map(date => ({
            date,
            ...allData.daily[date],
        }))

        // Add analytics
        const analytics = this.calculateAnalytics(result)

        return {
            data: result,
            analytics,
            period: {
                from: dates[dates.length - 1],
                to: dates[0],
                days: dates.length,
            },
        }
    }

    /**
     * Calculate analytics for given data
     * @param {Array} data - Array of daily data
     * @returns {Object} Analytics object
     */
    calculateAnalytics(data) {
        if (!data.length) return {}

        const totals = data.reduce(
            (acc, day) => {
                const results = day.results || {}
                return {
                    earnings: acc.earnings + (results.pendapatanBersih || 0),
                    revenue: acc.revenue + (results.totalKotor || 0),
                    fuelCost: acc.fuelCost + (results.biayaBBM || 0),
                    distance: acc.distance + (day.fuel?.jarak || 0),
                }
            },
            { earnings: 0, revenue: 0, fuelCost: 0, distance: 0 }
        )

        const averages = {
            dailyEarnings: totals.earnings / data.length,
            dailyRevenue: totals.revenue / data.length,
            dailyFuelCost: totals.fuelCost / data.length,
            dailyDistance: totals.distance / data.length,
            fuelEfficiency: totals.distance / (totals.fuelCost / 10000), // Assuming 10k per liter
        }

        // Find best and worst days
        const sortedByEarnings = [...data].sort(
            (a, b) => (b.results?.pendapatanBersih || 0) - (a.results?.pendapatanBersih || 0)
        )

        return {
            totals,
            averages,
            bestDay: sortedByEarnings[0],
            worstDay: sortedByEarnings[sortedByEarnings.length - 1],
            trend: this.calculateTrend(data),
        }
    }

    /**
     * Calculate trend for earnings
     * @param {Array} data - Array of daily data
     * @returns {Object} Trend information
     */
    calculateTrend(data) {
        if (data.length < 2) return { direction: 'stable', percentage: 0 }

        const recent = data.slice(0, Math.ceil(data.length / 2))
        const older = data.slice(Math.ceil(data.length / 2))

        const recentAvg = recent.reduce((sum, day) => sum + (day.results?.pendapatanBersih || 0), 0) / recent.length
        const olderAvg = older.reduce((sum, day) => sum + (day.results?.pendapatanBersih || 0), 0) / older.length

        const percentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0
        const direction = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable'

        return { direction, percentage: Math.abs(percentage) }
    }

    /**
     * Get today's data
     * @returns {Object|null} Today's data or null
     */
    getTodayData() {
        const today = new Date().toISOString().split('T')[0]
        const allData = this.getAllData()
        return allData.daily[today] || null
    }

    /**
     * Export data to various formats
     * @param {string} format - Export format (csv, json, txt)
     * @returns {string} Exported data
     */
    exportData(format = 'csv') {
        const allData = this.getAllData()

        switch (format.toLowerCase()) {
            case 'csv':
                return this.exportToCSV(allData)
            case 'json':
                return this.exportToJSON(allData)
            case 'txt':
                return this.exportToText(allData)
            default:
                throw new Error(`Unsupported export format: ${format}`)
        }
    }

    /**
     * Export to CSV format
     * @param {Object} allData - All data to export
     * @returns {string} CSV string
     */
    exportToCSV(allData = null) {
        if (!allData) allData = this.getAllData()

        const headers = [
            'Tanggal',
            'Grab Topup',
            'Grab Sisa',
            'Grab Kotor',
            'Maxim Topup',
            'Maxim Sisa',
            'Maxim Kotor',
            'Gojek Topup',
            'Gojek Sisa',
            'Gojek Kotor',
            'Indrive Topup',
            'Indrive Sisa',
            'Indrive Kotor',
            'Jarak (km)',
            'Konsumsi (km/l)',
            'Harga BBM',
            'Parkir',
            'Makan',
            'Kuota',
            'Tol',
            'Lainnya',
            'Total Kotor',
            'Biaya BBM',
            'Biaya Tambahan',
            'Pendapatan Bersih',
        ]

        let csv = headers.join(',') + '\n'

        Object.entries(allData.daily || {}).forEach(([date, data]) => {
            const platforms = data.platforms || {}
            const fuel = data.fuel || {}
            const costs = data.additionalCosts || {}
            const results = data.results || {}

            const row = [
                date,
                platforms.grab?.topup || 0,
                platforms.grab?.sisa || 0,
                platforms.grab?.kotor || 0,
                platforms.maxim?.topup || 0,
                platforms.maxim?.sisa || 0,
                platforms.maxim?.kotor || 0,
                platforms.gojek?.topup || 0,
                platforms.gojek?.sisa || 0,
                platforms.gojek?.kotor || 0,
                platforms.indrive?.topup || 0,
                platforms.indrive?.sisa || 0,
                platforms.indrive?.kotor || 0,
                fuel.jarak || 0,
                fuel.konsumsi || 0,
                fuel.harga || 0,
                costs.parkir || 0,
                costs.makan || 0,
                costs.kuota || 0,
                costs.tol || 0,
                costs.lainnya || 0,
                results.totalKotor || 0,
                results.biayaBBM || 0,
                results.totalAdditionalCosts || 0,
                results.pendapatanBersih || 0,
            ]
            csv += row.join(',') + '\n'
        })

        return csv
    }

    /**
     * Export to JSON format
     * @param {Object} allData - All data to export
     * @returns {string} JSON string
     */
    exportToJSON(allData = null) {
        if (!allData) allData = this.getAllData()
        return JSON.stringify(allData, null, 2)
    }

    /**
     * Export to text format
     * @param {Object} allData - All data to export
     * @returns {string} Text string
     */
    exportToText(allData = null) {
        if (!allData) allData = this.getAllData()

        let text = 'RELI - Data Export\n'
        text += '=================\n\n'
        text += `Export Date: ${new Date().toLocaleString('id-ID')}\n`
        text += `Data Version: ${allData._meta?.version || 'Unknown'}\n`
        text += `Total Days: ${Object.keys(allData.daily || {}).length}\n\n`

        Object.entries(allData.daily || {}).forEach(([date, data]) => {
            text += `Date: ${date}\n`
            text += `Pendapatan Bersih: Rp ${this.formatCurrency(data.results?.pendapatanBersih || 0)}\n`
            text += `Total Kotor: Rp ${this.formatCurrency(data.results?.totalKotor || 0)}\n`
            text += `Biaya BBM: Rp ${this.formatCurrency(data.results?.biayaBBM || 0)}\n`
            text += `Jarak: ${data.fuel?.jarak || 0} km\n`
            text += '---\n'
        })

        return text
    }

    /**
     * Download exported data
     * @param {string} format - Export format
     * @param {string} filename - Custom filename (optional)
     */
    downloadExport(format = 'csv', filename = null) {
        const data = this.exportData(format)
        const timestamp = new Date().toISOString().split('T')[0]
        const defaultFilename = `reli-data-${timestamp}.${format}`

        const blob = new Blob([data], {
            type: this.getMimeType(format),
        })

        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename || defaultFilename
        a.click()
        window.URL.revokeObjectURL(url)

        console.log(`Data exported as ${format}: ${a.download}`)
    }

    /**
     * Get MIME type for format
     * @param {string} format - File format
     * @returns {string} MIME type
     */
    getMimeType(format) {
        const types = {
            csv: 'text/csv',
            json: 'application/json',
            txt: 'text/plain',
        }
        return types[format] || 'text/plain'
    }

    /**
     * Create backup of all data
     * @returns {string} Backup ID
     */
    createBackup() {
        const backupId = this.generateId()
        const backup = {
            id: backupId,
            timestamp: new Date().toISOString(),
            data: this.getAllData(),
        }

        const existingBackups = this.getBackups()
        existingBackups[backupId] = backup

        // Keep only last 5 backups
        const backupIds = Object.keys(existingBackups)
            .sort((a, b) => new Date(existingBackups[b].timestamp) - new Date(existingBackups[a].timestamp))
            .slice(0, 5)

        const trimmedBackups = {}
        backupIds.forEach(id => {
            trimmedBackups[id] = existingBackups[id]
        })

        localStorage.setItem(this.backupKey, JSON.stringify(trimmedBackups))
        console.log(`Backup created with ID: ${backupId}`)

        return backupId
    }

    /**
     * Get all backups
     * @returns {Object} Backups object
     */
    getBackups() {
        try {
            const backups = localStorage.getItem(this.backupKey)
            return backups ? JSON.parse(backups) : {}
        } catch (error) {
            console.error('Error loading backups:', error)
            return {}
        }
    }

    /**
     * Restore from backup
     * @param {string} backupId - Backup ID to restore
     */
    restoreFromBackup(backupId) {
        const backups = this.getBackups()
        const backup = backups[backupId]

        if (!backup) {
            throw new Error(`Backup not found: ${backupId}`)
        }

        this.saveToStorage(backup.data)
        console.log(`Storage restored from backup: ${backupId}`)
    }

    /**
     * Save data to localStorage with error handling
     * @param {Object} data - Data to save
     */
    saveToStorage(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data))
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                // Storage quota exceeded, try to clean up
                this.cleanupOldData()
                localStorage.setItem(this.storageKey, JSON.stringify(data))
            } else {
                throw error
            }
        }
    }

    /**
     * Clean up old data to free storage space
     */
    cleanupOldData() {
        const allData = this.getAllData()
        const dates = Object.keys(allData.daily || {}).sort((a, b) => new Date(b) - new Date(a))

        // Keep only last 30 days
        const keepDates = dates.slice(0, 30)
        const newDaily = {}

        keepDates.forEach(date => {
            newDaily[date] = allData.daily[date]
        })

        allData.daily = newDaily
        allData._meta.lastCleanup = new Date().toISOString()

        this.saveToStorage(allData)
        console.log(`Storage cleaned, removed ${dates.length - keepDates.length} old days`)
    }

    /**
     * Reset all storage data
     */
    resetStorage() {
        localStorage.removeItem(this.storageKey)
        localStorage.removeItem(this.backupKey)
        console.log('Storage reset completed')
    }

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2)
    }

    /**
     * Format currency
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID').format(Math.round(amount || 0))
    }

    /**
     * Get storage usage statistics
     * @returns {Object} Storage statistics
     */
    getStorageStats() {
        const data = JSON.stringify(this.getAllData())
        const backups = JSON.stringify(this.getBackups())

        return {
            dataSize: new Blob([data]).size,
            backupSize: new Blob([backups]).size,
            totalSize: new Blob([data + backups]).size,
            dailyRecords: Object.keys(this.getAllData().daily || {}).length,
            backupCount: Object.keys(this.getBackups()).length,
        }
    }
}
