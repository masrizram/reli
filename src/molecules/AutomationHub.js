import { Label } from '../atoms/Label.js'
import { Button } from '../atoms/Button.js'

export class AutomationHub {
    constructor(onAutomationUpdate) {
        this.onAutomationUpdate = onAutomationUpdate
        this.automations = this.loadAutomations()
        this.isRunning = false
        this.intervals = {}
        this.initAutomations()
    }

    loadAutomations() {
        try {
            const saved = localStorage.getItem('reli-automations')
            return saved ? JSON.parse(saved) : {
                autoCalculate: { enabled: true, interval: 5000 },
                autoSave: { enabled: true, interval: 30000 },
                autoBackup: { enabled: true, interval: 3600000 }, // 1 hour
                autoOptimize: { enabled: false, interval: 1800000 }, // 30 minutes
                autoNotify: { enabled: true, interval: 60000 }, // 1 minute
                autoSync: { enabled: false, interval: 300000 }, // 5 minutes
                smartAlerts: { enabled: true, threshold: 0.8 },
                autoExport: { enabled: false, time: '23:59' }
            }
        } catch (error) {
            console.error('Error loading automations:', error)
            return {}
        }
    }

    saveAutomations() {
        try {
            localStorage.setItem('reli-automations', JSON.stringify(this.automations))
            if (this.onAutomationUpdate) {
                this.onAutomationUpdate(this.automations)
            }
        } catch (error) {
            console.error('Error saving automations:', error)
        }
    }

    initAutomations() {
        // Start enabled automations
        Object.entries(this.automations).forEach(([key, config]) => {
            if (config.enabled && config.interval) {
                this.startAutomation(key)
            }
        })
        this.isRunning = true
    }

    startAutomation(type) {
        if (this.intervals[type]) {
            clearInterval(this.intervals[type])
        }

        const config = this.automations[type]
        if (!config || !config.enabled) return

        switch (type) {
            case 'autoCalculate':
                this.intervals[type] = setInterval(() => {
                    this.triggerAutoCalculate()
                }, config.interval)
                break

            case 'autoSave':
                this.intervals[type] = setInterval(() => {
                    this.triggerAutoSave()
                }, config.interval)
                break

            case 'autoBackup':
                this.intervals[type] = setInterval(() => {
                    this.triggerAutoBackup()
                }, config.interval)
                break

            case 'autoOptimize':
                this.intervals[type] = setInterval(() => {
                    this.triggerAutoOptimize()
                }, config.interval)
                break

            case 'autoNotify':
                this.intervals[type] = setInterval(() => {
                    this.triggerAutoNotify()
                }, config.interval)
                break

            case 'autoSync':
                this.intervals[type] = setInterval(() => {
                    this.triggerAutoSync()
                }, config.interval)
                break
        }

        console.log(`Automation ${type} started with interval ${config.interval}ms`)
    }

    stopAutomation(type) {
        if (this.intervals[type]) {
            clearInterval(this.intervals[type])
            delete this.intervals[type]
            console.log(`Automation ${type} stopped`)
        }
    }

    triggerAutoCalculate() {
        // Auto-trigger calculation if data has changed
        const event = new CustomEvent('reli-auto-calculate')
        document.dispatchEvent(event)
        this.showAutomationAlert('🔄 Auto Calculate', 'Data dihitung ulang otomatis')
    }

    triggerAutoSave() {
        // Auto-save current state
        const event = new CustomEvent('reli-auto-save')
        document.dispatchEvent(event)
        this.showAutomationAlert('💾 Auto Save', 'Data disimpan otomatis')
    }

    triggerAutoBackup() {
        try {
            const allData = localStorage.getItem('reli-data')
            if (allData) {
                const backup = {
                    timestamp: new Date().toISOString(),
                    data: JSON.parse(allData),
                    version: '1.0'
                }
                localStorage.setItem('reli-backup', JSON.stringify(backup))
                this.showAutomationAlert('📦 Auto Backup', 'Backup data berhasil dibuat')
            }
        } catch (error) {
            console.error('Auto backup failed:', error)
        }
    }

    triggerAutoOptimize() {
        // Trigger optimization analysis
        const event = new CustomEvent('reli-auto-optimize')
        document.dispatchEvent(event)
        this.showAutomationAlert('🚀 Auto Optimize', 'Analisis optimasi dijalankan')
    }

    triggerAutoNotify() {
        // Check for notification triggers
        this.checkSmartAlerts()
    }

    triggerAutoSync() {
        // Simulate cloud sync (in real app, sync with server)
        const event = new CustomEvent('reli-auto-sync')
        document.dispatchEvent(event)
        this.showAutomationAlert('☁️ Auto Sync', 'Data disinkronisasi ke cloud')
    }

    checkSmartAlerts() {
        const today = new Date().toISOString().split('T')[0]
        const todayData = this.getTodayData()
        
        if (!todayData) return

        const currentEarnings = todayData.results?.pendapatanBersih || 0
        const avgEarnings = this.getAverageEarnings()
        const threshold = this.automations.smartAlerts?.threshold || 0.8

        // Alert if earnings are below threshold
        if (avgEarnings > 0 && currentEarnings < (avgEarnings * threshold)) {
            this.showSmartAlert(
                '⚠️ Pendapatan Rendah',
                `Pendapatan hari ini (Rp ${this.formatCurrency(currentEarnings)}) di bawah rata-rata`,
                'warning'
            )
        }

        // Alert for fuel efficiency
        const fuelEfficiency = todayData.fuel?.jarak / (todayData.fuel?.literTerpakai || 1)
        if (fuelEfficiency < 10) {
            this.showSmartAlert(
                '⛽ Efisiensi BBM Rendah',
                `Konsumsi BBM ${fuelEfficiency.toFixed(1)} km/liter. Periksa kendaraan.`,
                'warning'
            )
        }

        // Alert for high additional costs
        const additionalCosts = todayData.additionalCosts?.total || 0
        const earningsRatio = currentEarnings > 0 ? (additionalCosts / currentEarnings) : 0
        if (earningsRatio > 0.3) {
            this.showSmartAlert(
                '💸 Biaya Tambahan Tinggi',
                `Biaya tambahan ${(earningsRatio * 100).toFixed(1)}% dari pendapatan`,
                'error'
            )
        }
    }

    getTodayData() {
        try {
            const today = new Date().toISOString().split('T')[0]
            const allData = JSON.parse(localStorage.getItem('reli-data') || '{}')
            return allData[today] || null
        } catch (error) {
            return null
        }
    }

    getAverageEarnings() {
        try {
            const allData = JSON.parse(localStorage.getItem('reli-data') || '{}')
            const earnings = Object.values(allData).map(day => day.results?.pendapatanBersih || 0)
            return earnings.length > 0 ? earnings.reduce((sum, e) => sum + e, 0) / earnings.length : 0
        } catch (error) {
            return 0
        }
    }

    showAutomationAlert(title, message) {
        // Create subtle automation notification
        const alert = document.createElement('div')
        alert.className = 'automation-alert fixed bottom-4 right-4 alert alert-info shadow-lg max-w-xs z-40'
        alert.style.cssText = `
            animation: slideInUp 0.3s ease-out;
            font-size: 0.75rem;
            padding: 0.5rem;
        `
        alert.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-sm">🤖</span>
                <div>
                    <div class="font-medium text-xs">${title}</div>
                    <div class="text-xs opacity-70">${message}</div>
                </div>
            </div>
        `

        document.body.appendChild(alert)

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (alert.parentElement) {
                alert.style.animation = 'slideOutDown 0.3s ease-in'
                setTimeout(() => {
                    if (alert.parentElement) {
                        alert.remove()
                    }
                }, 300)
            }
        }, 3000)
    }

    showSmartAlert(title, message, type = 'info') {
        // Create smart alert notification
        const alert = document.createElement('div')
        alert.className = `smart-alert fixed top-16 right-4 alert alert-${type} shadow-lg max-w-sm z-50`
        alert.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="text-lg">🧠</span>
                <div class="flex-1">
                    <div class="font-bold text-sm">${title}</div>
                    <div class="text-xs mt-1">${message}</div>
                </div>
                <button class="btn btn-sm btn-circle btn-ghost" onclick="this.closest('.smart-alert').remove()">✕</button>
            </div>
        `

        document.body.appendChild(alert)

        // Auto remove after 8 seconds
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove()
            }
        }, 8000)
    }

    createAutomationRule(name, config) {
        this.automations[name] = config
        this.saveAutomations()
        
        if (config.enabled && config.interval) {
            this.startAutomation(name)
        }
    }

    deleteAutomationRule(name) {
        this.stopAutomation(name)
        delete this.automations[name]
        this.saveAutomations()
    }

    toggleAutomation(name) {
        if (this.automations[name]) {
            this.automations[name].enabled = !this.automations[name].enabled
            
            if (this.automations[name].enabled) {
                this.startAutomation(name)
            } else {
                this.stopAutomation(name)
            }
            
            this.saveAutomations()
        }
    }

    getAutomationStatus() {
        const status = {
            total: Object.keys(this.automations).length,
            active: Object.values(this.automations).filter(a => a.enabled).length,
            running: Object.keys(this.intervals).length
        }
        return status
    }

    exportAutomationConfig() {
        const config = {
            timestamp: new Date().toISOString(),
            automations: this.automations,
            version: '1.0'
        }

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reli-automation-config-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    importAutomationConfig(file) {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result)
                if (config.automations) {
                    // Stop all current automations
                    Object.keys(this.intervals).forEach(key => {
                        this.stopAutomation(key)
                    })
                    
                    // Load new config
                    this.automations = config.automations
                    this.saveAutomations()
                    this.initAutomations()
                    
                    alert('✅ Konfigurasi automasi berhasil diimpor!')
                } else {
                    alert('❌ File konfigurasi tidak valid')
                }
            } catch (error) {
                alert('❌ Error membaca file: ' + error.message)
            }
        }
        reader.readAsText(file)
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID').format(Math.round(amount))
    }

    render() {
        const container = document.createElement('div')
        container.className = 'card bg-base-200 p-4 mb-4'

        const title = new Label('Automation Hub', '🤖')
        container.appendChild(title.render())

        const status = this.getAutomationStatus()

        container.innerHTML += `
            <div class="mt-4">
                <!-- Status Overview -->
                <div class="stats stats-vertical lg:stats-horizontal shadow w-full mb-4">
                    <div class="stat">
                        <div class="stat-figure text-primary">🤖</div>
                        <div class="stat-title">Total Automasi</div>
                        <div class="stat-value text-primary">${status.total}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-figure text-success">✅</div>
                        <div class="stat-title">Aktif</div>
                        <div class="stat-value text-success">${status.active}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-figure text-info">⚡</div>
                        <div class="stat-title">Berjalan</div>
                        <div class="stat-value text-info">${status.running}</div>
                    </div>
                </div>

                <!-- Automation Controls -->
                <div class="card bg-base-100 p-4 mb-4">
                    <h3 class="font-bold mb-3">⚙️ Kontrol Automasi</h3>
                    <div class="space-y-3">
                        ${Object.entries(this.automations).map(([key, config]) => `
                            <div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                                <div>
                                    <div class="font-medium">${this.getAutomationTitle(key)}</div>
                                    <div class="text-sm opacity-70">${this.getAutomationDescription(key)}</div>
                                    ${config.interval ? `<div class="text-xs opacity-50">Interval: ${this.formatInterval(config.interval)}</div>` : ''}
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="badge ${config.enabled ? 'badge-success' : 'badge-error'} badge-sm">
                                        ${config.enabled ? 'ON' : 'OFF'}
                                    </span>
                                    <input type="checkbox" ${config.enabled ? 'checked' : ''} 
                                           class="toggle toggle-primary toggle-sm automation-toggle" 
                                           data-automation="${key}">
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="card bg-base-100 p-4 mb-4">
                    <h3 class="font-bold mb-3">⚡ Quick Actions</h3>
                    <div class="grid grid-cols-2 gap-2">
                        <button class="btn btn-sm btn-success start-all-btn">
                            ▶️ Start All
                        </button>
                        <button class="btn btn-sm btn-error stop-all-btn">
                            ⏹️ Stop All
                        </button>
                        <button class="btn btn-sm btn-info test-automation-btn">
                            🧪 Test Mode
                        </button>
                        <button class="btn btn-sm btn-warning reset-automation-btn">
                            🔄 Reset All
                        </button>
                    </div>
                </div>

                <!-- Configuration -->
                <div class="card bg-base-100 p-4 mb-4">
                    <h3 class="font-bold mb-3">📋 Konfigurasi</h3>
                    <div class="grid grid-cols-2 gap-2">
                        <button class="btn btn-sm btn-primary export-config-btn">
                            📤 Export Config
                        </button>
                        <label class="btn btn-sm btn-secondary">
                            📥 Import Config
                            <input type="file" class="hidden import-config-input" accept=".json">
                        </label>
                    </div>
                </div>

                <!-- Automation Log -->
                <div class="card bg-base-100 p-4">
                    <h3 class="font-bold mb-3">📜 Log Aktivitas</h3>
                    <div class="text-sm space-y-1" id="automation-log">
                        <div class="opacity-70">Log automasi akan muncul di sini...</div>
                    </div>
                </div>
            </div>
        `

        // Add event listeners
        setTimeout(() => {
            // Toggle automations
            container.querySelectorAll('.automation-toggle').forEach(toggle => {
                toggle.onchange = () => {
                    const automationType = toggle.dataset.automation
                    this.toggleAutomation(automationType)
                    this.logActivity(`${automationType} ${toggle.checked ? 'diaktifkan' : 'dinonaktifkan'}`)
                }
            })

            // Quick action buttons
            const startAllBtn = container.querySelector('.start-all-btn')
            const stopAllBtn = container.querySelector('.stop-all-btn')
            const testBtn = container.querySelector('.test-automation-btn')
            const resetBtn = container.querySelector('.reset-automation-btn')
            const exportBtn = container.querySelector('.export-config-btn')
            const importInput = container.querySelector('.import-config-input')

            if (startAllBtn) {
                startAllBtn.onclick = () => {
                    Object.keys(this.automations).forEach(key => {
                        this.automations[key].enabled = true
                        this.startAutomation(key)
                    })
                    this.saveAutomations()
                    this.refreshComponent(container)
                    this.logActivity('Semua automasi diaktifkan')
                }
            }

            if (stopAllBtn) {
                stopAllBtn.onclick = () => {
                    Object.keys(this.automations).forEach(key => {
                        this.automations[key].enabled = false
                        this.stopAutomation(key)
                    })
                    this.saveAutomations()
                    this.refreshComponent(container)
                    this.logActivity('Semua automasi dinonaktifkan')
                }
            }

            if (testBtn) {
                testBtn.onclick = () => {
                    this.runTestMode()
                    this.logActivity('Test mode dijalankan')
                }
            }

            if (resetBtn) {
                resetBtn.onclick = () => {
                    if (confirm('Reset semua konfigurasi automasi?')) {
                        Object.keys(this.intervals).forEach(key => this.stopAutomation(key))
                        this.automations = this.loadAutomations()
                        this.saveAutomations()
                        this.refreshComponent(container)
                        this.logActivity('Konfigurasi automasi direset')
                    }
                }
            }

            if (exportBtn) {
                exportBtn.onclick = () => {
                    this.exportAutomationConfig()
                    this.logActivity('Konfigurasi diekspor')
                }
            }

            if (importInput) {
                importInput.onchange = (e) => {
                    if (e.target.files[0]) {
                        this.importAutomationConfig(e.target.files[0])
                        this.logActivity('Konfigurasi diimpor')
                    }
                }
            }
        }, 0)

        return container
    }

    getAutomationTitle(key) {
        const titles = {
            autoCalculate: '🔄 Auto Calculate',
            autoSave: '💾 Auto Save',
            autoBackup: '📦 Auto Backup',
            autoOptimize: '🚀 Auto Optimize',
            autoNotify: '🔔 Auto Notify',
            autoSync: '☁️ Auto Sync',
            smartAlerts: '🧠 Smart Alerts',
            autoExport: '📊 Auto Export'
        }
        return titles[key] || key
    }

    getAutomationDescription(key) {
        const descriptions = {
            autoCalculate: 'Hitung ulang data secara otomatis',
            autoSave: 'Simpan data secara berkala',
            autoBackup: 'Backup data otomatis',
            autoOptimize: 'Analisis optimasi berkala',
            autoNotify: 'Notifikasi cerdas',
            autoSync: 'Sinkronisasi cloud',
            smartAlerts: 'Peringatan berbasis AI',
            autoExport: 'Export laporan otomatis'
        }
        return descriptions[key] || 'Automasi custom'
    }

    formatInterval(ms) {
        if (ms < 60000) return `${ms/1000}s`
        if (ms < 3600000) return `${ms/60000}m`
        return `${ms/3600000}h`
    }

    logActivity(message) {
        const logElement = document.getElementById('automation-log')
        if (logElement) {
            const timestamp = new Date().toLocaleTimeString('id-ID')
            const logEntry = document.createElement('div')
            logEntry.className = 'text-xs opacity-70'
            logEntry.textContent = `${timestamp} - ${message}`
            
            logElement.insertBefore(logEntry, logElement.firstChild)
            
            // Keep only last 10 entries
            while (logElement.children.length > 10) {
                logElement.removeChild(logElement.lastChild)
            }
        }
    }

    runTestMode() {
        // Run all automations once for testing
        this.triggerAutoCalculate()
        setTimeout(() => this.triggerAutoSave(), 1000)
        setTimeout(() => this.triggerAutoBackup(), 2000)
        setTimeout(() => this.triggerAutoOptimize(), 3000)
        setTimeout(() => this.checkSmartAlerts(), 4000)
        
        this.showAutomationAlert('🧪 Test Mode', 'Semua automasi dijalankan untuk testing')
    }

    refreshComponent(container) {
        const parent = container.parentNode
        const newContainer = this.render()
        parent.replaceChild(newContainer, container)
    }
}