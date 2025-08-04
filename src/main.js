import { Dashboard } from './organisms/Dashboard.js'

// Initialize Dashboard with error handling
document.addEventListener('DOMContentLoaded', () => {
    try {
        const dashboard = new Dashboard()
        const appElement = document.getElementById('app')

        if (appElement) {
            appElement.appendChild(dashboard.render())

            // Trigger loading screen hide
            setTimeout(() => {
                const loadingScreen = document.getElementById('loading-screen')
                if (loadingScreen) {
                    loadingScreen.style.opacity = '0'
                    loadingScreen.style.transition = 'opacity 0.3s ease-out'
                    setTimeout(() => {
                        loadingScreen.style.display = 'none'
                    }, 300)
                }
            }, 500)
        } else {
            console.error('App element not found')
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error)

        // Show error message instead of loading screen
        const appElement = document.getElementById('app')
        const loadingScreen = document.getElementById('loading-screen')

        if (loadingScreen) {
            loadingScreen.style.display = 'none'
        }

        if (appElement) {
            appElement.innerHTML = `
                <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
                    <div class="card bg-base-100 shadow-xl max-w-md w-full">
                        <div class="card-body text-center">
                            <h2 class="card-title text-error justify-center">⚠️ Error Loading App</h2>
                            <p class="text-sm">There was an error loading the application. Please refresh the page.</p>
                            <div class="text-xs text-base-content/60 mt-2">Error: ${error.message}</div>
                            <div class="card-actions justify-center mt-4">
                                <button class="btn btn-primary btn-sm" onclick="window.location.reload()">
                                    🔄 Refresh Page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `
        }
    }
})
