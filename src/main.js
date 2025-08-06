/**
 * RELI Application - Main Entry Point
 * Clean and optimized version with sidebar navigation and Supabase integration
 */

import { testConnection } from './config/supabase.js'
import { databaseService } from './services/DatabaseService.js'
import { analyticsService } from './services/AnalyticsService.js'
import { optimizerService } from './services/OptimizerService.js'
import { locationService } from './services/LocationService.js'
import { Chart, registerables } from 'chart.js'
import './utils/SampleDataGenerator.js'

// Register Chart.js components
Chart.register(...registerables)

console.log('🚀 Starting RELI Application...')

// Application state management
let appData = {
    platforms: {
        grab: { topup: 0, sisa: 0, kotor: 0 },
        maxim: { topup: 0, sisa: 0, kotor: 0 },
        gojek: { topup: 0, sisa: 0, kotor: 0 },
        indrive: { topup: 0, sisa: 0, kotor: 0 },
    },
    fuel: {
        jarak: 0,
        konsumsi: 14,
        harga: 10000,
        literTerpakai: 0,
        biayaBBM: 0,
    },
    additionalCosts: {
        parkir: 0,
        makan: 0,
        kuota: 0,
        tol: 0,
        lainnya: 0,
        total: 0,
    },
    results: {
        totalKotor: 0,
        biayaBBM: 0,
        totalAdditionalCosts: 0,
        pendapatanBersih: 0,
    },
}

let currentView = 'dashboard'
let isOnline = navigator.onLine
let useDatabase = true
let autoSave = true

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID').format(Math.round(amount || 0))
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div')
    toast.className = 'toast toast-top toast-end z-50'

    const alertTypes = {
        success: 'alert-success',
        error: 'alert-error',
        warning: 'alert-warning',
        info: 'alert-info',
    }

    toast.innerHTML = `
        <div class="alert ${alertTypes[type] || 'alert-info'}">
            <span>${message}</span>
        </div>
    `

    document.body.appendChild(toast)
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove()
        }
    }, 3000)
}

// Calculate results
function calculateResults() {
    try {
        // Calculate platform totals
        appData.results.totalKotor = Object.values(appData.platforms).reduce(
            (sum, platform) => sum + (platform.kotor || 0),
            0
        )

        // Calculate fuel costs
        if (appData.fuel.jarak > 0 && appData.fuel.konsumsi > 0) {
            appData.fuel.literTerpakai = appData.fuel.jarak / appData.fuel.konsumsi
            appData.fuel.biayaBBM = appData.fuel.literTerpakai * appData.fuel.harga
        }

        appData.results.biayaBBM = Math.round(appData.fuel.biayaBBM || 0)

        // Calculate additional costs total
        appData.additionalCosts.total = Object.entries(appData.additionalCosts)
            .filter(([key]) => key !== 'total')
            .reduce((sum, [, value]) => sum + (value || 0), 0)

        appData.results.totalAdditionalCosts = appData.additionalCosts.total

        // Calculate net earnings
        appData.results.pendapatanBersih =
            appData.results.totalKotor - appData.results.biayaBBM - appData.results.totalAdditionalCosts

        // Update UI
        updateStatsDisplay()
    } catch (error) {
        console.error('Error calculating results:', error)
    }
}

// Update stats display
function updateStatsDisplay() {
    const elements = {
        'total-kotor': appData.results.totalKotor,
        'biaya-bbm': appData.results.biayaBBM,
        'biaya-tambahan': appData.results.totalAdditionalCosts,
        'pendapatan-bersih': appData.results.pendapatanBersih,
    }

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id)
        if (element) {
            element.textContent = `Rp ${formatCurrency(value)}`
        }
    })
}

// Storage functions
async function saveToStorage(date = null, showMessage = true) {
    try {
        const targetDate = date || new Date().toISOString().split('T')[0]

        // Recalculate results before saving
        calculateResults()

        // Save to localStorage first (offline backup)
        const localData = {
            [targetDate]: {
                ...appData,
                timestamp: new Date().toISOString(),
            },
        }

        const existing = JSON.parse(localStorage.getItem('reli-data') || '{}')
        localStorage.setItem('reli-data', JSON.stringify({ ...existing, ...localData }))

        // Save to database if online and database is enabled
        if (useDatabase && isOnline) {
            const dbResult = await databaseService.saveDailyRecord(appData, targetDate)
            if (dbResult.success) {
                if (showMessage) {
                    showToast(`Data ${targetDate} berhasil disimpan ke database`, 'success')
                }
            } else {
                console.warn('Database save failed, using localStorage only')
                if (showMessage) {
                    showToast(`Data ${targetDate} disimpan lokal (database error)`, 'warning')
                }
            }
        } else {
            if (showMessage) {
                showToast(`Data ${targetDate} disimpan lokal`, 'success')
            }
        }

        // Update UI immediately after saving
        if (currentView === 'input') {
            await renderCurrentView() // Re-render input page to show updated data
        }
    } catch (error) {
        console.error('Error saving to storage:', error)
        if (showMessage) {
            showToast('Gagal menyimpan data', 'error')
        }
    }
}

async function loadFromStorage(date = null, showMessage = false) {
    try {
        const targetDate = date || new Date().toISOString().split('T')[0]
        let dataLoaded = false

        // Try to load from database first if online
        if (useDatabase && isOnline) {
            const dbResult = await databaseService.loadDailyRecord(targetDate)
            if (dbResult.success) {
                appData.platforms = dbResult.data.platforms || appData.platforms
                appData.fuel = dbResult.data.fuel || appData.fuel
                appData.additionalCosts = dbResult.data.additionalCosts || appData.additionalCosts
                appData.results = dbResult.data.results || appData.results
                dataLoaded = true
                if (showMessage) {
                    showToast(`Data ${targetDate} dimuat dari database`, 'success')
                }
            }
        }

        // Fallback to localStorage if database failed or offline
        if (!dataLoaded) {
            const localData = JSON.parse(localStorage.getItem('reli-data') || '{}')
            if (localData[targetDate]) {
                const targetData = localData[targetDate]
                appData.platforms = targetData.platforms || appData.platforms
                appData.fuel = targetData.fuel || appData.fuel
                appData.additionalCosts = targetData.additionalCosts || appData.additionalCosts
                appData.results = targetData.results || appData.results
                dataLoaded = true
                if (showMessage) {
                    showToast(`Data ${targetDate} dimuat dari lokal`, 'info')
                }
            }
        }

        if (dataLoaded) {
            calculateResults()
        } else {
            if (showMessage) {
                showToast(`Tidak ada data untuk ${targetDate}`, 'warning')
            }
        }

        // Update UI immediately after loading
        if (currentView === 'input') {
            await renderCurrentView() // Re-render input page to show loaded data
        }
    } catch (error) {
        console.error('Error loading from storage:', error)
        if (showMessage) {
            showToast('Gagal memuat data', 'error')
        }
    }
}

// Navigation functions
async function navigateTo(view) {
    currentView = view
    await renderCurrentView()
    updateSidebarActive()

    // Initialize charts if we're on analytics page
    if (view === 'analytics') {
        setTimeout(initializeCharts, 100) // Small delay to ensure DOM is ready
    }
}

function updateSidebarActive() {
    document.querySelectorAll('.sidebar-item').forEach(item => {
        const view = item.dataset.view
        if (view === currentView) {
            item.classList.add('active')
        } else {
            item.classList.remove('active')
        }
    })
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar')
    const overlay = document.querySelector('#sidebar-overlay')

    if (sidebar && overlay) {
        const isOpen = sidebar.classList.contains('sidebar-open')

        if (isOpen) {
            sidebar.classList.remove('sidebar-open')
            overlay.classList.remove('show')
            document.body.style.overflow = ''
        } else {
            sidebar.classList.add('sidebar-open')
            overlay.classList.add('show')
            document.body.style.overflow = 'hidden'
        }
    }
}

// Update functions for input
function updatePlatform(platform, field, value) {
    appData.platforms[platform][field] = parseFloat(value) || 0

    // If user inputs kotor directly, use that value
    if (field === 'kotor') {
        appData.platforms[platform].kotor = parseFloat(value) || 0
    } else {
        // Otherwise calculate from topup - sisa
        appData.platforms[platform].kotor = appData.platforms[platform].topup - appData.platforms[platform].sisa
    }

    calculateResults()
    updateInputPageResults() // Update results section in real-time
    autoSaveData() // Auto save if enabled
}

function updateFuel(field, value) {
    appData.fuel[field] = parseFloat(value) || 0
    calculateResults()
    updateInputPageResults() // Update results section in real-time
    autoSaveData() // Auto save if enabled
}

function updateAdditionalCost(field, value) {
    appData.additionalCosts[field] = parseFloat(value) || 0
    calculateResults()
    updateInputPageResults() // Update results section in real-time
    autoSaveData() // Auto save if enabled
}

// Update only the results section in input page (for real-time updates)
function updateInputPageResults() {
    if (currentView !== 'input') return

    // Update platform totals
    Object.entries(appData.platforms).forEach(([platform, data]) => {
        const totalElement = document.querySelector(`[data-platform="${platform}"] .platform-total`)
        if (totalElement) {
            totalElement.textContent = `Total Kotor: Rp ${formatCurrency(data.kotor)}`
        }
    })

    // Update fuel calculation display
    const fuelDisplay = document.querySelector('.fuel-calculation')
    if (fuelDisplay) {
        fuelDisplay.innerHTML = `
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="text-base-content/60">Liter Terpakai:</span>
                    <span class="font-semibold">${appData.fuel.literTerpakai.toFixed(2)} liter</span>
                </div>
                <div>
                    <span class="text-base-content/60">Biaya BBM:</span>
                    <span class="font-semibold text-warning">Rp ${formatCurrency(appData.fuel.biayaBBM)}</span>
                </div>
            </div>
        `
    }

    // Update additional costs total
    const additionalTotal = document.querySelector('.additional-costs-total')
    if (additionalTotal) {
        additionalTotal.textContent = `Total Biaya Tambahan: Rp ${formatCurrency(appData.additionalCosts.total)}`
    }

    // Update all result cards
    const resultElements = {
        'result-total-kotor': appData.results.totalKotor,
        'result-biaya-bbm': appData.results.biayaBBM,
        'result-biaya-tambahan': appData.results.totalAdditionalCosts,
        'result-pendapatan-bersih': appData.results.pendapatanBersih,
    }

    Object.entries(resultElements).forEach(([id, value]) => {
        const element = document.getElementById(id)
        if (element) {
            element.textContent = `Rp ${formatCurrency(value)}`
        }
    })

    // Update breakdown calculation
    const breakdownCalc = document.querySelector('.breakdown-calculation')
    if (breakdownCalc) {
        breakdownCalc.innerHTML = `
            <div class="text-center space-y-2">
                <div class="text-lg font-semibold">Rumus: Pendapatan Bersih = Total Kotor - Biaya BBM - Biaya Tambahan</div>
                <div class="text-xl">
                    <span class="text-primary font-bold">Rp ${formatCurrency(appData.results.totalKotor)}</span>
                    <span class="mx-2">-</span>
                    <span class="text-warning font-bold">Rp ${formatCurrency(appData.results.biayaBBM)}</span>
                    <span class="mx-2">-</span>
                    <span class="text-error font-bold">Rp ${formatCurrency(appData.results.totalAdditionalCosts)}</span>
                    <span class="mx-2">=</span>
                    <span class="text-success font-bold text-2xl">Rp ${formatCurrency(appData.results.pendapatanBersih)}</span>
                </div>
            </div>
        `
    }
}

// Export functions
function exportToWhatsApp() {
    const phoneNumber = prompt('Masukkan nomor WhatsApp (format: 628123456789):')
    if (!phoneNumber) return

    const message = generateWhatsAppMessage()
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
    showToast('Membuka WhatsApp...', 'success')
}

function generateWhatsAppMessage() {
    const today = new Date().toLocaleDateString('id-ID')
    return `*RELI - CATATAN HARIAN DRIVER*
Tanggal: ${today}

*📱 PENDAPATAN PLATFORM:*
• Grab: Rp ${formatCurrency(appData.platforms.grab.kotor)}
• Maxim: Rp ${formatCurrency(appData.platforms.maxim.kotor)}
• Gojek: Rp ${formatCurrency(appData.platforms.gojek.kotor)}
• Indrive: Rp ${formatCurrency(appData.platforms.indrive.kotor)}
*Total Kotor: Rp ${formatCurrency(appData.results.totalKotor)}*

*⛽ DATA BBM:*
• Jarak: ${appData.fuel.jarak} km
• Konsumsi: ${appData.fuel.konsumsi} km/liter
• Liter terpakai: ${appData.fuel.literTerpakai.toFixed(2)} liter
• Harga: Rp ${formatCurrency(appData.fuel.harga)}/liter
*Biaya BBM: Rp ${formatCurrency(appData.results.biayaBBM)}*

*💸 BIAYA TAMBAHAN:*
${Object.entries(appData.additionalCosts)
    .filter(([key, value]) => key !== 'total' && value > 0)
    .map(([key, value]) => `• ${key.charAt(0).toUpperCase() + key.slice(1)}: Rp ${formatCurrency(value)}`)
    .join('\n')}
*Total Biaya Tambahan: Rp ${formatCurrency(appData.results.totalAdditionalCosts)}*

*🧮 PERHITUNGAN:*
Pendapatan Bersih = Total Kotor - Biaya BBM - Biaya Tambahan
Rp ${formatCurrency(appData.results.totalKotor)} - Rp ${formatCurrency(appData.results.biayaBBM)} - Rp ${formatCurrency(appData.results.totalAdditionalCosts)}

*🎯 PENDAPATAN BERSIH: Rp ${formatCurrency(appData.results.pendapatanBersih)}*

_Dibuat dengan RELI - Driver Assistant Pro_`
}

async function exportToCSV() {
    try {
        let data = {}

        // Try to get data from database first
        if (useDatabase && isOnline) {
            const dbResult = await databaseService.getAllDailyRecords()
            if (dbResult.success) {
                // Convert database format to local format
                dbResult.data.forEach(record => {
                    data[record.date] = {
                        results: record.results,
                    }
                })
            }
        }

        // Fallback to localStorage if no database data
        if (Object.keys(data).length === 0) {
            data = JSON.parse(localStorage.getItem('reli-data') || '{}')
        }

        const headers = ['Tanggal', 'Total Kotor', 'Biaya BBM', 'Biaya Tambahan', 'Pendapatan Bersih']

        let csv = headers.join(',') + '\n'
        Object.entries(data).forEach(([date, dayData]) => {
            const row = [
                date,
                dayData.results?.totalKotor || 0,
                dayData.results?.biayaBBM || 0,
                dayData.results?.totalAdditionalCosts || 0,
                dayData.results?.pendapatanBersih || 0,
            ]
            csv += row.join(',') + '\n'
        })

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reli-data-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
        showToast('Data berhasil diexport!', 'success')
    } catch (error) {
        console.error('Error exporting CSV:', error)
        showToast('Gagal export data', 'error')
    }
}

// Sync functions
async function syncToDatabase() {
    if (!useDatabase || !isOnline) {
        showToast('Database tidak tersedia', 'warning')
        return
    }

    try {
        showToast('Memulai sinkronisasi...', 'info')
        const result = await databaseService.syncLocalStorageToDatabase()

        if (result.success) {
            showToast(`Berhasil sync ${result.synced}/${result.total} data ke database`, 'success')
        } else {
            showToast('Gagal sinkronisasi ke database', 'error')
        }
    } catch (error) {
        console.error('Sync error:', error)
        showToast('Error saat sinkronisasi', 'error')
    }
}

function toggleDatabaseMode() {
    useDatabase = !useDatabase
    const status = useDatabase ? 'aktif' : 'nonaktif'
    showToast(`Mode database ${status}`, 'info')
    renderCurrentView() // Re-render to update UI
}

function toggleAutoSave() {
    autoSave = !autoSave
    const status = autoSave ? 'aktif' : 'nonaktif'
    showToast(`Auto save ${status}`, 'info')

    // Save current state to localStorage
    localStorage.setItem('reli-auto-save', autoSave.toString())
}

// Auto save function (called after each input change)
async function autoSaveData() {
    if (!autoSave) return

    const currentDate = document.getElementById('date-selector')?.value || new Date().toISOString().split('T')[0]
    await saveToStorage(currentDate, false) // Save without showing toast
}

// Refresh optimizer recommendations
async function refreshOptimizer() {
    if (currentView === 'optimizer') {
        showToast('Memperbarui rekomendasi...', 'info')
        await renderCurrentView()
        showToast('Rekomendasi berhasil diperbarui!', 'success')
    }
}

// Location tracking functions
async function toggleLocationTracking() {
    try {
        if (locationService.isTracking) {
            locationService.stopTracking()
            showToast('Location tracking dihentikan', 'info')
        } else {
            showToast('Memulai location tracking...', 'info')
            await locationService.startTracking()
            showToast('Location tracking berhasil dimulai', 'success')
        }

        // Refresh the location view if currently active
        if (currentView === 'location') {
            await renderCurrentView()
        }
    } catch (error) {
        console.error('Error toggling location tracking:', error)
        showToast(`Error: ${error.message}`, 'error')
    }
}

async function getCurrentLocation() {
    try {
        // Check permission first
        const permission = await locationService.checkLocationPermission()
        if (permission === 'denied') {
            showToast('Akses lokasi ditolak. Silakan izinkan akses lokasi di pengaturan browser.', 'error')
            return
        }

        showToast('Mendapatkan lokasi...', 'info')
        const position = await locationService.getCurrentLocation()
        showToast(
            `Lokasi berhasil didapat: ${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`,
            'success'
        )

        // Refresh the location view if currently active
        if (currentView === 'location') {
            await renderCurrentView()
        }
    } catch (error) {
        console.error('Error getting location:', error)
        showToast(`Error: ${error.message}`, 'error')
    }
}

async function clearLocationHistory() {
    try {
        // Stop tracking if active
        if (locationService.isTracking) {
            locationService.stopTracking()
        }

        // Clear history
        locationService.locationHistory = []
        locationService.currentPosition = null

        // Clear from localStorage
        localStorage.removeItem('reli-location-data')

        showToast('Riwayat lokasi berhasil dihapus', 'success')

        // Refresh the location view if currently active
        if (currentView === 'location') {
            await renderCurrentView()
        }
    } catch (error) {
        console.error('Error clearing location history:', error)
        showToast(`Error: ${error.message}`, 'error')
    }
}

// Initialize charts for analytics page
async function initializeCharts() {
    try {
        // Get analytics data
        const dailyResult = await analyticsService.getDailyStats(14)
        const summaryResult = await analyticsService.getSummaryStats(30)

        if (!dailyResult.success || !summaryResult.success) {
            console.warn('Failed to load analytics data for charts')
            return
        }

        const dailyStats = dailyResult.data
        const summary = summaryResult.data

        // Initialize earnings chart
        const earningsCanvas = document.getElementById('earningsChart')
        if (earningsCanvas) {
            new Chart(earningsCanvas, {
                type: 'line',
                data: {
                    labels: dailyStats.dates,
                    datasets: [
                        {
                            label: 'Pendapatan Bersih',
                            data: dailyStats.pendapatanBersih,
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                        },
                        {
                            label: 'Total Kotor',
                            data: dailyStats.totalKotor,
                            borderColor: 'rgb(34, 197, 94)',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.4,
                        },
                        {
                            label: 'Biaya BBM',
                            data: dailyStats.biayaBBM,
                            borderColor: 'rgb(251, 191, 36)',
                            backgroundColor: 'rgba(251, 191, 36, 0.1)',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: false,
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return 'Rp ' + new Intl.NumberFormat('id-ID').format(value)
                                },
                            },
                        },
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index',
                    },
                },
            })
        }

        // Initialize platform chart
        const platformCanvas = document.getElementById('platformChart')
        if (platformCanvas) {
            const platformData = Object.entries(summary.platformBreakdown).filter(([platform, total]) => total > 0)

            if (platformData.length > 0) {
                new Chart(platformCanvas, {
                    type: 'doughnut',
                    data: {
                        labels: platformData.map(([platform]) => platform.charAt(0).toUpperCase() + platform.slice(1)),
                        datasets: [
                            {
                                data: platformData.map(([platform, total]) => total),
                                backgroundColor: [
                                    'rgb(34, 197, 94)', // Grab - Green
                                    'rgb(251, 146, 60)', // Maxim - Orange
                                    'rgb(59, 130, 246)', // Gojek - Blue
                                    'rgb(147, 51, 234)', // Indrive - Purple
                                ],
                                borderWidth: 2,
                                borderColor: '#ffffff',
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true,
                                },
                            },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0)
                                        const percentage = ((context.parsed / total) * 100).toFixed(1)
                                        return (
                                            context.label +
                                            ': Rp ' +
                                            new Intl.NumberFormat('id-ID').format(context.parsed) +
                                            ' (' +
                                            percentage +
                                            '%)'
                                        )
                                    },
                                },
                            },
                        },
                    },
                })
            }
        }
    } catch (error) {
        console.error('Error initializing charts:', error)
    }
}

// Render functions
function renderSidebar() {
    return `
        <!-- Sidebar -->
        <div class="sidebar bg-base-100 shadow-xl" id="sidebar">
            <div class="p-4">
                <!-- Logo -->
                <div class="flex items-center gap-3 mb-8">
                    <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <span class="text-white text-xl">📊</span>
                    </div>
                    <div>
                        <div class="font-bold text-lg">RELI</div>
                        <div class="text-xs text-base-content/60">Driver Assistant</div>
                    </div>
                </div>

                <!-- Navigation Menu -->
                <nav class="space-y-2">
                    <div class="sidebar-item ${currentView === 'dashboard' ? 'active' : ''}" 
                         data-view="dashboard" onclick="navigateTo('dashboard')">
                        <span class="text-xl">🏠</span>
                        <span class="sidebar-text">Dashboard</span>
                    </div>
                    
                    <div class="sidebar-item ${currentView === 'input' ? 'active' : ''}" 
                         data-view="input" onclick="navigateTo('input')">
                        <span class="text-xl">📝</span>
                        <span class="sidebar-text">Input Data</span>
                    </div>
                    
                    <div class="sidebar-item ${currentView === 'analytics' ? 'active' : ''}" 
                         data-view="analytics" onclick="navigateTo('analytics')">
                        <span class="text-xl">📊</span>
                        <span class="sidebar-text">Analytics</span>
                    </div>
                    
                    <div class="sidebar-item ${currentView === 'optimizer' ? 'active' : ''}" 
                         data-view="optimizer" onclick="navigateTo('optimizer')">
                        <span class="text-xl">🚀</span>
                        <span class="sidebar-text">Optimizer</span>
                    </div>
                    
                    <div class="sidebar-item ${currentView === 'location' ? 'active' : ''}" 
                         data-view="location" onclick="navigateTo('location')">
                        <span class="text-xl">📍</span>
                        <span class="sidebar-text">Location</span>
                    </div>
                    
                    <div class="sidebar-item ${currentView === 'settings' ? 'active' : ''}" 
                         data-view="settings" onclick="navigateTo('settings')">
                        <span class="text-xl">⚙️</span>
                        <span class="sidebar-text">Settings</span>
                    </div>
                </nav>
            </div>
        </div>

        <!-- Sidebar Overlay for Mobile -->
        <div id="sidebar-overlay" class="sidebar-overlay" onclick="toggleSidebar()"></div>
    `
}

function renderDashboard() {
    return `
        <div class="bg-gradient-to-br from-slate-50 to-blue-50" style="min-height: 100vh"
            <!-- Mobile Header -->
            <div class="navbar bg-white shadow-sm border-b lg:hidden">
                <div class="navbar-start">
                    <button class="btn btn-ghost btn-circle" onclick="toggleSidebar()" id="mobile-menu-btn">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
                <div class="navbar-center">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span class="text-white text-sm font-bold">📊</span>
                        </div>
                        <div class="text-lg font-bold text-gray-800">RELI</div>
                    </div>
                </div>
                <div class="navbar-end">
                    <div class="flex items-center gap-2">
                        <div class="badge badge-sm ${isOnline ? 'badge-success' : 'badge-error'}">${isOnline ? 'Online' : 'Offline'}</div>
                        <div class="badge badge-sm ${useDatabase ? 'badge-info' : 'badge-warning'}">${useDatabase ? 'DB' : 'Local'}</div>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="container mx-auto px-4 py-6 max-w-7xl">
                <!-- Header Section -->
                <div class="mb-8">
                    <div class="flex items-center gap-4 mb-6">
                        <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <span class="text-white text-2xl">📊</span>
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold text-gray-800">Dashboard RELI</h1>
                            <p class="text-gray-600">Rangkuman Earnings Lintas-Industri untuk Driver Ojol</p>
                        </div>
                    </div>
                    
                    <!-- Welcome Card -->
                    <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
                        <div class="text-center">
                            <h2 class="text-2xl lg:text-3xl font-bold mb-3">Selamat Datang di RELI</h2>
                            <p class="text-lg opacity-90 mb-6">Dashboard AI-powered untuk mengoptimalkan pendapatan driver ojol</p>
                            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                                <button class="btn btn-white btn-lg gap-2 shadow-lg hover:shadow-xl transition-all" onclick="navigateTo('input')">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                    Input Data Hari Ini
                                </button>
                                <button class="btn btn-outline btn-white btn-lg gap-2 hover:bg-white hover:text-blue-600 transition-all" onclick="navigateTo('analytics')">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                    </svg>
                                    Lihat Analytics
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-sm">
                                <span class="text-white text-xl">💰</span>
                            </div>
                            <div>
                                <div class="text-sm font-medium text-green-700">Total Kotor</div>
                                <div class="text-xs text-green-600">Dari semua platform</div>
                            </div>
                        </div>
                        <div class="text-2xl font-bold text-green-700" id="total-kotor">Rp ${formatCurrency(appData.results.totalKotor)}</div>
                    </div>
                    
                    <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-sm">
                                <span class="text-white text-xl">⛽</span>
                            </div>
                            <div>
                                <div class="text-sm font-medium text-yellow-700">Biaya BBM</div>
                                <div class="text-xs text-yellow-600">${appData.fuel.literTerpakai.toFixed(1)} liter</div>
                            </div>
                        </div>
                        <div class="text-2xl font-bold text-yellow-700" id="biaya-bbm">Rp ${formatCurrency(appData.results.biayaBBM)}</div>
                    </div>
                    
                    <div class="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-sm">
                                <span class="text-white text-xl">💸</span>
                            </div>
                            <div>
                                <div class="text-sm font-medium text-red-700">Biaya Tambahan</div>
                                <div class="text-xs text-red-600">Operasional harian</div>
                            </div>
                        </div>
                        <div class="text-2xl font-bold text-red-700" id="biaya-tambahan">Rp ${formatCurrency(appData.results.totalAdditionalCosts)}</div>
                    </div>
                    
                    <div class="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                                <span class="text-white text-xl">🎯</span>
                            </div>
                            <div>
                                <div class="text-sm font-medium text-blue-700">Pendapatan Bersih</div>
                                <div class="text-xs text-blue-600">Profit hari ini</div>
                            </div>
                        </div>
                        <div class="text-2xl font-bold text-blue-700" id="pendapatan-bersih">Rp ${formatCurrency(appData.results.pendapatanBersih)}</div>
                    </div>
                </div>

                <!-- Calculation Breakdown -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span class="text-blue-600 text-sm">🧮</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-800">Breakdown Perhitungan</h3>
                    </div>
                    <div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                        <div class="text-center space-y-4">
                            <div class="text-lg font-semibold text-gray-800">
                                Pendapatan Bersih = Total Kotor - Biaya BBM - Biaya Tambahan
                            </div>
                            <div class="flex items-center justify-center gap-4 text-xl font-bold flex-wrap">
                                <span class="text-green-600">Rp ${formatCurrency(appData.results.totalKotor)}</span>
                                <span class="text-gray-400">-</span>
                                <span class="text-yellow-600">Rp ${formatCurrency(appData.results.biayaBBM)}</span>
                                <span class="text-gray-400">-</span>
                                <span class="text-red-600">Rp ${formatCurrency(appData.results.totalAdditionalCosts)}</span>
                                <span class="text-gray-400">=</span>
                                <span class="text-2xl text-blue-600 bg-white px-4 py-2 rounded-lg shadow-sm">Rp ${formatCurrency(appData.results.pendapatanBersih)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Database Status & Actions -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span class="text-purple-600 text-sm">💾</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-800">Status Database</h3>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 ${isOnline ? 'bg-green-100' : 'bg-red-100'} rounded-lg flex items-center justify-center">
                                <span class="${isOnline ? 'text-green-600' : 'text-red-600'} text-sm">${isOnline ? '🌐' : '📴'}</span>
                            </div>
                            <div>
                                <div class="font-medium text-gray-800">Koneksi</div>
                                <div class="text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}">${isOnline ? 'Online' : 'Offline'}</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 ${useDatabase ? 'bg-blue-100' : 'bg-yellow-100'} rounded-lg flex items-center justify-center">
                                <span class="${useDatabase ? 'text-blue-600' : 'text-yellow-600'} text-sm">${useDatabase ? '💾' : '💿'}</span>
                            </div>
                            <div>
                                <div class="font-medium text-gray-800">Mode Penyimpanan</div>
                                <div class="text-sm ${useDatabase ? 'text-blue-600' : 'text-yellow-600'}">${useDatabase ? 'Database' : 'Local Storage'}</div>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-primary btn-sm gap-2" onclick="syncToDatabase()" ${!useDatabase || !isOnline ? 'disabled' : ''}>
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                Sync
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="toggleDatabaseMode()">
                                ${useDatabase ? 'Nonaktifkan' : 'Aktifkan'} DB
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <span class="text-green-600 text-sm">⚡</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-800">Aksi Cepat</h3>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button class="btn btn-primary btn-lg gap-2 shadow-sm hover:shadow-md transition-all" onclick="calculateResults(); showToast('Data berhasil dihitung!', 'success')">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                            Hitung Ulang
                        </button>
                        <button class="btn btn-secondary btn-lg gap-2 shadow-sm hover:shadow-md transition-all" onclick="exportToWhatsApp()">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                            Kirim ke WhatsApp
                        </button>
                        <button class="btn btn-accent btn-lg gap-2 shadow-sm hover:shadow-md transition-all" onclick="exportToCSV()">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
}

function renderInputData() {
    return `
        <div class="bg-gradient-to-br from-slate-50 to-blue-50" style="min-height: 100vh"
            <!-- Mobile Header -->
            <div class="navbar bg-white shadow-sm border-b lg:hidden">
                <div class="navbar-start">
                    <button class="btn btn-ghost btn-circle" onclick="toggleSidebar()">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
                <div class="navbar-center">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span class="text-white text-sm font-bold">📝</span>
                        </div>
                        <div class="text-lg font-bold text-gray-800">Input Data</div>
                    </div>
                </div>
                <div class="navbar-end">
                    <div class="badge badge-sm ${isOnline ? 'badge-success' : 'badge-error'}">${isOnline ? 'Online' : 'Offline'}</div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="container mx-auto px-4 py-6 max-w-7xl">
                <!-- Header Section -->
                <div class="mb-8">
                    <div class="flex items-center gap-4 mb-2">
                        <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span class="text-white text-xl">📝</span>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold text-gray-800">Input Data Harian</h1>
                            <p class="text-gray-600">Masukkan data pendapatan dan pengeluaran hari ini</p>
                        </div>
                    </div>
                </div>

                <!-- Date & Controls Section -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span class="text-blue-600 text-sm">📅</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-800">Pilih Tanggal</h3>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Date Input -->
                        <div class="space-y-4">
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text font-medium text-gray-700">Tanggal</span>
                                </label>
                                <input type="date" 
                                       class="input input-bordered input-lg bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white transition-all" 
                                       id="date-selector"
                                       value="${new Date().toISOString().split('T')[0]}"
                                       onchange="loadFromStorage(this.value, true)">
                            </div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="space-y-4">
                            <div class="label">
                                <span class="label-text font-medium text-gray-700">Aksi Cepat</span>
                            </div>
                            <div class="flex flex-wrap gap-3">
                                <button class="btn btn-primary btn-sm gap-2 shadow-sm" onclick="loadFromStorage(document.getElementById('date-selector').value, true)">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                                    </svg>
                                    Muat Data
                                </button>
                                <button class="btn btn-secondary btn-sm gap-2 shadow-sm" onclick="saveToStorage(document.getElementById('date-selector').value, true)">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"></path>
                                    </svg>
                                    Simpan Data
                                </button>
                                <button class="btn btn-accent btn-sm gap-2 shadow-sm" onclick="loadFromStorage('${new Date(Date.now() - 86400000).toISOString().split('T')[0]}', true)">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    Kemarin
                                </button>
                            </div>
                            <div class="form-control">
                                <label class="label cursor-pointer justify-start gap-3">
                                    <input type="checkbox" class="toggle toggle-primary" id="auto-save-toggle" onchange="toggleAutoSave()" ${autoSave ? 'checked' : ''}>
                                    <span class="label-text font-medium text-gray-700">Auto Save</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Platform Input Section -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <span class="text-green-600 text-sm">🚗</span>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">Pendapatan Platform</h3>
                            <p class="text-sm text-gray-600">Input pendapatan dari setiap platform ojol</p>
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <div class="flex items-start gap-3">
                            <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span class="text-white text-xs">💡</span>
                            </div>
                            <div class="text-sm text-blue-800">
                                <p class="font-semibold mb-1">Tips Input Data:</p>
                                <p><strong>Metode 1:</strong> Masukkan Top-up dan Sisa saldo untuk perhitungan otomatis</p>
                                <p><strong>Metode 2:</strong> Langsung masukkan total pendapatan kotor (contoh: 364.700)</p>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        ${Object.entries(appData.platforms)
                            .map(([platform, data]) => {
                                const platformColors = {
                                    grab: {
                                        bg: 'bg-green-50',
                                        border: 'border-green-200',
                                        text: 'text-green-700',
                                        accent: 'bg-green-500',
                                    },
                                    maxim: {
                                        bg: 'bg-orange-50',
                                        border: 'border-orange-200',
                                        text: 'text-orange-700',
                                        accent: 'bg-orange-500',
                                    },
                                    gojek: {
                                        bg: 'bg-blue-50',
                                        border: 'border-blue-200',
                                        text: 'text-blue-700',
                                        accent: 'bg-blue-500',
                                    },
                                    indrive: {
                                        bg: 'bg-purple-50',
                                        border: 'border-purple-200',
                                        text: 'text-purple-700',
                                        accent: 'bg-purple-500',
                                    },
                                }
                                const colors = platformColors[platform] || platformColors.grab

                                return `
                                <div class="border ${colors.border} ${colors.bg} rounded-xl p-6" data-platform="${platform}">
                                    <div class="flex items-center gap-3 mb-4">
                                        <div class="w-8 h-8 ${colors.accent} rounded-lg flex items-center justify-center">
                                            <span class="text-white text-sm font-bold">${platform.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <h4 class="text-lg font-semibold ${colors.text}">${platform.charAt(0).toUpperCase() + platform.slice(1)}</h4>
                                    </div>
                                    
                                    <div class="grid grid-cols-3 gap-4 mb-4">
                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text text-xs font-medium text-gray-600">Top-up</span>
                                            </label>
                                            <input type="number" 
                                                   class="input input-bordered input-sm bg-white border-gray-200 focus:border-blue-500 text-right" 
                                                   placeholder="0"
                                                   value="${data.topup || ''}"
                                                   onchange="updatePlatform('${platform}', 'topup', this.value)">
                                        </div>
                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text text-xs font-medium text-gray-600">Sisa</span>
                                            </label>
                                            <input type="number" 
                                                   class="input input-bordered input-sm bg-white border-gray-200 focus:border-blue-500 text-right" 
                                                   placeholder="0"
                                                   value="${data.sisa || ''}"
                                                   onchange="updatePlatform('${platform}', 'sisa', this.value)">
                                        </div>
                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text text-xs font-medium text-blue-600">Kotor Langsung</span>
                                            </label>
                                            <input type="number" 
                                                   class="input input-bordered input-sm bg-blue-50 border-blue-300 focus:border-blue-500 text-right font-semibold" 
                                                   placeholder="0"
                                                   value="${data.kotor || ''}"
                                                   onchange="updatePlatform('${platform}', 'kotor', this.value)">
                                        </div>
                                    </div>
                                    
                                    <div class="bg-white rounded-lg p-3 border border-gray-200">
                                        <div class="flex justify-between items-center">
                                            <span class="text-sm text-gray-600">Total Kotor:</span>
                                            <span class="text-lg font-bold ${colors.text} platform-total">Rp ${formatCurrency(data.kotor)}</span>
                                        </div>
                                    </div>
                                </div>
                            `
                            })
                            .join('')}
                    </div>
                </div>

                <!-- Fuel Input Section -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <span class="text-yellow-600 text-sm">⛽</span>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">Data BBM</h3>
                            <p class="text-sm text-gray-600">Input data konsumsi bahan bakar</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-medium text-gray-700">Jarak Tempuh</span>
                                <span class="label-text-alt text-gray-500">km</span>
                            </label>
                            <input type="number" 
                                   class="input input-bordered input-lg bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white text-right font-semibold" 
                                   placeholder="0"
                                   value="${appData.fuel.jarak || ''}"
                                   onchange="updateFuel('jarak', this.value)">
                        </div>
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-medium text-gray-700">Konsumsi</span>
                                <span class="label-text-alt text-gray-500">km/liter</span>
                            </label>
                            <input type="number" 
                                   class="input input-bordered input-lg bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white text-right font-semibold" 
                                   placeholder="14"
                                   value="${appData.fuel.konsumsi || ''}"
                                   onchange="updateFuel('konsumsi', this.value)">
                        </div>
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-medium text-gray-700">Harga BBM</span>
                                <span class="label-text-alt text-gray-500">per liter</span>
                            </label>
                            <input type="number" 
                                   class="input input-bordered input-lg bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white text-right font-semibold" 
                                   placeholder="10000"
                                   value="${appData.fuel.harga || ''}"
                                   onchange="updateFuel('harga', this.value)">
                        </div>
                    </div>
                    
                    <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 fuel-calculation">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Liter Terpakai:</span>
                                <span class="font-bold text-yellow-700">${appData.fuel.literTerpakai.toFixed(2)} liter</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Total Biaya BBM:</span>
                                <span class="font-bold text-yellow-700">Rp ${formatCurrency(appData.fuel.biayaBBM)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Additional Costs Section -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <span class="text-red-600 text-sm">💸</span>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">Biaya Tambahan</h3>
                            <p class="text-sm text-gray-600">Input biaya operasional harian</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        ${Object.entries(appData.additionalCosts)
                            .filter(([key]) => key !== 'total')
                            .map(
                                ([key, value]) => `
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text font-medium text-gray-700">${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                    <span class="label-text-alt text-gray-500">Rp</span>
                                </label>
                                <input type="number" 
                                       class="input input-bordered input-lg bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white text-right font-semibold" 
                                       placeholder="0"
                                       value="${value || ''}"
                                       onchange="updateAdditionalCost('${key}', this.value)">
                            </div>
                        `
                            )
                            .join('')}
                    </div>
                    
                    <div class="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div class="flex justify-between items-center">
                            <span class="text-lg font-medium text-gray-700">Total Biaya Tambahan:</span>
                            <span class="text-xl font-bold text-red-600 additional-costs-total">Rp ${formatCurrency(appData.additionalCosts.total)}</span>
                        </div>
                    </div>
                </div>

                <!-- Results Summary -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span class="text-blue-600 text-sm">🎯</span>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">Ringkasan Hasil</h3>
                            <p class="text-sm text-gray-600">Perhitungan pendapatan bersih hari ini</p>
                        </div>
                    </div>
                    
                    <!-- Calculation Formula -->
                    <div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6 breakdown-calculation">
                        <div class="text-center space-y-4">
                            <div class="text-lg font-semibold text-gray-800">
                                Pendapatan Bersih = Total Kotor - Biaya BBM - Biaya Tambahan
                            </div>
                            <div class="flex items-center justify-center gap-4 text-xl font-bold flex-wrap">
                                <span class="text-green-600">Rp ${formatCurrency(appData.results.totalKotor)}</span>
                                <span class="text-gray-400">-</span>
                                <span class="text-yellow-600">Rp ${formatCurrency(appData.results.biayaBBM)}</span>
                                <span class="text-gray-400">-</span>
                                <span class="text-red-600">Rp ${formatCurrency(appData.results.totalAdditionalCosts)}</span>
                                <span class="text-gray-400">=</span>
                                <span class="text-2xl text-blue-600 bg-white px-4 py-2 rounded-lg shadow-sm">Rp ${formatCurrency(appData.results.pendapatanBersih)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Summary Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div class="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                    <span class="text-white text-sm">💰</span>
                                </div>
                                <span class="text-sm font-medium text-green-700">Total Kotor</span>
                            </div>
                            <div class="text-2xl font-bold text-green-700" id="result-total-kotor">Rp ${formatCurrency(appData.results.totalKotor)}</div>
                            <div class="text-xs text-green-600 mt-1">Pendapatan semua platform</div>
                        </div>
                        
                        <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                                    <span class="text-white text-sm">⛽</span>
                                </div>
                                <span class="text-sm font-medium text-yellow-700">Biaya BBM</span>
                            </div>
                            <div class="text-2xl font-bold text-yellow-700" id="result-biaya-bbm">Rp ${formatCurrency(appData.results.biayaBBM)}</div>
                            <div class="text-xs text-yellow-600 mt-1">${appData.fuel.literTerpakai.toFixed(2)} liter</div>
                        </div>
                        
                        <div class="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                                    <span class="text-white text-sm">💸</span>
                                </div>
                                <span class="text-sm font-medium text-red-700">Biaya Tambahan</span>
                            </div>
                            <div class="text-2xl font-bold text-red-700" id="result-biaya-tambahan">Rp ${formatCurrency(appData.results.totalAdditionalCosts)}</div>
                            <div class="text-xs text-red-600 mt-1">Operasional harian</div>
                        </div>
                        
                        <div class="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <span class="text-white text-sm">🎯</span>
                                </div>
                                <span class="text-sm font-medium text-blue-700">Pendapatan Bersih</span>
                            </div>
                            <div class="text-2xl font-bold text-blue-700" id="result-pendapatan-bersih">Rp ${formatCurrency(appData.results.pendapatanBersih)}</div>
                            <div class="text-xs text-blue-600 mt-1">Profit hari ini</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}

async function renderAnalytics() {
    // Load analytics data
    const summaryResult = await analyticsService.getSummaryStats(30)
    const dailyResult = await analyticsService.getDailyStats(14)
    const trendResult = await analyticsService.getTrendAnalysis(14)

    const summary = summaryResult.success ? summaryResult.data : null
    const dailyStats = dailyResult.success ? dailyResult.data : null
    const trend = trendResult.success ? trendResult.data : null

    return `
        <div class="bg-gradient-to-br from-slate-50 to-blue-50" style="min-height: 100vh">
            <!-- Mobile Header -->
            <div class="navbar bg-white shadow-sm border-b lg:hidden">
                <div class="navbar-start">
                    <button class="btn btn-ghost btn-circle" onclick="toggleSidebar()">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
                <div class="navbar-center">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span class="text-white text-sm font-bold">📊</span>
                        </div>
                        <div class="text-lg font-bold text-gray-800">Analytics</div>
                    </div>
                </div>
                <div class="navbar-end">
                    <div class="badge badge-sm ${isOnline ? 'badge-success' : 'badge-error'}">${isOnline ? 'Online' : 'Offline'}</div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="container mx-auto px-4 py-6 max-w-7xl">
                <!-- Header Section -->
                <div class="mb-8">
                    <div class="flex items-center gap-4 mb-2">
                        <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span class="text-white text-xl">📊</span>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
                            <p class="text-gray-600">Analisis mendalam pendapatan dan performa harian</p>
                        </div>
                    </div>
                </div>

                ${
                    !summary || summary.totalDays === 0
                        ? `
                    <!-- No Data State -->
                    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span class="text-4xl text-gray-400">📊</span>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-800 mb-2">Belum Ada Data Analytics</h3>
                        <p class="text-gray-600 mb-6">Mulai input data harian untuk melihat analisis dan grafik pendapatan</p>
                        <button class="btn btn-primary btn-lg gap-2" onclick="navigateTo('input')">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Input Data Sekarang
                        </button>
                    </div>
                `
                        : `
                    <!-- Summary Stats -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div class="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                                    <span class="text-white text-sm">💰</span>
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-green-700">Total Pendapatan</div>
                                    <div class="text-xs text-green-600">${summary.totalDays} hari terakhir</div>
                                </div>
                            </div>
                            <div class="text-2xl font-bold text-green-700">Rp ${formatCurrency(summary.totalEarnings)}</div>
                            <div class="text-sm text-green-600 mt-1">Rata-rata: Rp ${formatCurrency(summary.averageEarnings)}/hari</div>
                        </div>
                        
                        <div class="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-6">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                                    <span class="text-white text-sm">💸</span>
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-red-700">Total Pengeluaran</div>
                                    <div class="text-xs text-red-600">${summary.totalDays} hari terakhir</div>
                                </div>
                            </div>
                            <div class="text-2xl font-bold text-red-700">Rp ${formatCurrency(summary.totalExpenses)}</div>
                            <div class="text-sm text-red-600 mt-1">Rata-rata: Rp ${formatCurrency(summary.averageExpenses)}/hari</div>
                        </div>
                        
                        <div class="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                                    <span class="text-white text-sm">🚗</span>
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-blue-700">Total Jarak</div>
                                    <div class="text-xs text-blue-600">${summary.totalDays} hari terakhir</div>
                                </div>
                            </div>
                            <div class="text-2xl font-bold text-blue-700">${formatCurrency(summary.totalDistance)} km</div>
                            <div class="text-sm text-blue-600 mt-1">Konsumsi: ${summary.averageFuelConsumption.toFixed(1)} km/L</div>
                        </div>
                        
                        <div class="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                                    <span class="text-white text-sm">${trend?.trend === 'increasing' ? '📈' : trend?.trend === 'decreasing' ? '📉' : '📊'}</span>
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-purple-700">Trend</div>
                                    <div class="text-xs text-purple-600">14 hari terakhir</div>
                                </div>
                            </div>
                            <div class="text-2xl font-bold text-purple-700">${trend?.change > 0 ? '+' : ''}${trend?.change.toFixed(1)}%</div>
                            <div class="text-sm text-purple-600 mt-1">${trend?.message || 'Menganalisis...'}</div>
                        </div>
                    </div>

                    <!-- Charts Section -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <!-- Daily Earnings Chart -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div class="flex items-center gap-3 mb-6">
                                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span class="text-blue-600 text-sm">📈</span>
                                </div>
                                <h3 class="text-lg font-semibold text-gray-800">Trend Pendapatan Harian</h3>
                            </div>
                            <div class="h-80">
                                <canvas id="earningsChart"></canvas>
                            </div>
                        </div>

                        <!-- Platform Breakdown Chart -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div class="flex items-center gap-3 mb-6">
                                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <span class="text-green-600 text-sm">🥧</span>
                                </div>
                                <h3 class="text-lg font-semibold text-gray-800">Breakdown Platform</h3>
                            </div>
                            <div class="h-80">
                                <canvas id="platformChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Best & Worst Days -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div class="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                                    <span class="text-white text-sm">🏆</span>
                                </div>
                                <h3 class="text-lg font-semibold text-green-800">Hari Terbaik</h3>
                            </div>
                            ${
                                summary.bestDay
                                    ? `
                                <div class="space-y-2">
                                    <div class="text-2xl font-bold text-green-700">Rp ${formatCurrency(summary.bestDay.earnings)}</div>
                                    <div class="text-sm text-green-600">${new Date(summary.bestDay.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                    <div class="text-xs text-green-600">Jarak: ${formatCurrency(summary.bestDay.distance)} km</div>
                                </div>
                            `
                                    : '<div class="text-green-600">Belum ada data</div>'
                            }
                        </div>
                        
                        <div class="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-6">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                                    <span class="text-white text-sm">📉</span>
                                </div>
                                <h3 class="text-lg font-semibold text-red-800">Hari Terburuk</h3>
                            </div>
                            ${
                                summary.worstDay
                                    ? `
                                <div class="space-y-2">
                                    <div class="text-2xl font-bold text-red-700">Rp ${formatCurrency(summary.worstDay.earnings)}</div>
                                    <div class="text-sm text-red-600">${new Date(summary.worstDay.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                    <div class="text-xs text-red-600">Jarak: ${formatCurrency(summary.worstDay.distance)} km</div>
                                </div>
                            `
                                    : '<div class="text-red-600">Belum ada data</div>'
                            }
                        </div>
                    </div>

                    <!-- Platform Performance -->
                    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span class="text-purple-600 text-sm">🚗</span>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-800">Performa Platform</h3>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            ${Object.entries(summary.platformBreakdown)
                                .map(([platform, total]) => {
                                    const colors = {
                                        grab: {
                                            bg: 'from-green-50 to-green-100',
                                            border: 'border-green-200',
                                            text: 'text-green-700',
                                            accent: 'bg-green-500',
                                        },
                                        maxim: {
                                            bg: 'from-orange-50 to-orange-100',
                                            border: 'border-orange-200',
                                            text: 'text-orange-700',
                                            accent: 'bg-orange-500',
                                        },
                                        gojek: {
                                            bg: 'from-blue-50 to-blue-100',
                                            border: 'border-blue-200',
                                            text: 'text-blue-700',
                                            accent: 'bg-blue-500',
                                        },
                                        indrive: {
                                            bg: 'from-purple-50 to-purple-100',
                                            border: 'border-purple-200',
                                            text: 'text-purple-700',
                                            accent: 'bg-purple-500',
                                        },
                                    }
                                    const color = colors[platform]
                                    const totalPlatformEarnings = Object.values(summary.platformBreakdown).reduce(
                                        (a, b) => a + b,
                                        0
                                    )
                                    const percentage =
                                        totalPlatformEarnings > 0 ? (total / totalPlatformEarnings) * 100 : 0

                                    return `
                                    <div class="bg-gradient-to-br ${color.bg} border ${color.border} rounded-xl p-4">
                                        <div class="flex items-center gap-3 mb-3">
                                            <div class="w-8 h-8 ${color.accent} rounded-lg flex items-center justify-center">
                                                <span class="text-white text-xs font-bold">${platform.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div class="text-sm font-medium ${color.text}">${platform.charAt(0).toUpperCase() + platform.slice(1)}</div>
                                        </div>
                                        <div class="text-xl font-bold ${color.text}">Rp ${formatCurrency(total)}</div>
                                        <div class="text-xs ${color.text} opacity-75">${percentage.toFixed(1)}% dari total</div>
                                    </div>
                                `
                                })
                                .join('')}
                        </div>
                    </div>
                `
                }
            </div>
        </div>
    `
}

async function renderOptimizer() {
    // Load optimization recommendations
    const optimizationResult = await optimizerService.getOptimizationRecommendations()
    const quickTips = optimizerService.getQuickTips()

    const hasData = optimizationResult.success
    const recommendations = hasData ? optimizationResult.data : null

    return `
        <div class="bg-gradient-to-br from-slate-50 to-blue-50" style="min-height: 100vh">
            <!-- Mobile Header -->
            <div class="navbar bg-white shadow-sm border-b lg:hidden">
                <div class="navbar-start">
                    <button class="btn btn-ghost btn-circle" onclick="toggleSidebar()">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
                <div class="navbar-center">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span class="text-white text-sm font-bold">🚀</span>
                        </div>
                        <div class="text-lg font-bold text-gray-800">Optimizer</div>
                    </div>
                </div>
                <div class="navbar-end">
                    <div class="badge badge-sm ${isOnline ? 'badge-success' : 'badge-error'}">${isOnline ? 'Online' : 'Offline'}</div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="container mx-auto px-4 py-6 max-w-7xl">
                <!-- Header Section -->
                <div class="mb-8">
                    <div class="flex items-center gap-4 mb-2">
                        <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span class="text-white text-xl">🚀</span>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold text-gray-800">AI Optimizer</h1>
                            <p class="text-gray-600">Rekomendasi cerdas untuk meningkatkan pendapatan harian</p>
                        </div>
                    </div>
                </div>

                ${
                    !hasData
                        ? `
                    <!-- No Data State -->
                    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center mb-8">
                        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span class="text-4xl text-gray-400">🚀</span>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-800 mb-2">Belum Ada Data untuk Optimasi</h3>
                        <p class="text-gray-600 mb-6">Input data harian minimal 3 hari untuk mendapatkan rekomendasi AI</p>
                        <button class="btn btn-primary btn-lg gap-2" onclick="navigateTo('input')">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Input Data Sekarang
                        </button>
                    </div>
                `
                        : `
                    <!-- Performance Score -->
                    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span class="text-blue-600 text-sm">🎯</span>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-800">Skor Performa Driver</h3>
                        </div>
                        
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <!-- Overall Score -->
                            <div class="text-center">
                                <div class="relative w-32 h-32 mx-auto mb-4">
                                    <div class="w-32 h-32 rounded-full border-8 border-gray-200 flex items-center justify-center">
                                        <div class="text-center">
                                            <div class="text-3xl font-bold text-${recommendations.overall.gradeColor}-600">${recommendations.overall.grade}</div>
                                            <div class="text-sm text-gray-600">${recommendations.overall.percentage}%</div>
                                        </div>
                                    </div>
                                </div>
                                <h4 class="text-lg font-semibold text-gray-800 mb-2">Skor Keseluruhan</h4>
                                <p class="text-gray-600">${recommendations.overall.score}/${recommendations.overall.maxScore} poin</p>
                            </div>
                            
                            <!-- Score Breakdown -->
                            <div class="space-y-4">
                                ${recommendations.overall.factors
                                    .map(
                                        factor => `
                                    <div class="flex items-center justify-between">
                                        <div class="flex-1">
                                            <div class="flex justify-between items-center mb-1">
                                                <span class="text-sm font-medium text-gray-700">${factor.name}</span>
                                                <span class="text-sm text-gray-600">${factor.percentage}%</span>
                                            </div>
                                            <div class="w-full bg-gray-200 rounded-full h-2">
                                                <div class="bg-blue-600 h-2 rounded-full" style="width: ${factor.percentage}%"></div>
                                            </div>
                                        </div>
                                    </div>
                                `
                                    )
                                    .join('')}
                            </div>
                        </div>
                    </div>

                    <!-- AI Recommendations -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <!-- Earnings Recommendations -->
                        ${
                            recommendations.earnings.length > 0
                                ? `
                            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div class="flex items-center gap-3 mb-6">
                                    <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <span class="text-green-600 text-sm">💰</span>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-800">Optimasi Pendapatan</h3>
                                </div>
                                <div class="space-y-4">
                                    ${recommendations.earnings
                                        .map(
                                            rec => `
                                        <div class="border-l-4 border-${rec.type === 'success' ? 'green' : rec.type === 'warning' ? 'yellow' : 'blue'}-500 pl-4 py-2">
                                            <div class="flex items-start justify-between mb-2">
                                                <h4 class="font-semibold text-gray-800">${rec.title}</h4>
                                                <span class="badge badge-${rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'} badge-sm">${rec.priority}</span>
                                            </div>
                                            <p class="text-sm text-gray-600 mb-2">${rec.description}</p>
                                            <p class="text-sm text-gray-800 font-medium">${rec.action}</p>
                                        </div>
                                    `
                                        )
                                        .join('')}
                                </div>
                            </div>
                        `
                                : ''
                        }

                        <!-- Platform Recommendations -->
                        ${
                            recommendations.platform.length > 0
                                ? `
                            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div class="flex items-center gap-3 mb-6">
                                    <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <span class="text-purple-600 text-sm">📱</span>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-800">Strategi Platform</h3>
                                </div>
                                <div class="space-y-4">
                                    ${recommendations.platform
                                        .map(
                                            rec => `
                                        <div class="border-l-4 border-${rec.type === 'success' ? 'green' : rec.type === 'warning' ? 'yellow' : 'blue'}-500 pl-4 py-2">
                                            <div class="flex items-start justify-between mb-2">
                                                <h4 class="font-semibold text-gray-800">${rec.title}</h4>
                                                <span class="badge badge-${rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'} badge-sm">${rec.priority}</span>
                                            </div>
                                            <p class="text-sm text-gray-600 mb-2">${rec.description}</p>
                                            <p class="text-sm text-gray-800 font-medium">${rec.action}</p>
                                        </div>
                                    `
                                        )
                                        .join('')}
                                </div>
                            </div>
                        `
                                : ''
                        }
                    </div>

                    <!-- Fuel & Cost Optimization -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <!-- Fuel Recommendations -->
                        ${
                            recommendations.fuel.length > 0
                                ? `
                            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div class="flex items-center gap-3 mb-6">
                                    <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                        <span class="text-yellow-600 text-sm">⛽</span>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-800">Efisiensi BBM</h3>
                                </div>
                                <div class="space-y-4">
                                    ${recommendations.fuel
                                        .map(
                                            rec => `
                                        <div class="border-l-4 border-${rec.type === 'success' ? 'green' : rec.type === 'warning' ? 'yellow' : 'blue'}-500 pl-4 py-2">
                                            <div class="flex items-start justify-between mb-2">
                                                <h4 class="font-semibold text-gray-800">${rec.title}</h4>
                                                <span class="badge badge-${rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'} badge-sm">${rec.priority}</span>
                                            </div>
                                            <p class="text-sm text-gray-600 mb-2">${rec.description}</p>
                                            <p class="text-sm text-gray-800 font-medium">${rec.action}</p>
                                        </div>
                                    `
                                        )
                                        .join('')}
                                </div>
                            </div>
                        `
                                : ''
                        }

                        <!-- Cost Recommendations -->
                        ${
                            recommendations.cost.length > 0
                                ? `
                            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div class="flex items-center gap-3 mb-6">
                                    <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                        <span class="text-red-600 text-sm">💸</span>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-800">Manajemen Biaya</h3>
                                </div>
                                <div class="space-y-4">
                                    ${recommendations.cost
                                        .map(
                                            rec => `
                                        <div class="border-l-4 border-${rec.type === 'success' ? 'green' : rec.type === 'warning' ? 'yellow' : 'blue'}-500 pl-4 py-2">
                                            <div class="flex items-start justify-between mb-2">
                                                <h4 class="font-semibold text-gray-800">${rec.title}</h4>
                                                <span class="badge badge-${rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'} badge-sm">${rec.priority}</span>
                                            </div>
                                            <p class="text-sm text-gray-600 mb-2">${rec.description}</p>
                                            <p class="text-sm text-gray-800 font-medium">${rec.action}</p>
                                        </div>
                                    `
                                        )
                                        .join('')}
                                </div>
                            </div>
                        `
                                : ''
                        }
                    </div>

                    <!-- Time Optimization -->
                    ${
                        recommendations.time.length > 0
                            ? `
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                            <div class="flex items-center gap-3 mb-6">
                                <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <span class="text-indigo-600 text-sm">⏰</span>
                                </div>
                                <h3 class="text-lg font-semibold text-gray-800">Optimasi Waktu</h3>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                ${recommendations.time
                                    .map(
                                        rec => `
                                    <div class="border-l-4 border-${rec.type === 'success' ? 'green' : rec.type === 'warning' ? 'yellow' : 'blue'}-500 pl-4 py-2">
                                        <div class="flex items-start justify-between mb-2">
                                            <h4 class="font-semibold text-gray-800">${rec.title}</h4>
                                            <span class="badge badge-${rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'} badge-sm">${rec.priority}</span>
                                        </div>
                                        <p class="text-sm text-gray-600 mb-2">${rec.description}</p>
                                        <p class="text-sm text-gray-800 font-medium">${rec.action}</p>
                                    </div>
                                `
                                    )
                                    .join('')}
                            </div>
                        </div>
                    `
                            : ''
                    }
                `
                }

                <!-- Quick Tips -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <span class="text-orange-600 text-sm">💡</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-800">Tips Cepat Optimasi</h3>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${quickTips
                            .map(
                                tip => `
                            <div class="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                                <div class="flex items-center gap-3 mb-3">
                                    <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                        <span class="text-xl">${tip.icon}</span>
                                    </div>
                                    <h4 class="font-semibold text-gray-800">${tip.title}</h4>
                                </div>
                                <p class="text-sm text-gray-600">${tip.tip}</p>
                            </div>
                        `
                            )
                            .join('')}
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="mt-8 text-center">
                    <div class="flex flex-wrap gap-4 justify-center">
                        <button class="btn btn-primary btn-lg gap-2" onclick="navigateTo('analytics')">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                            Lihat Analytics
                        </button>
                        <button class="btn btn-secondary btn-lg gap-2" onclick="navigateTo('input')">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Input Data Baru
                        </button>
                        ${
                            hasData
                                ? `
                            <button class="btn btn-accent btn-lg gap-2" onclick="refreshOptimizer()">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                Refresh Rekomendasi
                            </button>
                        `
                                : ''
                        }
                    </div>
                </div>
            </div>
        </div>
    `
}

async function renderLocation() {
    // Load location data
    await locationService.loadLocationHistory()
    const analytics = locationService.getLocationAnalytics()
    const currentPosition = locationService.currentPosition
    const isTracking = locationService.isTracking

    // Get area recommendations
    const recommendations = currentPosition
        ? locationService.getAreaRecommendations(currentPosition.latitude, currentPosition.longitude)
        : []

    // Get nearby hotspots
    const nearbyHotspots = currentPosition
        ? locationService.findNearbyHotspots(currentPosition.latitude, currentPosition.longitude, 10)
        : []

    return `
        <div class="bg-base-200" style="min-height: 100vh">
            <!-- Mobile Header -->
            <div class="navbar bg-primary text-primary-content shadow-lg lg:hidden">
                <div class="navbar-start">
                    <button class="btn btn-ghost" onclick="toggleSidebar()">
                        <span class="text-xl">☰</span>
                    </button>
                    <div class="flex items-center gap-2 ml-2">
                        <span class="text-xl">📍</span>
                        <div class="text-lg font-bold">Location</div>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="container mx-auto p-6">
                <div class="space-y-6">
                    <!-- Location Status Card -->
                    <div class="card bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 shadow-lg">
                        <div class="card-body">
                            <div class="flex items-center justify-between mb-4">
                                <h2 class="card-title text-2xl text-blue-800">
                                    📍 Status Lokasi
                                </h2>
                                <div class="badge ${isTracking ? 'badge-success' : 'badge-warning'} badge-lg">
                                    ${isTracking ? '🟢 Tracking Aktif' : '🟡 Tracking Nonaktif'}
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div class="bg-white/70 rounded-lg p-4">
                                    <div class="text-sm text-blue-600 font-medium mb-1">Lokasi Saat Ini</div>
                                    <div class="text-lg font-bold text-blue-800">
                                        ${
                                            currentPosition
                                                ? `${currentPosition.latitude.toFixed(6)}, ${currentPosition.longitude.toFixed(6)}`
                                                : 'Belum dideteksi'
                                        }
                                    </div>
                                    <div class="text-xs text-blue-500 mt-1">
                                        ${
                                            currentPosition
                                                ? `Akurasi: ${currentPosition.accuracy?.toFixed(0) || 'N/A'} meter`
                                                : 'Klik "Dapatkan Lokasi" atau "Mulai Tracking"'
                                        }
                                    </div>
                                </div>
                                
                                <div class="bg-white/70 rounded-lg p-4">
                                    <div class="text-sm text-blue-600 font-medium mb-1">Total Tracking</div>
                                    <div class="text-lg font-bold text-blue-800">
                                        ${analytics.totalLocations} lokasi
                                    </div>
                                    <div class="text-xs text-blue-500 mt-1">
                                        Jarak: ${analytics.totalDistance.toFixed(1)} km
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex flex-wrap gap-3 mb-4">
                                <button class="btn ${isTracking ? 'btn-error' : 'btn-primary'} btn-sm" 
                                        onclick="toggleLocationTracking()">
                                    ${isTracking ? '⏹️ Stop Tracking' : '▶️ Mulai Tracking'}
                                </button>
                                <button class="btn btn-secondary btn-sm" onclick="getCurrentLocation()">
                                    📍 Dapatkan Lokasi
                                </button>
                                <button class="btn btn-outline btn-sm" onclick="clearLocationHistory()">
                                    🗑️ Hapus Riwayat
                                </button>
                            </div>
                            
                            ${
                                !currentPosition && !isTracking
                                    ? `
                                <div class="alert alert-info">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <span class="text-sm">
                                        <strong>Tips:</strong> Browser akan meminta izin akses lokasi. 
                                        Pastikan untuk mengizinkan agar fitur tracking dapat berfungsi.
                                    </span>
                                </div>
                            `
                                    : ''
                            }
                        </div>
                    </div>
                    
                    <!-- Route Optimization Card -->
                    <div class="card bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 shadow-lg">
                        <div class="card-body">
                            <h2 class="card-title text-2xl text-green-800 mb-4">
                                🗺️ Optimasi Rute
                            </h2>
                            
                            ${
                                currentPosition
                                    ? `
                                <div class="space-y-4">
                                    ${recommendations
                                        .map(
                                            rec => `
                                        <div class="bg-white/70 rounded-lg p-4 border-l-4 border-green-500">
                                            <div class="flex items-center justify-between mb-2">
                                                <h3 class="font-bold text-green-800">${rec.time}</h3>
                                                <div class="badge ${rec.priority === 'high' ? 'badge-error' : 'badge-warning'} badge-sm">
                                                    ${rec.priority === 'high' ? 'Prioritas Tinggi' : 'Prioritas Sedang'}
                                                </div>
                                            </div>
                                            <p class="text-sm text-green-700 mb-2">${rec.reason}</p>
                                            <div class="flex flex-wrap gap-2">
                                                ${rec.areas
                                                    .map(
                                                        area => `
                                                    <span class="badge badge-success badge-sm">${area}</span>
                                                `
                                                    )
                                                    .join('')}
                                            </div>
                                        </div>
                                    `
                                        )
                                        .join('')}
                                </div>
                            `
                                    : `
                                <div class="text-center py-8">
                                    <div class="text-6xl mb-4">📍</div>
                                    <p class="text-green-600 mb-4">Aktifkan tracking lokasi untuk mendapatkan rekomendasi rute</p>
                                    <button class="btn btn-primary" onclick="getCurrentLocation()">
                                        📍 Dapatkan Lokasi
                                    </button>
                                </div>
                            `
                            }
                        </div>
                    </div>
                    
                    <!-- Nearby Hotspots Card -->
                    <div class="card bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 shadow-lg">
                        <div class="card-body">
                            <h2 class="card-title text-2xl text-purple-800 mb-4">
                                🔥 Hotspot Terdekat
                            </h2>
                            
                            ${
                                nearbyHotspots.length > 0
                                    ? `
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    ${nearbyHotspots
                                        .slice(0, 6)
                                        .map(hotspot => {
                                            const distance = currentPosition
                                                ? locationService.calculateDistance(
                                                      currentPosition.latitude,
                                                      currentPosition.longitude,
                                                      hotspot.latitude,
                                                      hotspot.longitude
                                                  )
                                                : 0

                                            const typeIcons = {
                                                office: '🏢',
                                                mall: '🏬',
                                                transport: '🚉',
                                                residential: '🏠',
                                                entertainment: '🎭',
                                                restaurant: '🍽️',
                                            }

                                            const demandColors = {
                                                high: 'border-red-500 bg-red-50',
                                                medium: 'border-yellow-500 bg-yellow-50',
                                                low: 'border-green-500 bg-green-50',
                                            }

                                            return `
                                            <div class="bg-white/70 rounded-lg p-4 border-l-4 ${demandColors[hotspot.demand]}">
                                                <div class="flex items-center justify-between mb-2">
                                                    <div class="flex items-center gap-2">
                                                        <span class="text-xl">${typeIcons[hotspot.type] || '📍'}</span>
                                                        <h3 class="font-bold text-purple-800">${hotspot.name}</h3>
                                                    </div>
                                                    <div class="badge ${hotspot.demand === 'high' ? 'badge-error' : hotspot.demand === 'medium' ? 'badge-warning' : 'badge-success'} badge-sm">
                                                        ${hotspot.demand === 'high' ? 'Tinggi' : hotspot.demand === 'medium' ? 'Sedang' : 'Rendah'}
                                                    </div>
                                                </div>
                                                <div class="text-sm text-purple-600">
                                                    📍 ${distance.toFixed(1)} km dari lokasi Anda
                                                </div>
                                                <div class="text-xs text-purple-500 mt-1">
                                                    ${
                                                        hotspot.type === 'office'
                                                            ? 'Area Perkantoran'
                                                            : hotspot.type === 'mall'
                                                              ? 'Pusat Perbelanjaan'
                                                              : hotspot.type === 'transport'
                                                                ? 'Transportasi'
                                                                : hotspot.type === 'residential'
                                                                  ? 'Area Residential'
                                                                  : hotspot.type === 'entertainment'
                                                                    ? 'Hiburan'
                                                                    : hotspot.type === 'restaurant'
                                                                      ? 'Area Kuliner'
                                                                      : 'Lainnya'
                                                    }
                                                </div>
                                            </div>
                                        `
                                        })
                                        .join('')}
                                </div>
                            `
                                    : `
                                <div class="text-center py-8">
                                    <div class="text-6xl mb-4">🔍</div>
                                    <p class="text-purple-600 mb-4">
                                        ${
                                            currentPosition
                                                ? 'Tidak ada hotspot dalam radius 10 km'
                                                : 'Aktifkan tracking lokasi untuk melihat hotspot terdekat'
                                        }
                                    </p>
                                    ${
                                        !currentPosition
                                            ? `
                                        <button class="btn btn-primary" onclick="getCurrentLocation()">
                                            📍 Dapatkan Lokasi
                                        </button>
                                    `
                                            : ''
                                    }
                                </div>
                            `
                            }
                        </div>
                    </div>
                    
                    <!-- Location Analytics Card -->
                    <div class="card bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200 shadow-lg">
                        <div class="card-body">
                            <h2 class="card-title text-2xl text-orange-800 mb-4">
                                📊 Analisis Lokasi
                            </h2>
                            
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div class="bg-white/70 rounded-lg p-4 text-center">
                                    <div class="text-2xl font-bold text-orange-800">${analytics.totalLocations}</div>
                                    <div class="text-sm text-orange-600">Total Lokasi</div>
                                </div>
                                
                                <div class="bg-white/70 rounded-lg p-4 text-center">
                                    <div class="text-2xl font-bold text-orange-800">${analytics.totalDistance.toFixed(1)}</div>
                                    <div class="text-sm text-orange-600">Jarak (km)</div>
                                </div>
                                
                                <div class="bg-white/70 rounded-lg p-4 text-center">
                                    <div class="text-2xl font-bold text-orange-800">${analytics.averageSpeed.toFixed(1)}</div>
                                    <div class="text-sm text-orange-600">Kecepatan Rata-rata (km/h)</div>
                                </div>
                                
                                <div class="bg-white/70 rounded-lg p-4 text-center">
                                    <div class="text-2xl font-bold text-orange-800">
                                        ${
                                            analytics.trackingDuration > 0
                                                ? Math.round(analytics.trackingDuration / (1000 * 60))
                                                : 0
                                        }
                                    </div>
                                    <div class="text-sm text-orange-600">Durasi (menit)</div>
                                </div>
                            </div>
                            
                            ${
                                analytics.totalLocations > 0
                                    ? `
                                <div class="mt-6 bg-white/70 rounded-lg p-4">
                                    <h3 class="font-bold text-orange-800 mb-2">Riwayat Tracking Terakhir</h3>
                                    <div class="text-sm text-orange-700">
                                        <div>• Total lokasi tercatat: ${analytics.totalLocations}</div>
                                        <div>• Jarak tempuh: ${analytics.totalDistance.toFixed(2)} km</div>
                                        <div>• Kecepatan rata-rata: ${analytics.averageSpeed.toFixed(1)} km/h</div>
                                        <div>• Durasi tracking: ${Math.round(analytics.trackingDuration / (1000 * 60))} menit</div>
                                    </div>
                                </div>
                            `
                                    : `
                                <div class="mt-6 text-center py-4">
                                    <p class="text-orange-600">Belum ada data tracking. Mulai tracking untuk melihat analisis.</p>
                                </div>
                            `
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}

function renderSimpleView(title, icon, description) {
    return `
        <div class="bg-base-200" style="min-height: 100vh">
            <!-- Mobile Header -->
            <div class="navbar bg-primary text-primary-content shadow-lg lg:hidden">
                <div class="navbar-start">
                    <button class="btn btn-ghost" onclick="toggleSidebar()">
                        <span class="text-xl">☰</span>
                    </button>
                    <div class="flex items-center gap-2 ml-2">
                        <span class="text-xl">${icon}</span>
                        <div class="text-lg font-bold">${title}</div>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="container mx-auto p-6">
                <div class="card bg-base-100 shadow-xl">
                    <div class="card-body text-center">
                        <div class="text-6xl mb-4">${icon}</div>
                        <h2 class="card-title justify-center text-2xl mb-4">${title}</h2>
                        <p class="text-base-content/60 mb-6">${description}</p>
                        <div class="alert alert-info">
                            <span>🚧 Fitur ini sedang dalam pengembangan dengan arsitektur clean code yang baru</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}

// Render current view
async function renderCurrentView() {
    const appElement = document.getElementById('app')
    if (!appElement) {
        console.error('❌ App element not found in renderCurrentView!')
        return
    }

    let content = ''

    // Add sidebar
    content += renderSidebar()

    // Add main content area
    content += '<div id="main-area" class="lg:ml-64">'

    switch (currentView) {
        case 'dashboard':
            content += renderDashboard()
            break
        case 'input':
            content += renderInputData()
            break
        case 'analytics':
            content += await renderAnalytics()
            break
        case 'optimizer':
            content += await renderOptimizer()
            break
        case 'location':
            content += await renderLocation()
            break
        case 'settings':
            content += renderSimpleView('Settings', '⚙️', 'Pengaturan tema, bahasa, dan preferensi aplikasi')
            break
        default:
            content += renderDashboard()
    }

    content += '</div>'

    appElement.innerHTML = content
    console.log(`✅ Rendered view: ${currentView}`)
}

// Initialize app
async function initApp() {
    try {
        console.log('🚀 Initializing RELI Application...')

        const appElement = document.getElementById('app')
        if (!appElement) {
            console.error('❌ App element not found!')
            return
        }

        console.log('✅ App element found')

        // Test database connection
        if (useDatabase && isOnline) {
            console.log('🔍 Testing database connection...')
            const dbConnected = await testConnection()
            if (!dbConnected) {
                console.warn('⚠️ Database connection failed, using localStorage only')
                useDatabase = false
            }
        }

        // Load auto save preference
        const savedAutoSave = localStorage.getItem('reli-auto-save')
        if (savedAutoSave !== null) {
            autoSave = savedAutoSave === 'true'
        }

        // Load saved data (without showing toast on first load)
        await loadFromStorage()

        // Initialize location service
        console.log('📍 Initializing location service...')
        await locationService.loadLocationHistory()

        // Render initial view
        await renderCurrentView()

        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen')
        if (loadingScreen) {
            loadingScreen.style.opacity = '0'
            setTimeout(() => {
                loadingScreen.style.display = 'none'
            }, 300)
        }

        console.log('✅ RELI Application initialized successfully')
        const dbStatus = useDatabase ? 'dengan database' : 'mode offline'
        showToast(`RELI berhasil dimuat ${dbStatus}!`, 'success')
    } catch (error) {
        console.error('❌ Failed to initialize:', error)

        // Hide loading screen even on error
        const loadingScreen = document.getElementById('loading-screen')
        if (loadingScreen) {
            loadingScreen.style.display = 'none'
        }

        // Show error message
        const appElement = document.getElementById('app')
        if (appElement) {
            appElement.innerHTML = `
                <div class="bg-base-200" style="min-height: 100vh flex items-center justify-center p-4">
                    <div class="card bg-base-100 shadow-xl max-w-md w-full">
                        <div class="card-body text-center">
                            <div class="text-6xl mb-4">❌</div>
                            <h2 class="card-title justify-center text-2xl mb-4">Error</h2>
                            <p class="text-base-content/60 mb-6">Gagal memuat aplikasi: ${error.message}</p>
                            <button class="btn btn-primary" onclick="window.location.reload()">
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                </div>
            `
        }
    }
}

// Online/Offline status monitoring
window.addEventListener('online', () => {
    isOnline = true
    showToast('Koneksi internet tersambung', 'success')
    renderCurrentView()
})

window.addEventListener('offline', () => {
    isOnline = false
    showToast('Koneksi internet terputus, menggunakan mode offline', 'warning')
    renderCurrentView()
})

// Location event listeners
window.addEventListener('locationUpdate', event => {
    const locationData = event.detail
    console.log('Location updated:', locationData)

    // Auto-refresh location view if active
    if (currentView === 'location') {
        // Debounce the refresh to avoid too many updates
        clearTimeout(window.locationRefreshTimeout)
        window.locationRefreshTimeout = setTimeout(async () => {
            await renderCurrentView()
        }, 2000)
    }
})

window.addEventListener('locationError', event => {
    const error = event.detail
    console.error('Location error:', error)
    showToast(error.message || 'Error tracking lokasi', 'error')

    // Refresh location view to update tracking status
    if (currentView === 'location') {
        setTimeout(async () => {
            await renderCurrentView()
        }, 1000)
    }
})

// Make functions globally available
window.navigateTo = navigateTo
window.updatePlatform = updatePlatform
window.updateFuel = updateFuel
window.updateAdditionalCost = updateAdditionalCost
window.calculateResults = calculateResults
window.exportToWhatsApp = exportToWhatsApp
window.exportToCSV = exportToCSV
window.loadFromStorage = loadFromStorage
window.saveToStorage = saveToStorage
window.toggleSidebar = toggleSidebar
window.syncToDatabase = syncToDatabase
window.toggleDatabaseMode = toggleDatabaseMode
window.toggleAutoSave = toggleAutoSave
window.initializeCharts = initializeCharts
window.refreshOptimizer = refreshOptimizer
window.toggleLocationTracking = toggleLocationTracking
window.getCurrentLocation = getCurrentLocation
window.clearLocationHistory = clearLocationHistory

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp)

// Fallback initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp)
} else {
    initApp()
}

console.log('📱 RELI Application loaded')
