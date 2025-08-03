export class Sidebar {
    constructor(onNavigate) {
        this.onNavigate = onNavigate
        this.currentView = 'dashboard'
        this.isCollapsed = false
    }

    setCurrentView(view) {
        this.currentView = view
        this.updateActiveState()
    }

    updateActiveState() {
        const sidebar = document.querySelector('.sidebar')
        if (sidebar) {
            sidebar.querySelectorAll('.sidebar-item').forEach(item => {
                const view = item.dataset.view
                if (view === this.currentView) {
                    item.classList.add('active')
                } else {
                    item.classList.remove('active')
                }
            })
        }
    }

    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed
        const sidebar = document.querySelector('.sidebar')
        if (sidebar) {
            if (this.isCollapsed) {
                sidebar.classList.add('sidebar-collapsed')
            } else {
                sidebar.classList.remove('sidebar-collapsed')
            }
        }
    }

    render() {
        const container = document.createElement('div')
        container.className = `sidebar bg-base-200 shadow-xl transition-all duration-300 ${this.isCollapsed ? 'sidebar-collapsed' : ''}`

        container.innerHTML = `
            <div class="sidebar-header p-4 border-b border-base-300">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3 ${this.isCollapsed ? 'hidden' : ''}">
                        <span class="text-2xl">📊</span>
                        <div>
                            <div class="font-bold text-lg">RELI</div>
                            <div class="text-xs opacity-70">Driver Assistant</div>
                        </div>
                    </div>
                    <button class="btn btn-ghost btn-sm collapse-btn" title="${this.isCollapsed ? 'Expand' : 'Collapse'}">
                        ${this.isCollapsed ? '→' : '←'}
                    </button>
                </div>
            </div>

            <div class="sidebar-content p-2">
                <ul class="menu menu-vertical gap-1">
                    <li>
                        <a class="sidebar-item ${this.currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
                            <span class="text-xl">🏠</span>
                            <span class="sidebar-text ${this.isCollapsed ? 'hidden' : ''}">Dashboard</span>
                        </a>
                    </li>
                    <li>
                        <a class="sidebar-item ${this.currentView === 'input' ? 'active' : ''}" data-view="input">
                            <span class="text-xl">📝</span>
                            <span class="sidebar-text ${this.isCollapsed ? 'hidden' : ''}">Input Data</span>
                        </a>
                    </li>
                    <li>
                        <a class="sidebar-item ${this.currentView === 'analytics' ? 'active' : ''}" data-view="analytics">
                            <span class="text-xl">📊</span>
                            <span class="sidebar-text ${this.isCollapsed ? 'hidden' : ''}">Analytics</span>
                        </a>
                    </li>
                    <li>
                        <a class="sidebar-item ${this.currentView === 'optimizer' ? 'active' : ''}" data-view="optimizer">
                            <span class="text-xl">🚀</span>
                            <span class="sidebar-text ${this.isCollapsed ? 'hidden' : ''}">Optimizer</span>
                        </a>
                    </li>
                    <li>
                        <a class="sidebar-item ${this.currentView === 'location' ? 'active' : ''}" data-view="location">
                            <span class="text-xl">📍</span>
                            <span class="sidebar-text ${this.isCollapsed ? 'hidden' : ''}">Location</span>
                        </a>
                    </li>
                    <li>
                        <a class="sidebar-item ${this.currentView === 'notifications' ? 'active' : ''}" data-view="notifications">
                            <span class="text-xl">🔔</span>
                            <span class="sidebar-text ${this.isCollapsed ? 'hidden' : ''}">Notifications</span>
                        </a>
                    </li>
                    <li>
                        <a class="sidebar-item ${this.currentView === 'automation' ? 'active' : ''}" data-view="automation">
                            <span class="text-xl">🤖</span>
                            <span class="sidebar-text ${this.isCollapsed ? 'hidden' : ''}">Automation</span>
                        </a>
                    </li>
                </ul>

                <div class="divider ${this.isCollapsed ? 'hidden' : ''}"></div>

                <!-- Quick Stats -->
                <div class="sidebar-stats ${this.isCollapsed ? 'hidden' : ''} p-3 bg-base-100 rounded-lg">
                    <div class="text-xs font-semibold mb-2">Today's Summary</div>
                    <div class="space-y-1 text-xs">
                        <div class="flex justify-between">
                            <span>Earnings:</span>
                            <span class="font-semibold text-success">Rp 0</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Distance:</span>
                            <span class="font-semibold">0 km</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Efficiency:</span>
                            <span class="font-semibold">0 km/L</span>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="sidebar-actions ${this.isCollapsed ? 'hidden' : ''} mt-4">
                    <div class="text-xs font-semibold mb-2 px-3">Quick Actions</div>
                    <div class="space-y-1">
                        <button class="btn btn-sm btn-primary w-full quick-calculate">
                            💰 Calculate
                        </button>
                        <button class="btn btn-sm btn-secondary w-full quick-whatsapp">
                            📱 WhatsApp
                        </button>
                        <button class="btn btn-sm btn-accent w-full quick-export">
                            📊 Export
                        </button>
                    </div>
                </div>
            </div>

            <div class="sidebar-footer p-4 border-t border-base-300 mt-auto">
                <div class="flex items-center gap-2 ${this.isCollapsed ? 'justify-center' : ''}">
                    <div class="badge badge-success badge-sm">Online</div>
                    <div class="text-xs opacity-70 ${this.isCollapsed ? 'hidden' : ''}">${new Date().toLocaleDateString('id-ID')}</div>
                </div>
            </div>
        `

        // Add event listeners
        setTimeout(() => {
            // Navigation items
            container.querySelectorAll('.sidebar-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault()
                    const view = e.target.closest('.sidebar-item').dataset.view
                    if (view && this.onNavigate) {
                        this.onNavigate(view)
                    }
                })
            })

            // Collapse button
            const collapseBtn = container.querySelector('.collapse-btn')
            if (collapseBtn) {
                collapseBtn.addEventListener('click', () => {
                    this.toggleCollapse()
                })
            }

            // Quick action buttons
            const quickCalculate = container.querySelector('.quick-calculate')
            const quickWhatsapp = container.querySelector('.quick-whatsapp')
            const quickExport = container.querySelector('.quick-export')

            if (quickCalculate) {
                quickCalculate.addEventListener('click', () => {
                    document.dispatchEvent(new CustomEvent('reli-auto-calculate'))
                })
            }

            if (quickWhatsapp) {
                quickWhatsapp.addEventListener('click', () => {
                    document.dispatchEvent(new CustomEvent('reli-whatsapp-export'))
                })
            }

            if (quickExport) {
                quickExport.addEventListener('click', () => {
                    document.dispatchEvent(new CustomEvent('reli-csv-export'))
                })
            }
        }, 0)

        return container
    }

    updateStats(data) {
        const statsElement = document.querySelector('.sidebar-stats')
        if (statsElement && !this.isCollapsed) {
            const earnings = data.results?.pendapatanBersih || 0
            const distance = data.fuel?.jarak || 0
            const efficiency = distance > 0 && data.fuel?.literTerpakai > 0 ? 
                (distance / data.fuel.literTerpakai).toFixed(1) : 0

            statsElement.innerHTML = `
                <div class="text-xs font-semibold mb-2">Today's Summary</div>
                <div class="space-y-1 text-xs">
                    <div class="flex justify-between">
                        <span>Earnings:</span>
                        <span class="font-semibold text-success">Rp ${this.formatCurrency(earnings)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Distance:</span>
                        <span class="font-semibold">${distance} km</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Efficiency:</span>
                        <span class="font-semibold">${efficiency} km/L</span>
                    </div>
                </div>
            `
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID').format(Math.round(amount))
    }
}