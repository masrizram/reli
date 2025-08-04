import { PlatformInput } from '../molecules/PlatformInput.js'
import { FuelInput } from '../molecules/FuelInput.js'
import { AdditionalCosts } from '../molecules/AdditionalCosts.js'
import { AnalyticsDashboard } from '../molecules/AnalyticsDashboard.js'
import { SmartNotifications } from '../molecules/SmartNotifications.js'
import { LocationFeatures } from '../molecules/LocationFeatures.js'
import { AdvancedAnalytics } from '../molecules/AdvancedAnalytics.js'
import { EarningsOptimizer } from '../molecules/EarningsOptimizer.js'
import { AutomationHub } from '../molecules/AutomationHub.js'
import { Button } from '../atoms/Button.js'
import { StorageManager } from '../utils/storage.js'

export class App {
    constructor() {
        this.platforms = {
            grab: { topup: 0, sisa: 0, kotor: 0 },
            maxim: { topup: 0, sisa: 0, kotor: 0 },
            gojek: { topup: 0, sisa: 0, kotor: 0 },
            indrive: { topup: 0, sisa: 0, kotor: 0 },
        }

        this.fuel = {
            jarak: 0,
            konsumsi: 14,
            harga: 10000,
            literTerpakai: 0,
            biayaBBM: 0,
        }

        this.additionalCosts = {
            parkir: 0,
            makan: 0,
            kuota: 0,
            tol: 0,
            lainnya: 0,
            total: 0,
        }

        this.results = {
            totalKotor: 0,
            biayaBBM: 0,
            totalAdditionalCosts: 0,
            pendapatanBersih: 0,
        }

        this.storage = new StorageManager()
        this.initComponents()
        this.loadTodayData()
    }

    initComponents() {
        this.grabInput = new PlatformInput('Grab', '🚗', this.updatePlatform.bind(this))
        this.maximInput = new PlatformInput('Maxim', '🛵', this.updatePlatform.bind(this))
        this.gojekInput = new PlatformInput('Gojek', '🛺', this.updatePlatform.bind(this))
        this.indriveInput = new PlatformInput('Indrive', '🚙', this.updatePlatform.bind(this))
        this.fuelInput = new FuelInput(this.updateFuel.bind(this))
        this.additionalCostsInput = new AdditionalCosts(this.updateAdditionalCosts.bind(this))
        this.analyticsDashboard = new AnalyticsDashboard()
        this.smartNotifications = new SmartNotifications(this.onNotificationSettingsUpdate.bind(this))
        this.locationFeatures = new LocationFeatures(this.onLocationUpdate.bind(this))
        this.advancedAnalytics = new AdvancedAnalytics()
        this.earningsOptimizer = new EarningsOptimizer()
        this.automationHub = new AutomationHub(this.onAutomationUpdate.bind(this))
        this.calculateButton = new Button('💰 Hitung Ulang', this.calculate.bind(this))
        this.saveButton = new Button('📱 Kirim ke WhatsApp', this.saveNotes.bind(this), 'btn-secondary')
        this.exportButton = new Button('📊 Export CSV', this.exportData.bind(this), 'btn-accent')
    }

    updatePlatform(platform, data) {
        this.platforms[platform.toLowerCase()] = data
        this.calculate()
    }

    updateFuel(data) {
        this.fuel = data
        this.calculate()
    }

    updateAdditionalCosts(data) {
        this.additionalCosts = data
        this.additionalCostsInput.updateTotalDisplay(data.total)
        this.calculate()
    }

    onNotificationSettingsUpdate(settings) {
        // Handle notification settings updates if needed
        console.log('Notification settings updated:', settings)
    }

    onLocationUpdate(data) {
        if (data.type === 'distance' && data.distance) {
            // Update fuel input with GPS distance
            this.fuel.jarak = data.distance
            this.fuelInput.jarakInput.setValue(data.distance.toString())
            this.fuelInput.calculateAndUpdate()
            this.calculate()
        }
    }

    onAutomationUpdate(automations) {
        console.log('Automation settings updated:', automations)
        // Handle automation updates if needed
    }

    loadTodayData() {
        const todayData = this.storage.getTodayData()
        if (todayData) {
            // Load saved data if available
            if (todayData.platforms) {
                Object.keys(this.platforms).forEach(platform => {
                    if (todayData.platforms[platform]) {
                        this.platforms[platform] = todayData.platforms[platform]
                    }
                })
            }
            if (todayData.fuel) {
                this.fuel = { ...this.fuel, ...todayData.fuel }
            }
            if (todayData.additionalCosts) {
                this.additionalCosts = { ...this.additionalCosts, ...todayData.additionalCosts }
            }
        }
    }

    exportData() {
        this.storage.downloadCSV()
    }

    calculate() {
        this.results.totalKotor = Object.values(this.platforms).reduce((sum, platform) => sum + platform.kotor, 0)

        this.results.biayaBBM = Math.round(this.fuel.biayaBBM)
        this.results.totalAdditionalCosts = this.additionalCosts.total
        this.results.pendapatanBersih =
            this.results.totalKotor - this.results.biayaBBM - this.results.totalAdditionalCosts

        this.updateResults()
        this.saveToStorage()

        // Check for low fuel warning
        try {
            const totalBalance = Object.values(this.platforms).reduce((sum, platform) => sum + platform.sisa, 0)
            if (this.smartNotifications && typeof this.smartNotifications.checkLowFuelWarning === 'function') {
                this.smartNotifications.checkLowFuelWarning(totalBalance)
            }
        } catch (error) {
            console.error('Error checking low fuel warning:', error)
        }
    }

    saveToStorage() {
        const dataToSave = {
            platforms: this.platforms,
            fuel: this.fuel,
            additionalCosts: this.additionalCosts,
            results: this.results,
        }
        this.storage.saveDaily(dataToSave)
    }

    updateResults() {
        const resultsElement = document.getElementById('results')
        if (resultsElement) {
            resultsElement.innerHTML = `
                <div class="stats stats-vertical lg:stats-horizontal shadow w-full">
                    <div class="stat">
                        <div class="stat-title">Total Kotor</div>
                        <div class="stat-value text-primary">Rp ${this.formatCurrency(this.results.totalKotor)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-title">Biaya BBM</div>
                        <div class="stat-value text-warning">Rp ${this.formatCurrency(this.results.biayaBBM)}</div>
                        <div class="stat-desc">${this.fuel.literTerpakai.toFixed(1)} liter</div>
                    </div>
                    <div class="stat">
                        <div class="stat-title">Biaya Tambahan</div>
                        <div class="stat-value text-error">Rp ${this.formatCurrency(this.results.totalAdditionalCosts)}</div>
                        <div class="stat-desc">Parkir, makan, dll</div>
                    </div>
                    <div class="stat">
                        <div class="stat-title">Pendapatan Bersih</div>
                        <div class="stat-value text-success">Rp ${this.formatCurrency(this.results.pendapatanBersih)}</div>
                    </div>
                </div>
            `
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID').format(amount)
    }

    saveNotes() {
        this.showWhatsAppModal()
    }

    showWhatsAppModal() {
        const savedNumber = localStorage.getItem('reli-whatsapp') || ''

        const modal = document.createElement('div')
        modal.className = 'modal modal-open'
        modal.innerHTML = `
            <div class="modal-box">
                <h3 class="font-bold text-lg mb-4">📱 Kirim Catatan ke WhatsApp</h3>
                <div class="form-control mb-4">
                    <label class="label">
                        <span class="label-text">Nomor WhatsApp</span>
                        <span class="label-text-alt text-xs opacity-70">Format: 628123456789 (tanpa +)</span>
                    </label>
                    <input type="tel" id="whatsapp-number" placeholder="628123456789" value="${savedNumber}" class="input input-bordered" />
                    <div class="label">
                        <span class="label-text-alt text-xs opacity-60">💡 Nomor akan disimpan untuk penggunaan selanjutnya</span>
                    </div>
                </div>
                <div class="modal-action">
                    <button class="btn btn-primary" onclick="this.sendToWhatsApp()">📤 Kirim ke WhatsApp</button>
                    <button class="btn btn-secondary" onclick="this.copyToClipboard()">📋 Salin Teks</button>
                    <button class="btn" onclick="this.closeModal()">Batal</button>
                </div>
            </div>
        `

        document.body.appendChild(modal)

        // Add event listeners
        modal.querySelector('.btn-primary').onclick = () => this.sendToWhatsApp(modal)
        modal.querySelector('.btn-secondary').onclick = () => this.copyToClipboard(modal)
        modal.querySelector('.btn:last-child').onclick = () => this.closeModal(modal)

        // Focus on input if empty
        const input = modal.querySelector('#whatsapp-number')
        if (!savedNumber) {
            input.focus()
        }
    }

    generateNotes() {
        const today = new Date().toLocaleDateString('id-ID')
        return `*RELI - CATATAN HARIAN DRIVER*
Tanggal: ${today}

*PENDAPATAN PLATFORM:*
• Grab: Top-up ${this.formatCurrency(this.platforms.grab.topup)} | Sisa ${this.formatCurrency(this.platforms.grab.sisa)}
• Maxim: Top-up ${this.formatCurrency(this.platforms.maxim.topup)} | Sisa ${this.formatCurrency(this.platforms.maxim.sisa)}
• Gojek: Top-up ${this.formatCurrency(this.platforms.gojek.topup)} | Sisa ${this.formatCurrency(this.platforms.gojek.sisa)}
• Indrive: Top-up ${this.formatCurrency(this.platforms.indrive.topup)} | Sisa ${this.formatCurrency(this.platforms.indrive.sisa)}

*DATA OPERASIONAL:*
• Jarak: ${this.fuel.jarak} km
• Konsumsi: ${this.fuel.konsumsi} km/liter
• Harga BBM: Rp ${this.formatCurrency(this.fuel.harga)}/liter

*BIAYA TAMBAHAN:*
• Parkir: Rp ${this.formatCurrency(this.additionalCosts.parkir)}
• Makan & Minum: Rp ${this.formatCurrency(this.additionalCosts.makan)}
• Kuota Internet: Rp ${this.formatCurrency(this.additionalCosts.kuota)}
• Tol: Rp ${this.formatCurrency(this.additionalCosts.tol)}
• Lainnya: Rp ${this.formatCurrency(this.additionalCosts.lainnya)}

*HASIL PERHITUNGAN:*
• Total Kotor: Rp ${this.formatCurrency(this.results.totalKotor)}
• Biaya BBM: Rp ${this.formatCurrency(this.results.biayaBBM)} (${this.fuel.literTerpakai.toFixed(1)} liter)
• Biaya Tambahan: Rp ${this.formatCurrency(this.results.totalAdditionalCosts)}
• *Pendapatan Bersih: Rp ${this.formatCurrency(this.results.pendapatanBersih)}*

---
_Dibuat dengan RELI - Rangkuman Earnings Lintas-Industri_`.trim()
    }

    sendToWhatsApp(modal) {
        const phoneNumber = modal.querySelector('#whatsapp-number').value.trim()
        if (!phoneNumber) {
            alert('Masukkan nomor WhatsApp terlebih dahulu!')
            return
        }

        // Validate phone number format
        const cleanNumber = phoneNumber.replace(/\D/g, '')
        if (!cleanNumber.startsWith('62') || cleanNumber.length < 10) {
            alert('Format nomor tidak valid! Gunakan format: 628123456789')
            return
        }

        const notes = this.generateNotes()
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(notes)}`

        // Save phone number to localStorage for next time
        localStorage.setItem('reli-whatsapp', cleanNumber)

        window.open(whatsappUrl, '_blank')
        this.closeModal(modal)
    }

    copyToClipboard(modal) {
        const notes = this.generateNotes()
        navigator.clipboard.writeText(notes).then(() => {
            alert('Catatan berhasil disalin ke clipboard!')
            this.closeModal(modal)
        })
    }

    closeModal(modal) {
        document.body.removeChild(modal)
    }

    render() {
        const container = document.createElement('div')
        container.className = 'container mx-auto p-4 max-w-4xl'

        container.innerHTML = `
            <div class="navbar bg-primary text-primary-content rounded-lg mb-6">
                <div class="flex-1">
                    <h1 class="text-xl font-bold">📊 RELI</h1>
                    <span class="text-sm ml-2 opacity-80">Rangkuman Earnings Lintas-Industri</span>
                </div>
            </div>
            
            <div class="alert alert-info mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div>
                    <h3 class="font-bold">💡 Tips Penggunaan:</h3>
                    <div class="text-sm">
                        • Reset Trip A setiap pagi untuk data jarak akurat<br>
                        • Isi data setelah selesai shift untuk menghindari lupa<br>
                        • Simpan struk BBM untuk validasi harga & liter
                    </div>
                </div>
            </div>
        `

        // Analytics Dashboard
        container.appendChild(this.analyticsDashboard.render())

        // Platform inputs
        container.appendChild(this.grabInput.render())
        container.appendChild(this.maximInput.render())
        container.appendChild(this.gojekInput.render())
        container.appendChild(this.indriveInput.render())

        // Fuel input
        container.appendChild(this.fuelInput.render())

        // Location features
        container.appendChild(this.locationFeatures.render())

        // Additional costs input
        container.appendChild(this.additionalCostsInput.render())

        // Smart notifications
        container.appendChild(this.smartNotifications.render())

        // Advanced Analytics
        container.appendChild(this.advancedAnalytics.render())

        // Earnings Optimizer
        container.appendChild(this.earningsOptimizer.render())

        // Automation Hub
        container.appendChild(this.automationHub.render())

        // Results section
        const resultsSection = document.createElement('div')
        resultsSection.innerHTML = `
            <div class="divider">Hasil Perhitungan</div>
            <div id="results" class="mb-6">
                <div class="alert alert-info">
                    <span>Masukkan data untuk melihat hasil perhitungan</span>
                </div>
            </div>
        `
        container.appendChild(resultsSection)

        // Action buttons
        const buttonContainer = document.createElement('div')
        buttonContainer.className = 'grid grid-cols-1 md:grid-cols-3 gap-4'
        buttonContainer.appendChild(this.calculateButton.render())
        buttonContainer.appendChild(this.saveButton.render())
        buttonContainer.appendChild(this.exportButton.render())
        container.appendChild(buttonContainer)

        // Add automation event listeners
        this.setupAutomationListeners()

        return container
    }

    setupAutomationListeners() {
        // Auto-calculate listener
        document.addEventListener('reli-auto-calculate', () => {
            this.calculate()
        })

        // Auto-save listener
        document.addEventListener('reli-auto-save', () => {
            this.saveToStorage()
        })

        // Auto-optimize listener
        document.addEventListener('reli-auto-optimize', () => {
            // Trigger optimization analysis
            if (this.earningsOptimizer) {
                const recommendations = this.earningsOptimizer.generateOptimizationRecommendations()
                if (recommendations.length > 0) {
                    const topRec = recommendations[0]
                    this.showOptimizationAlert(topRec.title, topRec.message)
                }
            }
        })

        // Auto-sync listener
        document.addEventListener('reli-auto-sync', () => {
            // Simulate cloud sync
            this.syncToCloud()
        })
    }

    showOptimizationAlert(title, message) {
        const alert = document.createElement('div')
        alert.className = 'optimization-alert fixed top-4 left-4 alert alert-info shadow-lg max-w-sm z-50'
        alert.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="text-xl">🚀</span>
                <div>
                    <div class="font-bold text-sm">${title}</div>
                    <div class="text-xs mt-1">${message}</div>
                </div>
                <button class="btn btn-sm btn-circle btn-ghost" onclick="this.closest('.optimization-alert').remove()">✕</button>
            </div>
        `

        document.body.appendChild(alert)

        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove()
            }
        }, 8000)
    }

    syncToCloud() {
        // Simulate cloud sync (in real app, sync with actual cloud service)
        const data = {
            timestamp: new Date().toISOString(),
            platforms: this.platforms,
            fuel: this.fuel,
            additionalCosts: this.additionalCosts,
            results: this.results,
        }

        // Store in localStorage as "cloud" backup
        localStorage.setItem('reli-cloud-sync', JSON.stringify(data))
        console.log('Data synced to cloud:', data)
    }
}
