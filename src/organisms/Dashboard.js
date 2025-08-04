import { PlatformInput } from '../molecules/PlatformInput.js'
import { FuelInput } from '../molecules/FuelInput.js'
import { AdditionalCosts } from '../molecules/AdditionalCosts.js'
import { AnalyticsDashboard } from '../molecules/AnalyticsDashboard.js'
import { SmartNotifications } from '../molecules/SmartNotifications.js'
import { LocationFeatures } from '../molecules/LocationFeatures.js'
import { AdvancedAnalytics } from '../molecules/AdvancedAnalytics.js'
import { EarningsOptimizer } from '../molecules/EarningsOptimizer.js'
import { AutomationHub } from '../molecules/AutomationHub.js'
import { Sidebar } from '../molecules/Sidebar.js'
import { Button } from '../atoms/Button.js'
import { StorageManager } from '../utils/storage.js'

export class Dashboard {
    constructor() {
        this.currentView = 'dashboard'
        this.storage = new StorageManager()
        this.initializeData()
        this.initComponents()
        this.setupEventListeners()
    }

    initializeData() {
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

        this.loadTodayData()
    }

    initComponents() {
        try {
            // Sidebar
            this.sidebar = new Sidebar(this.navigateTo.bind(this))

            // Input components
            this.grabInput = new PlatformInput('Grab', '🚗', this.updatePlatform.bind(this))
            this.maximInput = new PlatformInput('Maxim', '🛵', this.updatePlatform.bind(this))
            this.gojekInput = new PlatformInput('Gojek', '🛺', this.updatePlatform.bind(this))
            this.indriveInput = new PlatformInput('Indrive', '🚙', this.updatePlatform.bind(this))
            this.fuelInput = new FuelInput(this.updateFuel.bind(this))
            this.additionalCostsInput = new AdditionalCosts(this.updateAdditionalCosts.bind(this))

            // Feature components
            this.analyticsDashboard = new AnalyticsDashboard()
            this.smartNotifications = new SmartNotifications(this.onNotificationSettingsUpdate.bind(this))
            this.locationFeatures = new LocationFeatures(this.onLocationUpdate.bind(this))
            this.advancedAnalytics = new AdvancedAnalytics()
            this.earningsOptimizer = new EarningsOptimizer()
            this.automationHub = new AutomationHub(this.onAutomationUpdate.bind(this))

            // Action buttons
            this.calculateButton = new Button('💰 Hitung Ulang', this.calculate.bind(this))
            this.saveButton = new Button('📱 Kirim ke WhatsApp', this.saveNotes.bind(this), 'btn-secondary')
            this.exportButton = new Button('📊 Export CSV', this.exportData.bind(this), 'btn-accent')

            // Components initialized successfully
        } catch (error) {
            // Silent error handling - components will be checked before use
        }
    }

    setupEventListeners() {
        // Auto-calculate listener
        document.addEventListener('reli-auto-calculate', () => {
            this.calculate()
        })

        // Auto-save listener
        document.addEventListener('reli-auto-save', () => {
            this.saveToStorage()
        })

        // Navigation listeners
        document.addEventListener('navigate-to', (e) => {
            this.navigateTo(e.detail.view)
        })

        // Quick action listeners
        document.addEventListener('reli-whatsapp-export', () => {
            this.saveNotes()
        })

        document.addEventListener('reli-csv-export', () => {
            this.exportData()
        })
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
        this.calculate()
    }

    onLocationUpdate(data) {
        if (data.type === 'distance' && data.distance) {
            this.fuel.jarak = data.distance
            this.fuelInput.jarakInput.setValue(data.distance.toString())
            this.fuelInput.calculateAndUpdate()
            this.calculate()
        }
    }

    onNotificationSettingsUpdate(settings) {
        console.log('Notification settings updated:', settings)
    }

    onAutomationUpdate(automations) {
        console.log('Automation settings updated:', automations)
    }

    calculate() {
        this.results.totalKotor = Object.values(this.platforms).reduce((sum, platform) => sum + platform.kotor, 0)
        this.results.biayaBBM = Math.round(this.fuel.biayaBBM)
        this.results.totalAdditionalCosts = this.additionalCosts.total
        this.results.pendapatanBersih = this.results.totalKotor - this.results.biayaBBM - this.results.totalAdditionalCosts

        this.updateDashboardStats()
        this.updateSidebarStats()
        this.saveToStorage()
    }

    updateSidebarStats() {
        if (this.sidebar) {
            this.sidebar.updateStats({
                results: this.results,
                fuel: this.fuel
            })
        }
    }

    updateDashboardStats() {
        const statsElement = document.getElementById('dashboard-stats')
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="stats stats-vertical lg:stats-horizontal shadow w-full">
                    <div class="stat">
                        <div class="stat-figure text-primary">💰</div>
                        <div class="stat-title">Total Kotor</div>
                        <div class="stat-value text-primary">Rp ${this.formatCurrency(this.results.totalKotor)}</div>
                        <div class="stat-desc">Dari semua platform</div>
                    </div>
                    <div class="stat">
                        <div class="stat-figure text-warning">⛽</div>
                        <div class="stat-title">Biaya BBM</div>
                        <div class="stat-value text-warning">Rp ${this.formatCurrency(this.results.biayaBBM)}</div>
                        <div class="stat-desc">${this.fuel.literTerpakai.toFixed(1)} liter</div>
                    </div>
                    <div class="stat">
                        <div class="stat-figure text-error">💸</div>
                        <div class="stat-title">Biaya Tambahan</div>
                        <div class="stat-value text-error">Rp ${this.formatCurrency(this.results.totalAdditionalCosts)}</div>
                        <div class="stat-desc">Parkir, makan, dll</div>
                    </div>
                    <div class="stat">
                        <div class="stat-figure text-success">🎯</div>
                        <div class="stat-title">Pendapatan Bersih</div>
                        <div class="stat-value text-success">Rp ${this.formatCurrency(this.results.pendapatanBersih)}</div>
                        <div class="stat-desc">Profit hari ini</div>
                    </div>
                </div>
            `
        }
    }

    loadTodayData() {
        try {
            const todayData = this.storage.getTodayData()
            if (todayData) {
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
        } catch (error) {
            // Silent error handling - use default values
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

    exportData() {
        this.storage.downloadCSV()
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
                </div>
                <div class="modal-action">
                    <button class="btn btn-primary" onclick="this.sendToWhatsApp()">📤 Kirim ke WhatsApp</button>
                    <button class="btn btn-secondary" onclick="this.copyToClipboard()">📋 Salin Teks</button>
                    <button class="btn" onclick="this.closeModal()">Batal</button>
                </div>
            </div>
        `

        document.body.appendChild(modal)

        modal.querySelector('.btn-primary').onclick = () => this.sendToWhatsApp(modal)
        modal.querySelector('.btn-secondary').onclick = () => this.copyToClipboard(modal)
        modal.querySelector('.btn:last-child').onclick = () => this.closeModal(modal)
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

        const cleanNumber = phoneNumber.replace(/\D/g, '')
        if (!cleanNumber.startsWith('62') || cleanNumber.length < 10) {
            alert('Format nomor tidak valid! Gunakan format: 628123456789')
            return
        }

        const notes = this.generateNotes()
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(notes)}`

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

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID').format(amount)
    }

    navigateTo(view) {
        // Show loading state
        const mainContent = document.getElementById('main-content')
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="flex items-center justify-center min-h-96">
                    <div class="text-center">
                        <div class="loading loading-spinner loading-lg mb-4"></div>
                        <p class="text-base-content opacity-70">Memuat ${this.getViewTitle(view)}...</p>
                    </div>
                </div>
            `
        }

        // Update current view
        this.currentView = view
        if (this.sidebar) {
            this.sidebar.setCurrentView(view)
        }

        // Render content with slight delay for smooth transition
        setTimeout(() => {
            this.renderMainContent()
        }, 300)
    }

    getViewTitle(view) {
        const titles = {
            dashboard: 'Dashboard',
            input: 'Input Data',
            analytics: 'Analytics',
            optimizer: 'Optimizer',
            location: 'Location Features',
            notifications: 'Notifications',
            automation: 'Automation Hub'
        }
        return titles[view] || 'Halaman'
    }

    renderNavigation() {
        return `
            <div class="navbar bg-primary text-primary-content shadow-lg mb-6">
                <div class="navbar-start">
                    <div class="dropdown">
                        <div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
                            </svg>
                        </div>
                        <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 text-base-content rounded-box w-52">
                            <li><a class="nav-item" data-view="dashboard">🏠 Dashboard</a></li>
                            <li><a class="nav-item" data-view="input">📝 Input Data</a></li>
                            <li><a class="nav-item" data-view="analytics">📊 Analytics</a></li>
                            <li><a class="nav-item" data-view="optimizer">🚀 Optimizer</a></li>
                            <li><a class="nav-item" data-view="location">📍 Location</a></li>
                            <li><a class="nav-item" data-view="notifications">🔔 Notifications</a></li>
                            <li><a class="nav-item" data-view="automation">🤖 Automation</a></li>
                        </ul>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">📊</span>
                        <div>
                            <div class="text-xl font-bold">RELI</div>
                            <div class="text-xs opacity-80">Driver Assistant</div>
                        </div>
                    </div>
                </div>
                
                <div class="navbar-center hidden lg:flex">
                    <ul class="menu menu-horizontal px-1 gap-1">
                        <li><a class="nav-item ${this.currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">🏠 Dashboard</a></li>
                        <li><a class="nav-item ${this.currentView === 'input' ? 'active' : ''}" data-view="input">📝 Input Data</a></li>
                        <li><a class="nav-item ${this.currentView === 'analytics' ? 'active' : ''}" data-view="analytics">📊 Analytics</a></li>
                        <li><a class="nav-item ${this.currentView === 'optimizer' ? 'active' : ''}" data-view="optimizer">🚀 Optimizer</a></li>
                        <li><a class="nav-item ${this.currentView === 'location' ? 'active' : ''}" data-view="location">📍 Location</a></li>
                        <li><a class="nav-item ${this.currentView === 'notifications' ? 'active' : ''}" data-view="notifications">🔔 Notifications</a></li>
                        <li><a class="nav-item ${this.currentView === 'automation' ? 'active' : ''}" data-view="automation">🤖 Automation</a></li>
                    </ul>
                </div>
                
                <div class="navbar-end">
                    <div class="flex items-center gap-2">
                        <div class="badge badge-success badge-sm">Online</div>
                        <div class="text-xs opacity-80">${new Date().toLocaleDateString('id-ID')}</div>
                    </div>
                </div>
            </div>
        `
    }

    renderDashboard() {
        return `
            <div class="max-w-7xl mx-auto space-y-6">
                <!-- Welcome Section -->
                <div class="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-white shadow-xl">
                    <div class="flex flex-col lg:flex-row items-center justify-between">
                        <div class="text-center lg:text-left mb-6 lg:mb-0">
                            <h1 class="text-3xl lg:text-4xl font-bold mb-2">Selamat Datang di RELI</h1>
                            <p class="text-lg opacity-90 mb-4">Dashboard AI-powered untuk mengoptimalkan pendapatan driver ojol</p>
                            <div class="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                                <button class="btn btn-accent nav-item" data-view="input">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                    Input Data Hari Ini
                                </button>
                                <button class="btn btn-outline btn-accent nav-item" data-view="analytics">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                    </svg>
                                    Lihat Analytics
                                </button>
                            </div>
                        </div>
                        <div class="hidden lg:block">
                            <div class="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
                                <span class="text-6xl">📊</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div id="dashboard-stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white rounded-xl p-6 shadow-sm border border-base-200">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-base-content/60">Total Kotor</p>
                                <p class="text-2xl font-bold text-primary">Rp ${this.formatCurrency(this.results.totalKotor)}</p>
                                <p class="text-xs text-base-content/50 mt-1">Dari semua platform</p>
                            </div>
                            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl p-6 shadow-sm border border-base-200">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-base-content/60">Biaya BBM</p>
                                <p class="text-2xl font-bold text-warning">Rp ${this.formatCurrency(this.results.biayaBBM)}</p>
                                <p class="text-xs text-base-content/50 mt-1">${this.fuel.literTerpakai.toFixed(1)} liter</p>
                            </div>
                            <div class="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl p-6 shadow-sm border border-base-200">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-base-content/60">Biaya Tambahan</p>
                                <p class="text-2xl font-bold text-error">Rp ${this.formatCurrency(this.results.totalAdditionalCosts)}</p>
                                <p class="text-xs text-base-content/50 mt-1">Parkir, makan, dll</p>
                            </div>
                            <div class="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl p-6 shadow-sm border border-base-200">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-base-content/60">Pendapatan Bersih</p>
                                <p class="text-2xl font-bold text-success">Rp ${this.formatCurrency(this.results.pendapatanBersih)}</p>
                                <p class="text-xs text-base-content/50 mt-1">Profit hari ini</p>
                            </div>
                            <div class="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Feature Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="bg-white rounded-xl p-6 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-base-content">Input Data</h3>
                        </div>
                        <p class="text-base-content/60 mb-4">Input pendapatan harian dari semua platform dengan mudah dan cepat</p>
                        <button class="btn btn-primary btn-sm nav-item" data-view="input">Mulai Input</button>
                    </div>

                    <div class="bg-white rounded-xl p-6 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                                <svg class="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-base-content">Advanced Analytics</h3>
                        </div>
                        <p class="text-base-content/60 mb-4">Analisis mendalam dengan AI insights dan prediksi akurat</p>
                        <button class="btn btn-secondary btn-sm nav-item" data-view="analytics">Lihat Analytics</button>
                    </div>

                    <div class="bg-white rounded-xl p-6 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                                <svg class="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-base-content">Earnings Optimizer</h3>
                        </div>
                        <p class="text-base-content/60 mb-4">Rekomendasi AI untuk maksimalkan pendapatan harian</p>
                        <button class="btn btn-accent btn-sm nav-item" data-view="optimizer">Optimasi</button>
                    </div>

                    <div class="bg-white rounded-xl p-6 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center group-hover:bg-info/20 transition-colors">
                                <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-base-content">Location Features</h3>
                        </div>
                        <p class="text-base-content/60 mb-4">GPS tracking dan Google Maps integration</p>
                        <button class="btn btn-info btn-sm nav-item" data-view="location">GPS & Maps</button>
                    </div>

                    <div class="bg-white rounded-xl p-6 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                                <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.868 19.504A8.966 8.966 0 003 12a9 9 0 0118 0 8.966 8.966 0 00-1.868 7.504"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-base-content">Smart Notifications</h3>
                        </div>
                        <p class="text-base-content/60 mb-4">Notifikasi cerdas dan pengingat otomatis</p>
                        <button class="btn btn-warning btn-sm nav-item" data-view="notifications">Atur Notifikasi</button>
                    </div>

                    <div class="bg-white rounded-xl p-6 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center group-hover:bg-success/20 transition-colors">
                                <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-base-content">Automation Hub</h3>
                        </div>
                        <p class="text-base-content/60 mb-4">Automasi cerdas untuk efisiensi maksimal</p>
                        <button class="btn btn-success btn-sm nav-item" data-view="automation">Atur Automasi</button>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-white rounded-xl p-6 shadow-sm border border-base-200 mt-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                        </div>
                        <h2 class="text-xl font-semibold text-base-content">Quick Actions</h2>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button class="btn btn-outline btn-primary quick-calculate">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                            Hitung Ulang
                        </button>
                        <button class="btn btn-outline btn-secondary quick-whatsapp">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                            Kirim WhatsApp
                        </button>
                        <button class="btn btn-outline btn-accent quick-export">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Export CSV
                        </button>
                        <button class="btn btn-outline btn-info nav-item" data-view="analytics">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                            Lihat Tren
                        </button>
                    </div>
                </div>
            </div>
        `
    }

    renderInputView() {
        return `
            <div class="container mx-auto p-4 max-w-4xl">
                <div class="breadcrumbs text-sm mb-4">
                    <ul>
                        <li><a class="nav-item cursor-pointer hover:text-primary" data-view="dashboard">Dashboard</a></li>
                        <li>Input Data</li>
                    </ul>
                </div>

                <div class="card bg-base-100 shadow-xl mb-6">
                    <div class="card-body">
                        <h2 class="card-title">📝 Input Data Harian</h2>
                        <p>Masukkan data pendapatan dari semua platform dan biaya operasional</p>
                    </div>
                </div>

                <div id="platform-inputs">
                    <!-- Platform inputs will be rendered here -->
                </div>

                <div id="fuel-input">
                    <!-- Fuel input will be rendered here -->
                </div>

                <div id="additional-costs-input">
                    <!-- Additional costs input will be rendered here -->
                </div>

                <div class="card bg-base-100 shadow-xl mt-6">
                    <div class="card-body">
                        <h2 class="card-title">💰 Hasil Perhitungan</h2>
                        <div id="results-display">
                            <div class="stats stats-vertical lg:stats-horizontal shadow w-full">
                                <div class="stat">
                                    <div class="stat-title">Total Kotor</div>
                                    <div class="stat-value text-primary">Rp ${this.formatCurrency(this.results.totalKotor)}</div>
                                </div>
                                <div class="stat">
                                    <div class="stat-title">Biaya BBM</div>
                                    <div class="stat-value text-warning">Rp ${this.formatCurrency(this.results.biayaBBM)}</div>
                                </div>
                                <div class="stat">
                                    <div class="stat-title">Biaya Tambahan</div>
                                    <div class="stat-value text-error">Rp ${this.formatCurrency(this.results.totalAdditionalCosts)}</div>
                                </div>
                                <div class="stat">
                                    <div class="stat-title">Pendapatan Bersih</div>
                                    <div class="stat-value text-success">Rp ${this.formatCurrency(this.results.pendapatanBersih)}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card-actions justify-end mt-4">
                            <button id="calculate-btn" class="btn btn-primary">💰 Hitung Ulang</button>
                            <button id="whatsapp-btn" class="btn btn-secondary">📱 Kirim WhatsApp</button>
                            <button id="export-btn" class="btn btn-accent">📊 Export CSV</button>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    renderCurrentView() {
        switch (this.currentView) {
            case 'dashboard':
                return this.renderDashboard()
            case 'input':
                return this.renderInputView()
            case 'analytics':
                return `
                    <div class="container mx-auto p-4 max-w-6xl">
                        <div class="breadcrumbs text-sm mb-4">
                            <ul>
                                <li><a class="nav-item cursor-pointer hover:text-primary" data-view="dashboard">Dashboard</a></li>
                                <li>Advanced Analytics</li>
                            </ul>
                        </div>
                        <div id="analytics-content"></div>
                    </div>
                `
            case 'optimizer':
                return `
                    <div class="container mx-auto p-4 max-w-6xl">
                        <div class="breadcrumbs text-sm mb-4">
                            <ul>
                                <li><a class="nav-item cursor-pointer hover:text-primary" data-view="dashboard">Dashboard</a></li>
                                <li>Earnings Optimizer</li>
                            </ul>
                        </div>
                        <div id="optimizer-content"></div>
                    </div>
                `
            case 'location':
                return `
                    <div class="container mx-auto p-4 max-w-6xl">
                        <div class="breadcrumbs text-sm mb-4">
                            <ul>
                                <li><a class="nav-item cursor-pointer hover:text-primary" data-view="dashboard">Dashboard</a></li>
                                <li>Location Features</li>
                            </ul>
                        </div>
                        <div id="location-content"></div>
                    </div>
                `
            case 'notifications':
                return `
                    <div class="container mx-auto p-4 max-w-6xl">
                        <div class="breadcrumbs text-sm mb-4">
                            <ul>
                                <li><a class="nav-item cursor-pointer hover:text-primary" data-view="dashboard">Dashboard</a></li>
                                <li>Smart Notifications</li>
                            </ul>
                        </div>
                        <div id="notifications-content"></div>
                    </div>
                `
            case 'automation':
                return `
                    <div class="container mx-auto p-4 max-w-6xl">
                        <div class="breadcrumbs text-sm mb-4">
                            <ul>
                                <li><a class="nav-item" data-view="dashboard">Dashboard</a></li>
                                <li>Automation Hub</li>
                            </ul>
                        </div>
                        <div id="automation-content"></div>
                    </div>
                `
            default:
                return this.renderDashboard()
        }
    }

    render() {
        try {
            // Load CSS if not already loaded
            this.loadSidebarCSS()
            
            const container = document.createElement('div')
            container.className = 'min-h-screen bg-base-100'

            // Create responsive dashboard layout
            container.innerHTML = `
                <!-- Sidebar Container -->
                <div id="sidebar-container"></div>
                
                <!-- Main Content Area -->
                <div id="main-area" class="main-area">
                    <!-- Top Header -->
                    <div class="bg-base-100 border-b border-base-200 p-4 lg:p-6 shadow-sm">
                        <div class="flex items-center justify-between">
                            <!-- Mobile Menu Button & Title -->
                            <div class="flex items-center gap-4">
                                <button id="mobile-menu-btn" class="mobile-menu-btn btn btn-ghost btn-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                                <div>
                                    <h1 class="text-xl lg:text-2xl font-bold text-base-content">${this.getViewTitle(this.currentView)}</h1>
                                    <p class="text-xs lg:text-sm text-base-content/60">Manage your driver earnings efficiently</p>
                                </div>
                            </div>
                            
                            <!-- Header Actions -->
                            <div class="flex items-center gap-2 lg:gap-4">
                                <div class="dropdown dropdown-end">
                                    <div tabindex="0" role="button" class="btn btn-ghost btn-sm">
                                        <svg class="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                                        </svg>
                                    </div>
                                    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                        <li><a class="quick-calculate">💰 Calculate</a></li>
                                        <li><a class="quick-whatsapp">📱 WhatsApp</a></li>
                                        <li><a class="quick-export">📊 Export</a></li>
                                    </ul>
                                </div>
                                <div class="badge badge-success badge-sm gap-1">
                                    <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    <span class="hidden sm:inline">Online</span>
                                </div>
                                <div class="text-xs text-base-content/60 hidden md:block">${new Date().toLocaleDateString('id-ID')}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Page Content -->
                    <div id="main-content" class="flex-1 p-4 lg:p-6 bg-base-50 overflow-auto min-h-[calc(100vh-5rem)]">
                        <!-- Content will be rendered here -->
                    </div>
                </div>

                <!-- Mobile Sidebar Overlay -->
                <div id="sidebar-overlay" class="sidebar-overlay"></div>
            `

            // Add sidebar with error handling
            try {
                const sidebarContainer = container.querySelector('#sidebar-container')
                if (sidebarContainer && this.sidebar) {
                    sidebarContainer.appendChild(this.sidebar.render())
                }
            } catch (sidebarError) {
                console.warn('Sidebar failed to render:', sidebarError)
                // Fallback if sidebar fails
                const sidebarContainer = container.querySelector('#sidebar-container')
                if (sidebarContainer) {
                    sidebarContainer.innerHTML = `
                        <div class="sidebar bg-base-200 flex items-center justify-center">
                            <div class="text-center">
                                <div class="loading loading-spinner loading-md mb-2"></div>
                                <p class="text-xs">Loading sidebar...</p>
                            </div>
                        </div>
                    `
                }
            }

            // Setup mobile menu and navigation
            setTimeout(() => {
                this.setupMobileMenu(container)
                this.setupNavigationListeners()
                this.renderMainContent()
            }, 0)

            return container
        } catch (error) {
            console.error('Dashboard render error:', error)
            // Fallback render if main render fails
            const fallbackContainer = document.createElement('div')
            fallbackContainer.className = 'min-h-screen bg-base-200 flex items-center justify-center'
            fallbackContainer.innerHTML = `
                <div class="card bg-base-100 shadow-xl max-w-md">
                    <div class="card-body text-center">
                        <h2 class="card-title">📊 RELI Dashboard</h2>
                        <p class="text-sm">Loading dashboard...</p>
                        <div class="loading loading-spinner loading-lg mt-4"></div>
                        <button class="btn btn-primary btn-sm mt-4" onclick="window.location.reload()">
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            `
            return fallbackContainer
        }
    }

    loadSidebarCSS() {
        // Check if CSS is already loaded
        if (document.querySelector('link[href*="sidebar.css"]')) {
            return
        }

        // Create and append CSS link
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = '/src/styles/sidebar.css'
        document.head.appendChild(link)
    }

    setupMobileMenu(container) {
        try {
            const mobileMenuBtn = container.querySelector('#mobile-menu-btn')
            const sidebarOverlay = container.querySelector('#sidebar-overlay')
            const sidebar = container.querySelector('.sidebar')
            const mainArea = container.querySelector('#main-area')

            if (mobileMenuBtn && sidebarOverlay && sidebar) {
                // Mobile menu toggle
                mobileMenuBtn.addEventListener('click', (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    
                    const isOpen = sidebar.classList.contains('sidebar-open')
                    
                    if (isOpen) {
                        // Close sidebar
                        sidebar.classList.remove('sidebar-open')
                        sidebarOverlay.classList.remove('show')
                        document.body.style.overflow = ''
                    } else {
                        // Open sidebar
                        sidebar.classList.add('sidebar-open')
                        sidebarOverlay.classList.add('show')
                        document.body.style.overflow = 'hidden'
                    }
                })

                // Close sidebar when clicking overlay
                sidebarOverlay.addEventListener('click', () => {
                    sidebar.classList.remove('sidebar-open')
                    sidebarOverlay.classList.remove('show')
                    document.body.style.overflow = ''
                })

                // Close sidebar on escape key
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && sidebar.classList.contains('sidebar-open')) {
                        sidebar.classList.remove('sidebar-open')
                        sidebarOverlay.classList.remove('show')
                        document.body.style.overflow = ''
                    }
                })

                // Handle window resize
                window.addEventListener('resize', () => {
                    if (window.innerWidth >= 1024) {
                        // Desktop view - close mobile menu
                        sidebar.classList.remove('sidebar-open')
                        sidebarOverlay.classList.remove('show')
                        document.body.style.overflow = ''
                        
                        // Update main area margin based on sidebar state
                        if (mainArea) {
                            if (sidebar.classList.contains('sidebar-collapsed')) {
                                mainArea.classList.add('sidebar-collapsed')
                            } else {
                                mainArea.classList.remove('sidebar-collapsed')
                            }
                        }
                    }
                })

                // Setup quick action buttons
                this.setupQuickActions(container)
            }
        } catch (error) {
            console.warn('Mobile menu setup failed:', error)
        }
    }

    setupQuickActions(container) {
        try {
            const quickCalculate = container.querySelector('.quick-calculate')
            const quickWhatsapp = container.querySelector('.quick-whatsapp')
            const quickExport = container.querySelector('.quick-export')

            if (quickCalculate) {
                quickCalculate.addEventListener('click', (e) => {
                    e.preventDefault()
                    this.calculate()
                    this.showToast('💰 Data dihitung ulang', 'success')
                })
            }

            if (quickWhatsapp) {
                quickWhatsapp.addEventListener('click', (e) => {
                    e.preventDefault()
                    this.saveNotes()
                })
            }

            if (quickExport) {
                quickExport.addEventListener('click', (e) => {
                    e.preventDefault()
                    this.exportData()
                    this.showToast('📊 Data berhasil diexport', 'success')
                })
            }
        } catch (error) {
            console.warn('Quick actions setup failed:', error)
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div')
        toast.className = `alert alert-${type} fixed top-4 right-4 w-auto max-w-sm z-50 shadow-lg`
        toast.style.animation = 'slideInUp 0.3s ease-out'
        toast.innerHTML = `
            <span class="text-sm">${message}</span>
            <button class="btn btn-sm btn-circle btn-ghost" onclick="this.parentElement.remove()">✕</button>
        `
        
        document.body.appendChild(toast)
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideOutDown 0.3s ease-in'
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove()
                    }
                }, 300)
            }
        }, 3000)
    }

    setupNavigationListeners() {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            try {
                // Add event listeners for all navigation items
                const navItems = document.querySelectorAll('.nav-item')
                
                navItems.forEach((item, index) => {
                    // Remove existing listeners to prevent duplicates
                    const newItem = item.cloneNode(true)
                    if (item.parentNode) {
                        item.parentNode.replaceChild(newItem, item)
                    }
                    
                    // Add new listener with proper binding
                    newItem.addEventListener('click', (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        
                        const view = e.target.dataset.view || e.target.closest('.nav-item')?.dataset.view
                        
                        if (view) {
                            this.navigateTo(view)
                            
                            // Close mobile menu if open
                            const sidebar = document.querySelector('.sidebar')
                            const overlay = document.querySelector('#sidebar-overlay')
                            if (sidebar && overlay) {
                                sidebar.classList.remove('sidebar-open')
                                overlay.classList.remove('show')
                                document.body.style.overflow = ''
                            }
                        }
                    })
                })

                // Add event listeners for quick action buttons
                document.querySelectorAll('.quick-calculate').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault()
                        document.dispatchEvent(new CustomEvent('reli-auto-calculate'))
                    })
                })

                document.querySelectorAll('.quick-whatsapp').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault()
                        this.saveNotes()
                    })
                })

                document.querySelectorAll('.quick-export').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault()
                        this.exportData()
                    })
                })
            } catch (error) {
                console.warn('Navigation listeners setup failed:', error)
            }
        }, 100)
    }

    renderMainContent() {
        try {
            const mainContent = document.getElementById('main-content')
            if (mainContent) {
                mainContent.innerHTML = this.renderCurrentView()
                
                // Add page transition animation
                mainContent.classList.add('page-transition')
                
                // Render specific content based on current view immediately
                this.renderViewContent()
                this.setupNavigationListeners()
            }
        } catch (error) {
            // Fallback content if rendering fails
            const mainContent = document.getElementById('main-content')
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="container mx-auto p-4">
                        <div class="hero bg-gradient-to-r from-primary to-secondary text-primary-content rounded-lg">
                            <div class="hero-content text-center py-8">
                                <div class="max-w-md">
                                    <h1 class="text-3xl font-bold">📊 RELI Dashboard</h1>
                                    <p class="py-4">Rangkuman Earnings Lintas-Industri</p>
                                    <p class="text-sm opacity-90">Dashboard is loading...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            }
        }
    }

    renderViewContent() {
        try {
            switch (this.currentView) {
                case 'input':
                    const platformInputs = document.querySelector('#platform-inputs')
                    const fuelInput = document.querySelector('#fuel-input')
                    const additionalCostsInput = document.querySelector('#additional-costs-input')

                    if (platformInputs && this.grabInput) {
                        platformInputs.appendChild(this.grabInput.render())
                        platformInputs.appendChild(this.maximInput.render())
                        platformInputs.appendChild(this.gojekInput.render())
                        platformInputs.appendChild(this.indriveInput.render())
                    }

                    if (fuelInput && this.fuelInput) {
                        fuelInput.appendChild(this.fuelInput.render())
                    }

                    if (additionalCostsInput && this.additionalCostsInput) {
                        additionalCostsInput.appendChild(this.additionalCostsInput.render())
                    }

                    // Add event listeners for input view
                    this.setupInputViewListeners()
                    break

                case 'analytics':
                    const analyticsContent = document.querySelector('#analytics-content')
                    if (analyticsContent && this.advancedAnalytics) {
                        analyticsContent.appendChild(this.advancedAnalytics.render())
                    }
                    break

                case 'optimizer':
                    const optimizerContent = document.querySelector('#optimizer-content')
                    if (optimizerContent && this.earningsOptimizer) {
                        optimizerContent.appendChild(this.earningsOptimizer.render())
                    }
                    break

                case 'location':
                    const locationContent = document.querySelector('#location-content')
                    if (locationContent && this.locationFeatures) {
                        locationContent.appendChild(this.locationFeatures.render())
                    }
                    break

                case 'notifications':
                    const notificationsContent = document.querySelector('#notifications-content')
                    if (notificationsContent && this.smartNotifications) {
                        notificationsContent.appendChild(this.smartNotifications.render())
                    }
                    break

                case 'automation':
                    const automationContent = document.querySelector('#automation-content')
                    if (automationContent && this.automationHub) {
                        automationContent.appendChild(this.automationHub.render())
                    }
                    break
            }
        } catch (error) {
            // Silent error handling - show fallback content
            const mainContent = document.getElementById('main-content')
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="alert alert-info">
                        <span>Loading content...</span>
                    </div>
                `
            }
        }
    }

    setupInputViewListeners() {
        // Add event listeners for input view buttons
        setTimeout(() => {
            try {
                const calculateBtn = document.querySelector('#calculate-btn')
                const whatsappBtn = document.querySelector('#whatsapp-btn')
                const exportBtn = document.querySelector('#export-btn')

                if (calculateBtn) {
                    calculateBtn.onclick = () => this.calculate()
                }

                if (whatsappBtn) {
                    whatsappBtn.onclick = () => this.saveNotes()
                }

                if (exportBtn) {
                    exportBtn.onclick = () => this.exportData()
                }
            } catch (error) {
                // Silent error handling
            }
        }, 100)
    }
}