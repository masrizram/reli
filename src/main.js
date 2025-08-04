import { Dashboard } from './organisms/Dashboard.js'

// Initialize Dashboard with error handling
try {
    const dashboard = new Dashboard()
    const appElement = document.getElementById('app')
    
    if (appElement) {
        appElement.appendChild(dashboard.render())
        
        // Trigger loading screen hide
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen')
            if (loadingScreen) {
                loadingScreen.style.display = 'none'
            }
        }, 100)
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
            <div class="min-h-screen bg-base-200 flex items-center justify-center">
                <div class="card bg-base-100 shadow-xl max-w-md">
                    <div class="card-body text-center">
                        <h2 class="card-title text-error">⚠️ Error Loading App</h2>
                        <p>There was an error loading the application. Please refresh the page.</p>
                        <div class="card-actions justify-center">
                            <button class="btn btn-primary" onclick="window.location.reload()">
                                🔄 Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
}
