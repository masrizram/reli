export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('./sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration)
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError)
                })
        })
    }
}

export function installPrompt() {
    let deferredPrompt

    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault()
        deferredPrompt = e

        // Show install button
        const installBtn = document.getElementById('install-btn')
        if (installBtn) {
            installBtn.style.display = 'block'
            installBtn.addEventListener('click', () => {
                deferredPrompt.prompt()
                deferredPrompt.userChoice.then(choiceResult => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt')
                    }
                    deferredPrompt = null
                })
            })
        }
    })
}
