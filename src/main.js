/**
 * RELI Application - Clean Main Entry Point
 * Refactored for better structure and maintainability
 */

// Core imports
import { testConnection } from './config/supabase.js'
import { databaseService } from './services/DatabaseService.js'
import { analyticsService } from './services/AnalyticsService.js'
import { optimizerService } from './services/OptimizerService.js'
import { locationService } from './services/LocationService.js'
import { Chart, registerables } from 'chart.js'

// Layout and components
import { createMainLayout, createPageContent } from './layouts/MainLayout.js'
import { renderSidebar } from './components/Sidebar.js'
import { renderDashboard } from './pages/Dashboard.js'

// Utils
import './utils/SampleDataGenerator.js'

// Register Chart.js components
Chart.register(...registerables)

console.log('🚀 Starting RELI Application (Clean Version)...')

// Application state management
let appData = {
    platforms: {
        grab: { pendapatan: 0, jarak: 0, waktu: 0 },
        gojek: { pendapatan: 0, jarak: 0, waktu: 0 },
        maxim: { pendapatan: 0, jarak: 0, waktu: 0 },
        indrive: { pendapatan: 0, jarak: 0, waktu: 0 }
    },
    fuel: {
        totalLiters: 0,
        pricePerLiter: 8770,
        totalCost: 0
    },
    additionalCosts: [],
    totalGross: 0,
    totalNet: 0
}

// Global state
let currentView = 'dashboard'
let isOnline = navigator.onLine
let useDatabase = false
let autoSave = true

// Navigation function
function navigateTo(view) {
    currentView = view
    renderCurrentView()
}

// Toggle sidebar for mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar')
    const overlay = document.getElementById('sidebar-overlay')
    
    if (sidebar && overlay) {
        const isOpen = sidebar.classList.contains('translate-x-0')
        
        if (isOpen) {
            sidebar.classList.remove('translate-x-0')
            sidebar.classList.add('-translate-x-full')
            overlay.classList.add('hidden')
        } else {
            sidebar.classList.remove('-translate-x-full')
            sidebar.classList.add('translate-x-0')
            overlay.classList.remove('hidden')
        }
    }
}

// Main render function
async function renderCurrentView() {
    const appElement = document.getElementById('app')
    if (!appElement) {
        console.error('❌ App element not found!')
        return
    }

    let pageContent = ''

    // Get the page content based on current view
    switch (currentView) {
        case 'dashboard':
            pageContent = renderDashboard(isOnline, useDatabase)
            break
        case 'input':
            pageContent = renderInputPage()
            break
        case 'analytics':
            pageContent = await renderAnalyticsPage()
            break
        case 'optimizer':
            pageContent = await renderOptimizerPage()
            break
        case 'location':
            pageContent = await renderLocationPage()
            break
        case 'settings':
            pageContent = renderSettingsPage()
            break
        default:
            pageContent = renderDashboard(isOnline, useDatabase)
    }

    // Create the complete layout using the new structure
    const sidebarContent = renderSidebar(currentView)
    const mainContent = createPageContent(pageContent)
    const fullLayout = createMainLayout(sidebarContent, mainContent)

    appElement.innerHTML = fullLayout
    console.log(`✅ Rendered view: ${currentView}`)
}

// Placeholder render functions (to be moved to separate files)
function renderInputPage() {
    return `
        <div class="p-6 bg-gradient-to-br from-slate-50 to-blue-50 flex-1">
            <h1 class="text-2xl font-bold mb-4">Input Data</h1>
            <p>Input page content will be here...</p>
        </div>
    `
}

async function renderAnalyticsPage() {
    return `
        <div class="p-6 bg-gradient-to-br from-slate-50 to-blue-50 flex-1">
            <h1 class="text-2xl font-bold mb-4">Analytics</h1>
            <p>Analytics page content will be here...</p>
        </div>
    `
}

async function renderOptimizerPage() {
    return `
        <div class="p-6 bg-gradient-to-br from-slate-50 to-blue-50 flex-1">
            <h1 class="text-2xl font-bold mb-4">Optimizer</h1>
            <p>Optimizer page content will be here...</p>
        </div>
    `
}

async function renderLocationPage() {
    return `
        <div class="p-6 bg-gradient-to-br from-slate-50 to-blue-50 flex-1">
            <h1 class="text-2xl font-bold mb-4">Location</h1>
            <p>Location page content will be here...</p>
        </div>
    `
}

function renderSettingsPage() {
    return `
        <div class="p-6 bg-gradient-to-br from-slate-50 to-blue-50 flex-1">
            <h1 class="text-2xl font-bold mb-4">Settings</h1>
            <p>Settings page content will be here...</p>
        </div>
    `
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

        // Test database connection
        if (isOnline) {
            console.log('🔍 Testing database connection...')
            const dbConnected = await testConnection()
            if (!dbConnected) {
                console.warn('⚠️ Database connection failed, using localStorage only')
                useDatabase = false
            } else {
                useDatabase = true
            }
        }

        // Initialize location service
        console.log('📍 Initializing location service...')
        await locationService.loadLocationHistory()
        
        // Render initial view
        await renderCurrentView()
        
        console.log('✅ RELI Application initialized successfully!')
        
    } catch (error) {
        console.error('❌ Failed to initialize app:', error)
        
        // Show error message
        const appElement = document.getElementById('app')
        if (appElement) {
            appElement.innerHTML = `
                <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
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

// Make functions globally available
window.navigateTo = navigateTo
window.toggleSidebar = toggleSidebar

// Online/Offline status monitoring
window.addEventListener('online', () => {
    isOnline = true
    console.log('🌐 Back online')
})

window.addEventListener('offline', () => {
    isOnline = false
    console.log('📡 Gone offline')
})

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp)

// Fallback initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp)
} else {
    initApp()
}