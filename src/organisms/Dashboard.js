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
            <div class="container mx-auto p-4 max-w-7xl">
                <!-- Welcome Section -->
                <div class="hero bg-gradient-to-r from-primary to-secondary text-primary-content rounded-lg mb-6">
                    <div class="hero-content text-center py-8">
                        <div class="max-w-md">
                            <h1 class="text-3xl font-bold">Selamat Datang di RELI</h1>
                            <p class="py-4">Dashboard AI-powered untuk mengoptimalkan pendapatan driver ojol</p>
                            <div class="flex gap-2 justify-center">
                                <button class="btn btn-accent nav-item" data-view="input">📝 Input Data Hari Ini</button>
                                <button class="btn btn-outline btn-accent nav-item" data-view="analytics">📊 Lihat Analytics</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div id="dashboard-stats" class="mb-6">
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
                </div>

                <!-- Feature Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                        <div class="card-body">
                            <h2 class="card-title">📝 Input Data</h2>
                            <p>Input pendapatan harian dari semua platform dengan mudah</p>
                            <div class="card-actions justify-end">
                                <button class="btn btn-primary nav-item" data-view="input">Mulai Input</button>
                            </div>
                        </div>
                    </div>

                    <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                        <div class="card-body">
                            <h2 class="card-title">📊 Advanced Analytics</h2>
                            <p>Analisis mendalam dengan AI insights dan prediksi</p>
                            <div class="card-actions justify-end">
                                <button class="btn btn-secondary nav-item" data-view="analytics">Lihat Analytics</button>
                            </div>
                        </div>
                    </div>

                    <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                        <div class="card-body">
                            <h2 class="card-title">🚀 Earnings Optimizer</h2>
                            <p>Rekomendasi AI untuk maksimalkan pendapatan</p>
                            <div class="card-actions justify-end">
                                <button class="btn btn-accent nav-item" data-view="optimizer">Optimasi</button>
                            </div>
                        </div>
                    </div>

                    <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                        <div class="card-body">
                            <h2 class="card-title">📍 Location Features</h2>
                            <p>GPS tracking dan Google Maps integration</p>
                            <div class="card-actions justify-end">
                                <button class="btn btn-info nav-item" data-view="location">GPS & Maps</button>
                            </div>
                        </div>
                    </div>

                    <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                        <div class="card-body">
                            <h2 class="card-title">🔔 Smart Notifications</h2>
                            <p>Notifikasi cerdas dan pengingat otomatis</p>
                            <div class="card-actions justify-end">
                                <button class="btn btn-warning nav-item" data-view="notifications">Atur Notifikasi</button>
                            </div>
                        </div>
                    </div>

                    <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                        <div class="card-body">
                            <h2 class="card-title">🤖 Automation Hub</h2>
                            <p>Automasi cerdas untuk efisiensi maksimal</p>
                            <div class="card-actions justify-end">
                                <button class="btn btn-success nav-item" data-view="automation">Atur Automasi</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="card bg-base-100 shadow-xl">
                    <div class="card-body">
                        <h2 class="card-title">⚡ Quick Actions</h2>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <button class="btn btn-outline quick-calculate">
                                💰 Hitung Ulang
                            </button>
                            <button class="btn btn-outline quick-whatsapp">
                                📱 Kirim WhatsApp
                            </button>
                            <button class="btn btn-outline quick-export">
                                📊 Export CSV
                            </button>
                            <button class="btn btn-outline nav-item" data-view="analytics">
                                📈 Lihat Tren
                            </button>
                        </div>
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
        const container = document.createElement('div')
        container.className = 'min-h-screen bg-base-200'

        // Create responsive layout
        container.innerHTML = `
            <!-- Mobile Header -->
            <div class="navbar bg-primary text-primary-content lg:hidden">
                <div class="navbar-start">
                    <button class="btn btn-ghost" id="mobile-menu-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
                <div class="navbar-center">
                    <span class="text-xl font-bold">📊 RELI</span>
                </div>
                <div class="navbar-end">
                    <div class="badge badge-success badge-sm">Online</div>
                </div>
            </div>

            <!-- Sidebar Overlay for Mobile -->
            <div id="sidebar-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden hidden"></div>

            <!-- Main Layout -->
            <div class="flex">
                <!-- Sidebar -->
                <div id="sidebar-container"></div>
                
                <!-- Main Content -->
                <div class="flex-1 lg:ml-64 transition-all duration-300" id="main-area">
                    <div class="p-4 lg:p-6" id="main-content">
                        <!-- Content will be rendered here -->
                    </div>
                </div>
            </div>
        `

        // Add sidebar
        const sidebarContainer = container.querySelector('#sidebar-container')
        sidebarContainer.appendChild(this.sidebar.render())

        // Setup mobile menu
        this.setupMobileMenu(container)

        // Initial render
        setTimeout(() => {
            this.renderMainContent()
            this.setupNavigationListeners()
            
            // Debug: Check if mobile elements exist
            console.log('Mobile header check:', {
                mobileHeader: container.querySelector('.navbar.lg\\:hidden'),
                mobileMenuBtn: container.querySelector('#mobile-menu-btn'),
                sidebarOverlay: container.querySelector('#sidebar-overlay'),
                sidebar: container.querySelector('.sidebar')
            })
        }, 0)

        return container
    }

    setupMobileMenu(container) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            try {
                const mobileMenuBtn = container.querySelector('#mobile-menu-btn')
                const sidebarOverlay = container.querySelector('#sidebar-overlay')
                const sidebar = container.querySelector('.sidebar')

                if (mobileMenuBtn && sidebarOverlay && sidebar) {
                    // Remove existing listeners
                    const newMobileMenuBtn = mobileMenuBtn.cloneNode(true)
                    mobileMenuBtn.parentNode.replaceChild(newMobileMenuBtn, mobileMenuBtn)

                    // Toggle mobile menu
                    newMobileMenuBtn.addEventListener('click', (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        
                        sidebar.classList.toggle('sidebar-mobile-open')
                        sidebarOverlay.classList.toggle('hidden')
                    })

                    // Close menu when clicking overlay
                    sidebarOverlay.addEventListener('click', () => {
                        sidebar.classList.remove('sidebar-mobile-open')
                        sidebarOverlay.classList.add('hidden')
                    })

                    // Close menu when window resizes to desktop
                    const resizeHandler = () => {
                        if (window.innerWidth >= 1024) {
                            sidebar.classList.remove('sidebar-mobile-open')
                            sidebarOverlay.classList.add('hidden')
                        }
                    }
                    window.addEventListener('resize', resizeHandler)
                }
            } catch (error) {
                // Silent error handling
            }
        }, 100)
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
                                sidebar.classList.remove('sidebar-mobile-open')
                                overlay.classList.add('hidden')
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
                // Silent error handling
            }
        }, 100)
    }

    renderMainContent() {
        const mainContent = document.getElementById('main-content')
        if (mainContent) {
            mainContent.innerHTML = this.renderCurrentView()
            
            // Add page transition animation
            mainContent.classList.add('page-transition')
            
            // Render specific content based on current view
            setTimeout(() => {
                this.renderViewContent()
                this.setupNavigationListeners()
            }, 0)
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
            console.error('Error rendering view content:', error)
            // Show error message to user
            const mainContent = document.getElementById('main-content')
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="alert alert-error">
                        <span>Error loading content. Please refresh the page.</span>
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