/**
 * Sidebar Component
 * Clean, reusable sidebar component
 */

export function renderSidebar(currentView) {
    return `
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
    `
}