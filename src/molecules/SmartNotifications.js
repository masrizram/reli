import { Label } from '../atoms/Label.js'

export class SmartNotifications {
    constructor(onSettingsUpdate) {
        try {
            this.onSettingsUpdate = onSettingsUpdate
            this.settings = this.loadSettings()
            this.initNotificationSystem()
            console.log('SmartNotifications initialized successfully')
        } catch (error) {
            console.error('Error initializing SmartNotifications:', error)
            // Fallback settings
            this.settings = {
                dailyReminder: { enabled: true, time: '08:00' },
                lowFuelWarning: { enabled: true, threshold: 20000 },
                maintenanceReminder: { enabled: true, kmInterval: 5000 },
                bestTimeNotification: { enabled: true },
                weatherRecommendation: { enabled: false },
            }
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('reli-notifications')
            return saved
                ? JSON.parse(saved)
                : {
                      dailyReminder: { enabled: true, time: '08:00' },
                      lowFuelWarning: { enabled: true, threshold: 20000 },
                      maintenanceReminder: { enabled: true, kmInterval: 5000 },
                      bestTimeNotification: { enabled: true },
                      weatherRecommendation: { enabled: false },
                  }
        } catch (error) {
            console.error('Error loading settings:', error)
            return {
                dailyReminder: { enabled: true, time: '08:00' },
                lowFuelWarning: { enabled: true, threshold: 20000 },
                maintenanceReminder: { enabled: true, kmInterval: 5000 },
                bestTimeNotification: { enabled: true },
                weatherRecommendation: { enabled: false },
            }
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('reli-notifications', JSON.stringify(this.settings))
            console.log('Settings saved to localStorage:', this.settings)
            if (this.onSettingsUpdate && typeof this.onSettingsUpdate === 'function') {
                this.onSettingsUpdate(this.settings)
            }
        } catch (error) {
            console.error('Error saving settings:', error)
        }
    }

    async initNotificationSystem() {
        try {
            // Request notification permission
            if ('Notification' in window && Notification.permission === 'default') {
                const permission = await Notification.requestPermission()
                console.log('Notification permission:', permission)
            }

            this.scheduleNotifications()
        } catch (error) {
            console.error('Error initializing notification system:', error)
        }
    }

    scheduleNotifications() {
        try {
            console.log('Scheduling notifications with settings:', this.settings)

            // Daily reminder
            if (this.settings.dailyReminder && this.settings.dailyReminder.enabled) {
                this.scheduleDailyReminder()
            }

            // Check for maintenance reminder
            if (this.settings.maintenanceReminder && this.settings.maintenanceReminder.enabled) {
                this.checkMaintenanceReminder()
            }

            // Best time notification (check every hour)
            if (this.settings.bestTimeNotification && this.settings.bestTimeNotification.enabled) {
                this.scheduleBestTimeCheck()
            }
        } catch (error) {
            console.error('Error scheduling notifications:', error)
        }
    }

    scheduleDailyReminder() {
        try {
            if (!this.settings.dailyReminder || !this.settings.dailyReminder.time) {
                console.log('Daily reminder settings not available')
                return
            }

            const now = new Date()
            const [hours, minutes] = this.settings.dailyReminder.time.split(':')
            const reminderTime = new Date()
            reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

            // If time has passed today, schedule for tomorrow
            if (reminderTime <= now) {
                reminderTime.setDate(reminderTime.getDate() + 1)
            }

            const timeUntilReminder = reminderTime.getTime() - now.getTime()
            console.log('Daily reminder scheduled for:', reminderTime, 'in', timeUntilReminder, 'ms')

            setTimeout(() => {
                this.showNotification(
                    '📊 RELI - Reminder Harian',
                    'Jangan lupa input data pendapatan hari ini!',
                    'daily-reminder'
                )
                // Schedule next day
                this.scheduleDailyReminder()
            }, timeUntilReminder)
        } catch (error) {
            console.error('Error scheduling daily reminder:', error)
        }
    }

    checkLowFuelWarning(currentBalance) {
        try {
            if (!this.settings || !this.settings.lowFuelWarning) {
                console.log('Low fuel warning settings not available')
                return
            }

            if (this.settings.lowFuelWarning.enabled && currentBalance < this.settings.lowFuelWarning.threshold) {
                console.log('Low fuel warning triggered:', currentBalance, 'vs', this.settings.lowFuelWarning.threshold)
                this.showNotification(
                    '⛽ RELI - Peringatan BBM',
                    `Saldo BBM rendah: Rp ${this.formatCurrency(currentBalance)}. Pertimbangkan untuk isi ulang.`,
                    'low-fuel'
                )
            }
        } catch (error) {
            console.error('Error checking low fuel warning:', error)
        }
    }

    checkMaintenanceReminder() {
        const storageData = JSON.parse(localStorage.getItem('reli-data') || '{}')
        const dates = Object.keys(storageData).sort()

        if (dates.length === 0) return

        let totalKm = 0
        dates.forEach(date => {
            totalKm += storageData[date].fuel?.jarak || 0
        })

        const lastMaintenance = parseInt(localStorage.getItem('reli-last-maintenance-km') || '0')
        const kmSinceMaintenance = totalKm - lastMaintenance

        if (kmSinceMaintenance >= this.settings.maintenanceReminder.kmInterval) {
            this.showNotification(
                '🔧 RELI - Reminder Maintenance',
                `Sudah ${kmSinceMaintenance} km sejak maintenance terakhir. Saatnya service motor!`,
                'maintenance'
            )
        }
    }

    scheduleBestTimeCheck() {
        try {
            // Check every hour for best time recommendations
            console.log('Scheduling best time check')
            setInterval(
                () => {
                    this.checkBestTimeToWork()
                },
                60 * 60 * 1000
            ) // 1 hour
        } catch (error) {
            console.error('Error scheduling best time check:', error)
        }
    }

    checkBestTimeToWork() {
        const hour = new Date().getHours()
        const day = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.

        // Peak hours recommendations
        const peakHours = {
            weekday: [7, 8, 12, 13, 17, 18, 19], // 7-8 AM, 12-1 PM, 5-7 PM
            weekend: [10, 11, 12, 18, 19, 20], // 10 AM-12 PM, 6-8 PM
        }

        const isWeekend = day === 0 || day === 6
        const currentPeakHours = isWeekend ? peakHours.weekend : peakHours.weekday

        if (currentPeakHours.includes(hour)) {
            this.showLocationAwareNotification(
                '🚀 RELI - Waktu Optimal',
                `Ini waktu peak hour! Peluang order tinggi. Yuk mulai kerja!`,
                'best-time',
                'hotspot'
            )
        }
    }

    showLocationAwareNotification(title, body, tag, actionType = null) {
        // Show regular notification first
        this.showNotification(title, body, tag)

        // Add location-based action if available
        if (actionType && 'geolocation' in navigator) {
            setTimeout(() => {
                this.showLocationActionNotification(title, body, actionType)
            }, 2000)
        }
    }

    showLocationActionNotification(title, body, actionType) {
        // Remove any existing location notifications
        const existing = document.querySelectorAll('.reli-location-notification')
        existing.forEach(n => n.remove())

        const notification = document.createElement('div')
        notification.className =
            'reli-location-notification alert alert-success shadow-lg fixed top-20 right-4 z-50 max-w-sm'
        notification.style.cssText = `
            animation: slideInRight 0.3s ease-out;
            z-index: 9998;
        `

        let actionButton = ''
        let actionText = ''

        switch (actionType) {
            case 'hotspot':
                actionButton = `<button class="btn btn-xs btn-primary maps-action" data-action="hotspot">🗺️ Lihat Hotspot</button>`
                actionText = 'Cek area hotspot terdekat?'
                break
            case 'fuel':
                actionButton = `<button class="btn btn-xs btn-warning maps-action" data-action="fuel">⛽ Cari SPBU</button>`
                actionText = 'Cari SPBU terdekat?'
                break
            case 'parking':
                actionButton = `<button class="btn btn-xs btn-info maps-action" data-action="parking">🅿️ Cari Parkir</button>`
                actionText = 'Cari tempat parkir?'
                break
        }

        notification.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="text-2xl">📍</div>
                <div class="flex-1">
                    <div class="text-xs font-medium">${actionText}</div>
                    <div class="flex gap-2 mt-2">
                        ${actionButton}
                        <button class="btn btn-xs btn-ghost" onclick="this.closest('.reli-location-notification').remove()">Nanti</button>
                    </div>
                </div>
                <button class="btn btn-sm btn-circle btn-ghost" onclick="this.closest('.reli-location-notification').remove()">✕</button>
            </div>
        `

        document.body.appendChild(notification)

        // Add event listener for maps action
        const mapsBtn = notification.querySelector('.maps-action')
        if (mapsBtn) {
            mapsBtn.onclick = () => {
                this.handleMapsAction(mapsBtn.dataset.action)
                notification.remove()
            }
        }

        // Auto remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-in'
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove()
                    }
                }, 300)
            }
        }, 10000)
    }

    handleMapsAction(action) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude
                const lng = position.coords.longitude
                let mapsUrl = ''

                switch (action) {
                    case 'hotspot':
                        // Open maps showing current location for hotspot analysis
                        mapsUrl = `https://www.google.com/maps/@${lat},${lng},15z`
                        break
                    case 'fuel':
                        mapsUrl = `https://www.google.com/maps/search/SPBU/@${lat},${lng},15z`
                        break
                    case 'parking':
                        mapsUrl = `https://www.google.com/maps/search/parkir/@${lat},${lng},15z`
                        break
                }

                if (mapsUrl) {
                    window.open(mapsUrl, '_blank')
                    this.showInAppNotification('🗺️ Maps Dibuka', `Google Maps dibuka untuk: ${action}`)
                }
            },
            error => {
                console.error('Geolocation error:', error)
                // Fallback to general search
                let query = ''
                switch (action) {
                    case 'fuel':
                        query = 'SPBU'
                        break
                    case 'parking':
                        query = 'parkir'
                        break
                    default:
                        query = 'lokasi saya'
                }
                const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`
                window.open(mapsUrl, '_blank')
            }
        )
    }

    async checkWeatherRecommendation() {
        if (!this.settings.weatherRecommendation.enabled) return

        try {
            // Simple weather check (you can integrate with weather API)
            const hour = new Date().getHours()

            // Basic rain prediction based on time patterns
            if (hour >= 14 && hour <= 17) {
                // 2-5 PM typical rain time
                this.showNotification(
                    '🌧️ RELI - Info Cuaca',
                    'Sore hari biasanya hujan. Siapkan jas hujan dan hati-hati di jalan!',
                    'weather'
                )
            }
        } catch (error) {
            console.log('Weather check failed:', error)
        }
    }

    showNotification(title, body, tag) {
        try {
            console.log('Attempting to show notification:', title)

            // Always show in-app notification as primary method
            this.showInAppNotification(title, body)

            // Also try native notification as secondary
            if ('Notification' in window && Notification.permission === 'granted') {
                try {
                    const notification = new Notification(title, {
                        body,
                        tag,
                        requireInteraction: false,
                        silent: false,
                    })

                    notification.onshow = () => {
                        console.log('Native notification also displayed:', title)
                    }

                    notification.onclick = () => {
                        window.focus()
                        notification.close()
                    }

                    setTimeout(() => {
                        try {
                            notification.close()
                        } catch (e) {
                            // Ignore close errors
                        }
                    }, 8000)
                } catch (error) {
                    console.error('Native notification error:', error)
                }
            }
        } catch (error) {
            console.error('Error showing notification:', error)
        }
    }

    showInAppNotification(title, body) {
        // Remove any existing notifications first
        const existing = document.querySelectorAll('.reli-notification')
        existing.forEach(n => n.remove())

        // Create in-app notification element
        const notification = document.createElement('div')
        notification.className = 'reli-notification alert alert-info shadow-lg fixed top-4 right-4 z-50 max-w-sm'
        notification.style.cssText = `
            animation: slideInRight 0.3s ease-out;
            z-index: 9999;
        `
        notification.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="text-2xl">🔔</div>
                <div class="flex-1">
                    <h3 class="font-bold text-sm">${title}</h3>
                    <div class="text-xs mt-1">${body}</div>
                </div>
                <button class="btn btn-sm btn-circle btn-ghost ml-2" onclick="this.closest('.reli-notification').remove()">✕</button>
            </div>
        `

        // Add CSS animation if not exists
        if (!document.querySelector('#reli-notification-styles')) {
            const style = document.createElement('style')
            style.id = 'reli-notification-styles'
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .reli-notification {
                    max-width: 350px;
                    word-wrap: break-word;
                }
            `
            document.head.appendChild(style)
        }

        document.body.appendChild(notification)

        // Auto remove after 6 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-in'
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove()
                    }
                }, 300)
            }
        }, 6000)

        console.log('In-app notification shown:', title)
    }

    markMaintenanceDone() {
        try {
            const storageData = JSON.parse(localStorage.getItem('reli-data') || '{}')
            const dates = Object.keys(storageData).sort()

            let totalKm = 0
            dates.forEach(date => {
                if (storageData[date] && storageData[date].fuel) {
                    totalKm += storageData[date].fuel.jarak || 0
                }
            })

            localStorage.setItem('reli-last-maintenance-km', totalKm.toString())

            console.log('Maintenance marked at:', totalKm, 'km')
            alert(
                '✅ Maintenance berhasil dicatat! Reminder berikutnya dalam ' +
                    this.settings.maintenanceReminder.kmInterval +
                    ' km.'
            )

            // Try to show notification if possible
            if ('Notification' in window && Notification.permission === 'granted') {
                this.showNotification(
                    '✅ RELI - Maintenance',
                    'Maintenance berhasil dicatat. Reminder berikutnya dalam ' +
                        this.settings.maintenanceReminder.kmInterval +
                        ' km.',
                    'maintenance-done'
                )
            }
        } catch (error) {
            console.error('Error marking maintenance:', error)
            alert('❌ Gagal mencatat maintenance. Coba lagi.')
        }
    }

    checkNotificationStatus() {
        const status = {
            supported: 'Notification' in window,
            permission: Notification.permission,
            platform: navigator.platform,
            userAgent: navigator.userAgent.substring(0, 50) + '...',
        }

        console.log('Notification Status:', status)

        let message = `📋 STATUS NOTIFIKASI:\n\n`
        message += `✅ Browser Support: ${status.supported ? 'Ya' : 'Tidak'}\n`
        message += `🔐 Permission: ${status.permission}\n`
        message += `💻 Platform: ${status.platform}\n\n`

        if (!status.supported) {
            message += `❌ Browser tidak mendukung notifikasi`
        } else if (status.permission === 'denied') {
            message += `❌ NOTIFIKASI DIBLOKIR\n\n`
            message += `🔧 Cara mengaktifkan:\n`
            if (status.platform.toUpperCase().includes('MAC')) {
                message += `• Buka System Preferences > Notifications\n`
                message += `• Cari Brave/Chrome/Safari\n`
                message += `• Aktifkan "Allow Notifications"\n`
                message += `• Refresh halaman ini`
            } else {
                message += `• Klik ikon gembok di address bar\n`
                message += `• Pilih "Allow" untuk notifications\n`
                message += `• Refresh halaman ini`
            }
        } else if (status.permission === 'granted') {
            message += `✅ NOTIFIKASI AKTIF\n\n`
            message += `💡 Jika notifikasi tidak muncul:\n`
            if (status.platform.toUpperCase().includes('MAC')) {
                message += `• Cek "Do Not Disturb" tidak aktif\n`
                message += `• Cek System Preferences > Notifications\n`
                message += `• Pastikan "Banners" atau "Alerts" dipilih`
            } else {
                message += `• Cek Windows notification settings\n`
                message += `• Pastikan browser notifications aktif`
            }
        } else {
            message += `⚠️ Permission belum diminta\n`
            message += `Klik "Test Notifikasi" untuk meminta permission`
        }

        alert(message)
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID').format(amount)
    }

    render() {
        const container = document.createElement('div')
        container.className = 'card bg-base-200 p-4 mb-4'

        const titleLabel = new Label('Smart Notifications', '🔔')
        container.appendChild(titleLabel.render())

        // Notification settings
        const settingsContainer = document.createElement('div')
        settingsContainer.className = 'mt-4'
        settingsContainer.style.display = 'flex'
        settingsContainer.style.flexDirection = 'column'
        settingsContainer.style.gap = '12px'

        // Daily reminder setting
        const dailyReminderDiv = document.createElement('div')
        dailyReminderDiv.className = 'flex items-center justify-between p-3 bg-base-100 rounded-lg'
        dailyReminderDiv.innerHTML = `
            <div>
                <div class="font-medium">📅 Daily Reminder</div>
                <div class="text-sm opacity-70">Pengingat input data harian</div>
            </div>
            <div class="flex items-center gap-2">
                <input type="time" value="${this.settings.dailyReminder.time}" 
                       class="input input-sm input-bordered" data-setting="daily-time">
                <input type="checkbox" ${this.settings.dailyReminder.enabled ? 'checked' : ''} 
                       class="toggle toggle-primary" data-setting="daily-toggle">
            </div>
        `
        settingsContainer.appendChild(dailyReminderDiv)

        // Low fuel warning setting
        const lowFuelDiv = document.createElement('div')
        lowFuelDiv.className = 'flex items-center justify-between p-3 bg-base-100 rounded-lg'
        lowFuelDiv.innerHTML = `
            <div>
                <div class="font-medium">⛽ Low Fuel Warning</div>
                <div class="text-sm opacity-70">Peringatan saldo BBM rendah</div>
            </div>
            <div class="flex items-center gap-2">
                <input type="number" value="${this.settings.lowFuelWarning.threshold}" 
                       class="input input-sm input-bordered w-24" data-setting="fuel-threshold" placeholder="20000">
                <input type="checkbox" ${this.settings.lowFuelWarning.enabled ? 'checked' : ''} 
                       class="toggle toggle-primary" data-setting="fuel-toggle">
            </div>
        `
        settingsContainer.appendChild(lowFuelDiv)

        // Maintenance reminder setting
        const maintenanceDiv = document.createElement('div')
        maintenanceDiv.className = 'flex items-center justify-between p-3 bg-base-100 rounded-lg'
        maintenanceDiv.innerHTML = `
            <div>
                <div class="font-medium">🔧 Maintenance Reminder</div>
                <div class="text-sm opacity-70">Pengingat service motor</div>
            </div>
            <div class="flex items-center gap-2">
                <input type="number" value="${this.settings.maintenanceReminder.kmInterval}" 
                       class="input input-sm input-bordered w-20" data-setting="maintenance-km" placeholder="5000">
                <span class="text-xs">km</span>
                <input type="checkbox" ${this.settings.maintenanceReminder.enabled ? 'checked' : ''} 
                       class="toggle toggle-primary" data-setting="maintenance-toggle">
            </div>
        `
        settingsContainer.appendChild(maintenanceDiv)

        // Best time notification setting
        const bestTimeDiv = document.createElement('div')
        bestTimeDiv.className = 'flex items-center justify-between p-3 bg-base-100 rounded-lg'
        bestTimeDiv.innerHTML = `
            <div>
                <div class="font-medium">🚀 Best Time Notification</div>
                <div class="text-sm opacity-70">Notifikasi waktu optimal kerja</div>
            </div>
            <input type="checkbox" ${this.settings.bestTimeNotification.enabled ? 'checked' : ''} 
                   class="toggle toggle-primary" data-setting="besttime-toggle">
        `
        settingsContainer.appendChild(bestTimeDiv)

        // Weather recommendation setting
        const weatherDiv = document.createElement('div')
        weatherDiv.className = 'flex items-center justify-between p-3 bg-base-100 rounded-lg'
        weatherDiv.innerHTML = `
            <div>
                <div class="font-medium">🌧️ Weather Recommendation</div>
                <div class="text-sm opacity-70">Rekomendasi berdasarkan cuaca</div>
            </div>
            <input type="checkbox" ${this.settings.weatherRecommendation.enabled ? 'checked' : ''} 
                   class="toggle toggle-primary" data-setting="weather-toggle">
        `
        settingsContainer.appendChild(weatherDiv)

        container.appendChild(settingsContainer)

        // Action buttons
        const buttonContainer = document.createElement('div')
        buttonContainer.className = 'mt-4'
        buttonContainer.style.display = 'flex'
        buttonContainer.style.flexWrap = 'wrap'
        buttonContainer.style.gap = '8px'

        // Create buttons with proper event handlers
        const saveButton = document.createElement('button')
        saveButton.className = 'btn btn-primary'
        saveButton.innerHTML = '💾 Simpan Pengaturan'
        saveButton.style.minWidth = '120px'
        saveButton.addEventListener('click', e => {
            e.preventDefault()
            console.log('Save button clicked')
            this.saveCurrentSettings(container)
        })

        const testButton = document.createElement('button')
        testButton.className = 'btn btn-secondary'
        testButton.innerHTML = '🔔 Test Notifikasi'
        testButton.style.minWidth = '120px'
        testButton.addEventListener('click', e => {
            e.preventDefault()
            console.log('Test button clicked')
            this.testNotification()
        })

        const statusButton = document.createElement('button')
        statusButton.className = 'btn btn-info btn-sm'
        statusButton.innerHTML = '📋 Cek Status'
        statusButton.style.minWidth = '100px'
        statusButton.addEventListener('click', e => {
            e.preventDefault()
            this.checkNotificationStatus()
        })

        const maintenanceButton = document.createElement('button')
        maintenanceButton.className = 'btn btn-accent'
        maintenanceButton.innerHTML = '🔧 Tandai Maintenance'
        maintenanceButton.style.minWidth = '120px'
        maintenanceButton.addEventListener('click', e => {
            e.preventDefault()
            console.log('Maintenance button clicked')
            this.markMaintenanceDone()
        })

        const quickMapsButton = document.createElement('button')
        quickMapsButton.className = 'btn btn-success btn-sm'
        quickMapsButton.innerHTML = '🗺️ Quick Maps'
        quickMapsButton.style.minWidth = '100px'
        quickMapsButton.addEventListener('click', e => {
            e.preventDefault()
            this.showQuickMapsModal()
        })

        buttonContainer.appendChild(saveButton)
        buttonContainer.appendChild(testButton)
        buttonContainer.appendChild(statusButton)
        buttonContainer.appendChild(maintenanceButton)
        buttonContainer.appendChild(quickMapsButton)
        container.appendChild(buttonContainer)

        return container
    }

    saveCurrentSettings(container) {
        try {
            // Update settings from form using data attributes
            const dailyToggle = container.querySelector('[data-setting="daily-toggle"]')
            const dailyTime = container.querySelector('[data-setting="daily-time"]')
            const fuelToggle = container.querySelector('[data-setting="fuel-toggle"]')
            const fuelThreshold = container.querySelector('[data-setting="fuel-threshold"]')
            const maintenanceToggle = container.querySelector('[data-setting="maintenance-toggle"]')
            const maintenanceKm = container.querySelector('[data-setting="maintenance-km"]')
            const besttimeToggle = container.querySelector('[data-setting="besttime-toggle"]')
            const weatherToggle = container.querySelector('[data-setting="weather-toggle"]')

            if (dailyToggle) this.settings.dailyReminder.enabled = dailyToggle.checked
            if (dailyTime) this.settings.dailyReminder.time = dailyTime.value

            if (fuelToggle) this.settings.lowFuelWarning.enabled = fuelToggle.checked
            if (fuelThreshold) this.settings.lowFuelWarning.threshold = parseInt(fuelThreshold.value) || 20000

            if (maintenanceToggle) this.settings.maintenanceReminder.enabled = maintenanceToggle.checked
            if (maintenanceKm) this.settings.maintenanceReminder.kmInterval = parseInt(maintenanceKm.value) || 5000

            if (besttimeToggle) this.settings.bestTimeNotification.enabled = besttimeToggle.checked
            if (weatherToggle) this.settings.weatherRecommendation.enabled = weatherToggle.checked

            this.saveSettings()
            this.scheduleNotifications()

            // Show success message
            alert('✅ Pengaturan notifikasi berhasil disimpan!')
            console.log('Settings saved:', this.settings)
        } catch (error) {
            console.error('Error saving settings:', error)
            alert('❌ Gagal menyimpan pengaturan. Coba lagi.')
        }
    }

    testNotification() {
        console.log('Testing notification...')

        // Check notification permission first
        if (!('Notification' in window)) {
            alert('❌ Browser tidak mendukung notifikasi')
            return
        }

        if (Notification.permission === 'denied') {
            alert('❌ Notifikasi diblokir. Aktifkan di pengaturan browser.')
            return
        }

        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showTestNotification()
                } else {
                    alert('❌ Permission notifikasi ditolak')
                }
            })
        } else {
            this.showTestNotification()
        }
    }

    showTestNotification() {
        try {
            console.log('Creating test notification...')

            // Show in-app notification immediately
            this.showInAppNotification(
                '🔔 RELI - Test Notification',
                'Notifikasi berfungsi dengan baik! Pengaturan sudah aktif.'
            )

            // Also try native notification
            if ('Notification' in window && Notification.permission === 'granted') {
                try {
                    const notification = new Notification('🔔 RELI - Test Notification', {
                        body: 'Notifikasi berfungsi dengan baik! Pengaturan sudah aktif.',
                        tag: 'test',
                        silent: false,
                    })

                    notification.onclick = () => {
                        window.focus()
                        notification.close()
                    }

                    setTimeout(() => {
                        try {
                            notification.close()
                        } catch (e) {
                            console.log('Error closing notification:', e)
                        }
                    }, 8000)

                    console.log('Native test notification also sent')
                } catch (error) {
                    console.error('Native notification error:', error)
                }
            }

            console.log('Test notification sent successfully')
            alert('✅ Test notifikasi berhasil!\n\nNotifikasi muncul di pojok kanan atas halaman.')
        } catch (error) {
            console.error('Error showing test notification:', error)
            alert('❌ Error: ' + error.message + '\n\nCoba refresh halaman dan test lagi.')
        }
    }

    showQuickMapsModal() {
        const modal = document.createElement('div')
        modal.className = 'modal modal-open'
        modal.innerHTML = `
            <div class="modal-box">
                <h3 class="font-bold text-lg mb-4">🗺️ Quick Maps Access</h3>
                <p class="text-sm opacity-70 mb-4">Akses cepat ke Google Maps untuk berbagai kebutuhan driver</p>
                
                <div class="grid grid-cols-2 gap-3">
                    <button class="btn btn-outline quick-map-btn" data-search="SPBU">
                        ⛽ SPBU Terdekat
                    </button>
                    <button class="btn btn-outline quick-map-btn" data-search="parkir">
                        🅿️ Tempat Parkir
                    </button>
                    <button class="btn btn-outline quick-map-btn" data-search="restoran">
                        🍽️ Restoran
                    </button>
                    <button class="btn btn-outline quick-map-btn" data-search="ATM">
                        🏧 ATM
                    </button>
                    <button class="btn btn-outline quick-map-btn" data-search="bengkel motor">
                        🔧 Bengkel Motor
                    </button>
                    <button class="btn btn-outline quick-map-btn" data-search="rumah sakit">
                        🏥 Rumah Sakit
                    </button>
                    <button class="btn btn-outline quick-map-btn" data-search="mall">
                        🏬 Mall
                    </button>
                    <button class="btn btn-outline quick-map-btn" data-search="minimarket">
                        🏪 Minimarket
                    </button>
                </div>

                <div class="divider">Atau</div>
                
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Cari lokasi custom:</span>
                    </label>
                    <div class="input-group">
                        <input type="text" id="custom-search" placeholder="Masukkan nama tempat..." class="input input-bordered flex-1">
                        <button class="btn btn-primary" id="custom-search-btn">🔍 Cari</button>
                    </div>
                </div>

                <div class="modal-action">
                    <button class="btn" onclick="this.closest('.modal').remove()">Tutup</button>
                </div>
            </div>
        `

        document.body.appendChild(modal)

        // Add event listeners
        modal.querySelectorAll('.quick-map-btn').forEach(btn => {
            btn.onclick = () => {
                const searchTerm = btn.dataset.search
                this.openQuickMaps(searchTerm)
                modal.remove()
            }
        })

        modal.querySelector('#custom-search-btn').onclick = () => {
            const customSearch = modal.querySelector('#custom-search').value.trim()
            if (customSearch) {
                this.openQuickMaps(customSearch)
                modal.remove()
            } else {
                alert('Masukkan nama tempat yang ingin dicari')
            }
        }

        // Enter key support for custom search
        modal.querySelector('#custom-search').onkeypress = e => {
            if (e.key === 'Enter') {
                modal.querySelector('#custom-search-btn').click()
            }
        }
    }

    openQuickMaps(searchTerm) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude
                const lng = position.coords.longitude
                const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchTerm)}/@${lat},${lng},15z`

                window.open(mapsUrl, '_blank')
                this.showInAppNotification('🗺️ Maps Dibuka', `Mencari: ${searchTerm} di sekitar lokasi Anda`)
            },
            error => {
                console.error('Geolocation error:', error)
                // Fallback to general search without location
                const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchTerm)}`
                window.open(mapsUrl, '_blank')
                this.showInAppNotification('🗺️ Maps Dibuka', `Mencari: ${searchTerm} (tanpa lokasi GPS)`)
            }
        )
    }
}
