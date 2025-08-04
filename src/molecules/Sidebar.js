export class Sidebar {
    constructor(onNavigate) {
        this.onNavigate = onNavigate
        this.currentView = 'dashboard'
        this.isCollapsed = false
        this.stats = {
            results: {
                totalKotor: 0,
                biayaBBM: 0,
                totalAdditionalCosts: 0,
                pendapatanBersih: 0,
            },
            fuel: {
                literTerpakai: 0,
                jarak: 0,
            },
        }
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
        // Only allow collapse on desktop
        if (window.innerWidth < 1024) {
            return
        }

        this.isCollapsed = !this.isCollapsed
        const sidebar = document.querySelector('.sidebar')
        const mainArea = document.querySelector('#main-area')

        if (sidebar) {
            if (this.isCollapsed) {
                sidebar.classList.add('sidebar-collapsed')
                if (mainArea) {
                    mainArea.classList.add('sidebar-collapsed')
                }
            } else {
                sidebar.classList.remove('sidebar-collapsed')
                if (mainArea) {
                    mainArea.classList.remove('sidebar-collapsed')
                }
            }
        }

        // Update stats visibility
        this.updateStatsVisibility()
    }

    updateStatsVisibility() {
        const statsElement = document.querySelector('#sidebar-stats')
        const quickActions = document.querySelector('.sidebar-actions')

        if (statsElement) {
            if (this.isCollapsed) {
                statsElement.style.display = 'none'
            } else {
                statsElement.style.display = 'block'
            }
        }

        if (quickActions) {
            if (this.isCollapsed) {
                quickActions.style.display = 'none'
            } else {
                quickActions.style.display = 'block'
            }
        }
    }

    render() {
        const container = document.createElement('div')
        container.className = `sidebar bg-base-100 border-r border-base-200 flex flex-col shadow-lg ${this.isCollapsed ? 'sidebar-collapsed' : ''}`

        container.innerHTML = `
            <!-- Sidebar Header -->
            <div class="sidebar-header p-6 border-b border-base-200">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3 ${this.isCollapsed ? 'hidden' : ''}">
                        <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                            <span class="text-xl text-white">📊</span>
                        </div>
                        <div>
                            <div class="font-bold text-xl text-base-content">RELI</div>
                            <div class="text-xs text-base-content/60">Driver Assistant Pro</div>
                        </div>
                    </div>
                    <button class="btn btn-ghost btn-sm collapse-btn" title="${this.isCollapsed ? 'Expand' : 'Collapse'}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${this.isCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Navigation Menu -->
            <div class="sidebar-content flex-1 p-4">
                <div class="space-y-2">
                    <div class="sidebar-item ${this.currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
                        <div class="w-5 h-5 flex items-center justify-center">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"></path>
                            </svg>
                        </div>
                        <span class="sidebar-text font-medium ${this.isCollapsed ? 'hidden' : ''}">Dashboard</span>
                    </div>
                    
                    <div class="sidebar-item ${this.currentView === 'input' ? 'active' : ''}" data-view="input">
                        <div class="w-5 h-5 flex items-center justify-center">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </div>
                        <span class="sidebar-text font-medium ${this.isCollapsed ? 'hidden' : ''}">Input Data</span>
                    </div>
                    
                    <div class="sidebar-item ${this.currentView === 'analytics' ? 'active' : ''}" data-view="analytics">
                        <div class="w-5 h-5 flex items-center justify-center">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                        </div>
                        <span class="sidebar-text font-medium ${this.isCollapsed ? 'hidden' : ''}">Analytics</span>
                    </div>
                    
                    <div class="sidebar-item ${this.currentView === 'optimizer' ? 'active' : ''}" data-view="optimizer">
                        <div class="w-5 h-5 flex items-center justify-center">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                        </div>
                        <span class="sidebar-text font-medium ${this.isCollapsed ? 'hidden' : ''}">Optimizer</span>
                    </div>
                    
                    <div class="sidebar-item ${this.currentView === 'location' ? 'active' : ''}" data-view="location">
                        <div class="w-5 h-5 flex items-center justify-center">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </div>
                        <span class="sidebar-text font-medium ${this.isCollapsed ? 'hidden' : ''}">Location</span>
                    </div>
                    
                    <div class="sidebar-item ${this.currentView === 'notifications' ? 'active' : ''}" data-view="notifications">
                        <div class="w-5 h-5 flex items-center justify-center">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.868 19.504A8.966 8.966 0 003 12a9 9 0 0118 0 8.966 8.966 0 00-1.868 7.504"></path>
                            </svg>
                        </div>
                        <span class="sidebar-text font-medium ${this.isCollapsed ? 'hidden' : ''}">Notifications</span>
                    </div>
                    
                    <div class="sidebar-item ${this.currentView === 'automation' ? 'active' : ''}" data-view="automation">
                        <div class="w-5 h-5 flex items-center justify-center">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </div>
                        <span class="sidebar-text font-medium ${this.isCollapsed ? 'hidden' : ''}">Automation</span>
                    </div>
                </div>

                <!-- Quick Stats Section -->
                <div class="mt-8 ${this.isCollapsed ? 'hidden' : ''}">
                    <div class="text-xs font-semibold mb-3 text-base-content/60 uppercase tracking-wider">Quick Stats</div>
                    <div id="sidebar-stats">
                        <div class="space-y-3">
                            <div class="bg-success/10 rounded-lg p-3">
                                <div class="text-xs text-success font-medium mb-1">Pendapatan Bersih</div>
                                <div class="text-lg font-bold text-success">Rp ${this.formatCurrency(this.stats.results.pendapatanBersih)}</div>
                            </div>
                            <div class="bg-primary/10 rounded-lg p-3">
                                <div class="text-xs text-primary font-medium mb-1">Total Kotor</div>
                                <div class="text-sm font-semibold text-primary">Rp ${this.formatCurrency(this.stats.results.totalKotor)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="sidebar-actions ${this.isCollapsed ? 'hidden' : ''} mt-6">
                    <div class="text-xs font-semibold mb-3 text-base-content/60 uppercase tracking-wider">Quick Actions</div>
                    <div class="space-y-2">
                        <button class="btn btn-sm btn-primary w-full quick-calculate">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                            Calculate
                        </button>
                        <button class="btn btn-sm btn-secondary w-full quick-whatsapp">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                            WhatsApp
                        </button>
                        <button class="btn btn-sm btn-accent w-full quick-export">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Export
                        </button>
                    </div>
                </div>
            </div>

            <!-- User Profile -->
            <div class="sidebar-footer p-4 border-t border-base-200">
                <div class="flex items-center gap-3 ${this.isCollapsed ? 'justify-center' : ''}">
                    <div class="w-8 h-8 bg-gradient-to-br from-neutral to-neutral-focus rounded-full flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    </div>
                    <div class="sidebar-text ${this.isCollapsed ? 'hidden' : ''}">
                        <div class="font-medium text-sm text-base-content">Driver</div>
                        <div class="text-xs text-success flex items-center gap-1">
                            <div class="w-2 h-2 bg-success rounded-full"></div>
                            Online
                        </div>
                    </div>
                </div>
            </div>
        `

        // Add event listeners
        setTimeout(() => {
            try {
                // Navigation items
                container.querySelectorAll('.sidebar-item').forEach(item => {
                    item.addEventListener('click', e => {
                        e.preventDefault()
                        e.stopPropagation()

                        const view = e.target.closest('.sidebar-item').dataset.view
                        if (view && this.onNavigate) {
                            this.onNavigate(view)

                            // Close mobile sidebar after navigation
                            if (window.innerWidth < 1024) {
                                const sidebar = document.querySelector('.sidebar')
                                const overlay = document.querySelector('.sidebar-overlay')

                                if (sidebar && overlay) {
                                    sidebar.classList.remove('sidebar-open')
                                    overlay.classList.remove('show')
                                    document.body.style.overflow = ''
                                }
                            }
                        }
                    })
                })

                // Collapse button
                const collapseBtn = container.querySelector('.collapse-btn')
                if (collapseBtn) {
                    collapseBtn.addEventListener('click', e => {
                        e.preventDefault()
                        e.stopPropagation()
                        this.toggleCollapse()
                    })
                }

                // Quick action buttons
                const quickCalculate = container.querySelector('.quick-calculate')
                const quickWhatsapp = container.querySelector('.quick-whatsapp')
                const quickExport = container.querySelector('.quick-export')

                if (quickCalculate) {
                    quickCalculate.addEventListener('click', e => {
                        e.preventDefault()
                        document.dispatchEvent(new CustomEvent('reli-auto-calculate'))
                    })
                }

                if (quickWhatsapp) {
                    quickWhatsapp.addEventListener('click', e => {
                        e.preventDefault()
                        document.dispatchEvent(new CustomEvent('reli-whatsapp-export'))
                    })
                }

                if (quickExport) {
                    quickExport.addEventListener('click', e => {
                        e.preventDefault()
                        document.dispatchEvent(new CustomEvent('reli-csv-export'))
                    })
                }
            } catch (error) {
                console.warn('Sidebar event listeners setup failed:', error)
            }
        }, 0)

        return container
    }

    updateStats(data) {
        this.stats = data
        const statsElement = document.querySelector('#sidebar-stats')
        if (statsElement && !this.isCollapsed) {
            const earnings = data.results?.pendapatanBersih || 0
            const totalKotor = data.results?.totalKotor || 0

            statsElement.innerHTML = `
                <div class="space-y-3">
                    <div class="bg-success/10 rounded-lg p-3">
                        <div class="text-xs text-success font-medium mb-1">Pendapatan Bersih</div>
                        <div class="text-lg font-bold text-success">Rp ${this.formatCurrency(earnings)}</div>
                    </div>
                    <div class="bg-primary/10 rounded-lg p-3">
                        <div class="text-xs text-primary font-medium mb-1">Total Kotor</div>
                        <div class="text-sm font-semibold text-primary">Rp ${this.formatCurrency(totalKotor)}</div>
                    </div>
                </div>
            `
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID').format(Math.round(amount))
    }
}
