/**
 * Main Layout Component
 * Handles the overall app layout structure
 */

export function createMainLayout(sidebarContent, mainContent) {
    return `
        <div class="flex h-screen bg-base-200">
            <!-- Sidebar -->
            <div class="sidebar bg-base-100 shadow-xl w-64 fixed h-full z-30 lg:relative lg:translate-x-0 transform -translate-x-full transition-transform duration-300 ease-in-out" id="sidebar">
                ${sidebarContent}
            </div>
            
            <!-- Sidebar Overlay for Mobile -->
            <div id="sidebar-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden hidden" onclick="toggleSidebar()"></div>
            
            <!-- Main Content Area -->
            <div class="flex-1 flex flex-col lg:ml-0">
                ${mainContent}
            </div>
        </div>
    `
}

export function createPageContent(content) {
    return `
        <div class="flex-1 overflow-auto">
            ${content}
        </div>
    `
}

export function createMobileHeader(title, icon) {
    return `
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
                    <span class="text-xl">${icon}</span>
                    <div class="text-lg font-bold text-gray-800">${title}</div>
                </div>
            </div>
        </div>
    `
}