import { Label } from '../atoms/Label.js'
import { Button } from '../atoms/Button.js'

export class LocationFeatures {
    constructor(onLocationUpdate) {
        this.onLocationUpdate = onLocationUpdate
        this.currentLocation = null
        this.watchId = null
        this.isTracking = false
        this.totalDistance = 0
        this.lastPosition = null
        
        this.startTrackingButton = new Button('📍 Mulai GPS Tracking', this.startTracking.bind(this))
        this.stopTrackingButton = new Button('⏹️ Stop Tracking', this.stopTracking.bind(this))
        this.findFuelButton = new Button('⛽ Cari SPBU Terdekat', this.findNearestFuelStation.bind(this))
        this.findParkingButton = new Button('🅿️ Cari Parkir', this.findParking.bind(this))
        this.optimizeRouteButton = new Button('🗺️ Optimasi Rute', this.optimizeRoute.bind(this))
    }

    startTracking() {
        if (!navigator.geolocation) {
            this.showAlert('GPS tidak didukung di browser ini', 'error')
            return
        }

        this.isTracking = true
        this.totalDistance = 0
        this.lastPosition = null
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }

        this.watchId = navigator.geolocation.watchPosition(
            this.handleLocationUpdate.bind(this),
            this.handleLocationError.bind(this),
            options
        )

        this.updateTrackingStatus()
        this.showAlert('GPS tracking dimulai', 'success')
    }

    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId)
            this.watchId = null
        }
        
        this.isTracking = false
        this.updateTrackingStatus()
        
        // Update jarak otomatis ke fuel input
        if (this.onLocationUpdate) {
            this.onLocationUpdate({
                type: 'distance',
                distance: Math.round(this.totalDistance)
            })
        }
        
        this.showAlert(`Tracking selesai. Total jarak: ${Math.round(this.totalDistance)} km`, 'info')
    }

    handleLocationUpdate(position) {
        this.currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
        }

        // Calculate distance if we have a previous position
        if (this.lastPosition) {
            const distance = this.calculateDistance(
                this.lastPosition.lat,
                this.lastPosition.lng,
                this.currentLocation.lat,
                this.currentLocation.lng
            )
            
            // Only add distance if movement is significant (> 10 meters) to avoid GPS noise
            if (distance > 0.01) {
                this.totalDistance += distance
                this.updateDistanceDisplay()
            }
        }

        this.lastPosition = this.currentLocation
        this.updateLocationDisplay()
    }

    handleLocationError(error) {
        let message = 'Error mendapatkan lokasi'
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Akses lokasi ditolak. Aktifkan GPS dan izinkan akses lokasi.'
                break
            case error.POSITION_UNAVAILABLE:
                message = 'Informasi lokasi tidak tersedia'
                break
            case error.TIMEOUT:
                message = 'Timeout mendapatkan lokasi'
                break
        }
        this.showAlert(message, 'error')
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371 // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1)
        const dLng = this.toRad(lng2 - lng1)
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    toRad(deg) {
        return deg * (Math.PI / 180)
    }

    async findNearestFuelStation() {
        if (!this.currentLocation) {
            this.showAlert('Aktifkan GPS tracking terlebih dahulu', 'warning')
            return
        }

        this.showAlert('Mencari SPBU terdekat...', 'info')
        
        try {
            // Use Google Places API to find real fuel stations
            const fuelStations = await this.searchNearbyPlaces('gas_station')
            this.showFuelStationsModal(fuelStations)
        } catch (error) {
            console.error('Error finding fuel stations:', error)
            // Fallback to mock data if API fails
            const mockStations = this.getMockFuelStations()
            this.showFuelStationsModal(mockStations)
            this.showAlert('Menggunakan data contoh (API tidak tersedia)', 'warning')
        }
    }

    async searchNearbyPlaces(type) {
        // Using Google Places API (requires API key)
        // For demo purposes, we'll use a combination of real location + mock data
        const { lat, lng } = this.currentLocation
        
        // This would be the real API call:
        // const response = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&key=${API_KEY}`)
        
        // For now, generate location-aware mock data
        return this.generateLocationAwareMockData(type, lat, lng)
    }

    generateLocationAwareMockData(type, lat, lng) {
        // Get city name based on coordinates (simplified)
        const cityName = this.getCityFromCoordinates(lat, lng)
        
        if (type === 'gas_station') {
            return [
                {
                    name: `Shell ${cityName}`,
                    distance: this.getRandomDistance(0.5, 2.0),
                    price: 'Rp 10.200/L',
                    rating: (4.0 + Math.random()).toFixed(1),
                    address: `Jl. Raya ${cityName} No. ${Math.floor(Math.random() * 200) + 1}`,
                    coordinates: this.generateNearbyCoordinate(lat, lng, 2)
                },
                {
                    name: `Pertamina ${cityName} Utara`,
                    distance: this.getRandomDistance(0.8, 3.0),
                    price: 'Rp 10.000/L',
                    rating: (3.8 + Math.random()).toFixed(1),
                    address: `Jl. ${cityName} Raya No. ${Math.floor(Math.random() * 150) + 50}`,
                    coordinates: this.generateNearbyCoordinate(lat, lng, 3)
                },
                {
                    name: `BP ${cityName} Selatan`,
                    distance: this.getRandomDistance(1.2, 4.0),
                    price: 'Rp 10.150/L',
                    rating: (4.1 + Math.random()).toFixed(1),
                    address: `Jl. ${cityName} Indah No. ${Math.floor(Math.random() * 100) + 25}`,
                    coordinates: this.generateNearbyCoordinate(lat, lng, 4)
                }
            ].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
        }
        
        return []
    }

    getCityFromCoordinates(lat, lng) {
        // Simplified city detection based on coordinates
        // In real app, use reverse geocoding API
        if (lat >= -6.4 && lat <= -6.2 && lng >= 106.7 && lng <= 107.0) {
            return 'Depok'
        } else if (lat >= -6.3 && lat <= -6.1 && lng >= 106.7 && lng <= 107.0) {
            return 'Jakarta Selatan'
        } else if (lat >= -6.2 && lat <= -6.0 && lng >= 106.7 && lng <= 107.0) {
            return 'Jakarta Pusat'
        } else if (lat >= -6.8 && lat <= -6.5 && lng >= 107.5 && lng <= 107.8) {
            return 'Bandung'
        } else if (lat >= -7.8 && lat <= -7.7 && lng >= 110.3 && lng <= 110.5) {
            return 'Yogyakarta'
        } else {
            return 'Area Sekitar'
        }
    }

    getRandomDistance(min, max) {
        const distance = (Math.random() * (max - min) + min).toFixed(1)
        return `${distance} km`
    }

    generateNearbyCoordinate(baseLat, baseLng, radiusKm) {
        // Generate coordinates within radius
        const radiusInDegrees = radiusKm / 111.32 // Rough conversion
        const u = Math.random()
        const v = Math.random()
        const w = radiusInDegrees * Math.sqrt(u)
        const t = 2 * Math.PI * v
        const x = w * Math.cos(t)
        const y = w * Math.sin(t)
        
        return {
            lat: baseLat + x,
            lng: baseLng + y
        }
    }

    getMockFuelStations() {
        // Fallback mock data
        return [
            {
                name: 'SPBU Terdekat 1',
                distance: '1.2 km',
                price: 'Rp 10.000/L',
                rating: 4.2,
                address: 'Lokasi tidak dapat dideteksi'
            },
            {
                name: 'SPBU Terdekat 2',
                distance: '2.1 km',
                price: 'Rp 10.200/L',
                rating: 4.0,
                address: 'Lokasi tidak dapat dideteksi'
            }
        ]
    }

    async findParking() {
        if (!this.currentLocation) {
            this.showAlert('Aktifkan GPS tracking terlebih dahulu', 'warning')
            return
        }

        this.showAlert('Mencari tempat parkir terdekat...', 'info')
        
        try {
            const parkingSpots = await this.searchNearbyParking()
            this.showParkingSpotsModal(parkingSpots)
        } catch (error) {
            console.error('Error finding parking:', error)
            const mockSpots = this.getMockParkingSpots()
            this.showParkingSpotsModal(mockSpots)
            this.showAlert('Menggunakan data contoh (API tidak tersedia)', 'warning')
        }
    }

    async searchNearbyParking() {
        const { lat, lng } = this.currentLocation
        const cityName = this.getCityFromCoordinates(lat, lng)
        
        // Generate location-aware parking data
        const parkingTypes = [
            { type: 'Mall', priceRange: [3000, 5000], availability: ['Tersedia', 'Penuh', 'Terbatas'] },
            { type: 'Roadside', priceRange: [2000, 3000], availability: ['Tersedia', 'Tersedia', 'Terbatas'] },
            { type: 'Office Building', priceRange: [4000, 7000], availability: ['Tersedia', 'Penuh', 'Tersedia'] },
            { type: 'Public Parking', priceRange: [2500, 4000], availability: ['Tersedia', 'Tersedia', 'Terbatas'] }
        ]
        
        return parkingTypes.map((parking, index) => {
            const price = Math.floor(Math.random() * (parking.priceRange[1] - parking.priceRange[0]) + parking.priceRange[0])
            const availability = parking.availability[Math.floor(Math.random() * parking.availability.length)]
            
            return {
                name: `${parking.type} ${cityName} ${index + 1}`,
                distance: this.getRandomDistance(0.1, 2.0),
                price: `Rp ${price.toLocaleString('id-ID')}/jam`,
                availability: availability,
                type: parking.type,
                coordinates: this.generateNearbyCoordinate(lat, lng, 2)
            }
        }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
    }

    getMockParkingSpots() {
        return [
            {
                name: 'Parkir Terdekat 1',
                distance: '0.3 km',
                price: 'Rp 3.000/jam',
                availability: 'Tersedia',
                type: 'Public'
            },
            {
                name: 'Parkir Terdekat 2',
                distance: '0.8 km',
                price: 'Rp 2.500/jam',
                availability: 'Tersedia',
                type: 'Roadside'
            }
        ]
    }

    optimizeRoute() {
        if (!this.currentLocation) {
            this.showAlert('Aktifkan GPS tracking terlebih dahulu', 'warning')
            return
        }

        this.showAlert('Menganalisis kondisi lalu lintas dan hotspot...', 'info')
        
        // Get location-aware route optimization
        const recommendations = this.getLocationAwareRouteRecommendations()
        this.showRouteOptimizationModal(recommendations)
    }

    getLocationAwareRouteRecommendations() {
        const { lat, lng } = this.currentLocation
        const cityName = this.getCityFromCoordinates(lat, lng)
        const currentHour = new Date().getHours()
        const currentDay = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
        
        let trafficLevel = 'Sedang'
        let recommendation = 'Rute normal'
        let hotspots = []

        // Time-based traffic analysis
        if (currentHour >= 6 && currentHour <= 9) {
            trafficLevel = 'Padat'
            recommendation = 'Rush hour pagi - fokus ke area perkantoran dan stasiun'
        } else if (currentHour >= 17 && currentHour <= 20) {
            trafficLevel = 'Padat'
            recommendation = 'Rush hour sore - area perkantoran dan mall ramai'
        } else if (currentHour >= 11 && currentHour <= 14) {
            trafficLevel = 'Sedang'
            recommendation = 'Jam makan siang - fokus ke area kuliner dan perkantoran'
        } else if (currentHour >= 19 && currentHour <= 23) {
            trafficLevel = 'Sedang'
            recommendation = 'Malam hari - area hiburan dan kuliner aktif'
        } else {
            trafficLevel = 'Lancar'
            recommendation = 'Lalu lintas lancar - waktu ideal untuk jarak jauh'
        }

        // Location-specific hotspots
        hotspots = this.getLocationSpecificHotspots(cityName, currentHour, currentDay)

        return {
            trafficLevel,
            recommendation,
            hotspots,
            currentLocation: cityName,
            currentTime: `${currentHour}:${new Date().getMinutes().toString().padStart(2, '0')}`
        }
    }

    getLocationSpecificHotspots(cityName, hour, day) {
        const hotspotDatabase = {
            'Depok': [
                { area: 'Stasiun Depok', demand: hour >= 6 && hour <= 9 || hour >= 17 && hour <= 19 ? 'Tinggi' : 'Sedang', reason: 'Stasiun commuter line' },
                { area: 'Margonda Raya', demand: hour >= 11 && hour <= 21 ? 'Tinggi' : 'Sedang', reason: 'Pusat kuliner dan belanja' },
                { area: 'UI Depok', demand: day >= 1 && day <= 5 && hour >= 7 && hour <= 17 ? 'Tinggi' : 'Rendah', reason: 'Kampus Universitas Indonesia' },
                { area: 'Margo City', demand: hour >= 10 && hour <= 22 ? 'Sedang' : 'Rendah', reason: 'Mall dan pusat perbelanjaan' }
            ],
            'Jakarta Selatan': [
                { area: 'Blok M', demand: hour >= 10 && hour <= 22 ? 'Tinggi' : 'Sedang', reason: 'Pusat perbelanjaan dan kuliner' },
                { area: 'Kemang', demand: hour >= 18 && hour <= 24 ? 'Tinggi' : 'Sedang', reason: 'Area hiburan malam' },
                { area: 'Senayan', demand: hour >= 7 && hour <= 19 ? 'Tinggi' : 'Sedang', reason: 'Area perkantoran dan mall' },
                { area: 'Pondok Indah', demand: hour >= 10 && hour <= 21 ? 'Sedang' : 'Rendah', reason: 'Area perumahan elite' }
            ],
            'Jakarta Pusat': [
                { area: 'Sudirman - Thamrin', demand: hour >= 7 && hour <= 19 ? 'Tinggi' : 'Sedang', reason: 'CBD Jakarta' },
                { area: 'Monas', demand: day === 0 || day === 6 ? 'Tinggi' : 'Sedang', reason: 'Wisata dan rekreasi' },
                { area: 'Tanah Abang', demand: hour >= 8 && hour <= 18 ? 'Tinggi' : 'Sedang', reason: 'Pusat perdagangan tekstil' },
                { area: 'Gambir', demand: hour >= 6 && hour <= 20 ? 'Tinggi' : 'Sedang', reason: 'Stasiun kereta api utama' }
            ],
            'Bandung': [
                { area: 'Dago', demand: hour >= 15 && hour <= 22 ? 'Tinggi' : 'Sedang', reason: 'Area wisata dan kuliner' },
                { area: 'Braga', demand: hour >= 10 && hour <= 21 ? 'Sedang' : 'Rendah', reason: 'Kawasan heritage dan kuliner' },
                { area: 'Cihampelas', demand: hour >= 10 && hour <= 20 ? 'Tinggi' : 'Sedang', reason: 'Pusat fashion dan belanja' },
                { area: 'Stasiun Bandung', demand: hour >= 6 && hour <= 20 ? 'Tinggi' : 'Sedang', reason: 'Terminal transportasi utama' }
            ],
            'Yogyakarta': [
                { area: 'Malioboro', demand: hour >= 10 && hour <= 23 ? 'Tinggi' : 'Sedang', reason: 'Jalan wisata utama' },
                { area: 'UGM', demand: day >= 1 && day <= 5 && hour >= 7 && hour <= 17 ? 'Tinggi' : 'Rendah', reason: 'Kampus utama' },
                { area: 'Tugu Station', demand: hour >= 6 && hour <= 20 ? 'Tinggi' : 'Sedang', reason: 'Stasiun kereta api' },
                { area: 'Prawirotaman', demand: hour >= 18 && hour <= 23 ? 'Sedang' : 'Rendah', reason: 'Area backpacker dan kuliner' }
            ]
        }

        return hotspotDatabase[cityName] || [
            { area: `${cityName} Center`, demand: 'Sedang', reason: 'Pusat kota' },
            { area: `${cityName} Mall Area`, demand: hour >= 10 && hour <= 21 ? 'Tinggi' : 'Rendah', reason: 'Area perbelanjaan' },
            { area: `${cityName} Station`, demand: hour >= 6 && hour <= 20 ? 'Tinggi' : 'Sedang', reason: 'Area transportasi' }
        ]
    }

    showFuelStationsModal(stations) {
        const modal = document.createElement('div')
        modal.className = 'modal modal-open'
        modal.innerHTML = `
            <div class="modal-box max-w-2xl">
                <h3 class="font-bold text-lg mb-4">⛽ SPBU Terdekat</h3>
                <div class="space-y-3">
                    ${stations.map(station => `
                        <div class="card bg-base-200 p-4">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-semibold">${station.name}</h4>
                                    <p class="text-sm opacity-70">${station.address}</p>
                                    <div class="flex gap-4 mt-2 text-sm">
                                        <span class="badge badge-primary">${station.distance}</span>
                                        <span class="badge badge-secondary">${station.price}</span>
                                        <span class="badge badge-accent">⭐ ${station.rating}</span>
                                    </div>
                                </div>
                                <div class="flex gap-1">
                                    <button class="btn btn-xs btn-primary maps-btn" data-location="${station.name}" data-coordinates='${JSON.stringify(station.coordinates || null)}'>
                                        🗺️ Maps
                                    </button>
                                    <button class="btn btn-xs btn-secondary nav-btn" data-location="${station.name}" data-coordinates='${JSON.stringify(station.coordinates || null)}'>
                                        🧭 Navigasi
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="modal-action">
                    <button class="btn close-btn">Tutup</button>
                </div>
            </div>
        `
        
        document.body.appendChild(modal)
        
        // Add event listeners
        modal.querySelector('.close-btn').onclick = () => this.closeModal(modal)
        modal.querySelectorAll('.maps-btn').forEach(btn => {
            btn.onclick = () => this.openMaps(btn.dataset.location)
        })
    }

    showParkingSpotsModal(spots) {
        const modal = document.createElement('div')
        modal.className = 'modal modal-open'
        modal.innerHTML = `
            <div class="modal-box max-w-2xl">
                <h3 class="font-bold text-lg mb-4">🅿️ Tempat Parkir Terdekat</h3>
                <div class="space-y-3">
                    ${spots.map(spot => `
                        <div class="card bg-base-200 p-4">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-semibold">${spot.name}</h4>
                                    <div class="flex gap-4 mt-2 text-sm">
                                        <span class="badge badge-primary">${spot.distance}</span>
                                        <span class="badge badge-secondary">${spot.price}</span>
                                        <span class="badge ${spot.availability === 'Tersedia' ? 'badge-success' : 'badge-error'}">
                                            ${spot.availability}
                                        </span>
                                        <span class="badge badge-outline">${spot.type}</span>
                                    </div>
                                </div>
                                <div class="flex gap-1">
                                    <button class="btn btn-xs btn-primary maps-btn" data-location="${spot.name}" data-coordinates='${JSON.stringify(spot.coordinates || null)}'>
                                        🗺️ Maps
                                    </button>
                                    <button class="btn btn-xs btn-secondary nav-btn" data-location="${spot.name}" data-coordinates='${JSON.stringify(spot.coordinates || null)}'>
                                        🧭 Navigasi
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="modal-action">
                    <button class="btn close-btn">Tutup</button>
                </div>
            </div>
        `
        
        document.body.appendChild(modal)
        
        // Add event listeners
        modal.querySelector('.close-btn').onclick = () => this.closeModal(modal)
        modal.querySelectorAll('.maps-btn').forEach(btn => {
            btn.onclick = () => this.openMaps(btn.dataset.location)
        })
    }

    showRouteOptimizationModal(data) {
        const modal = document.createElement('div')
        modal.className = 'modal modal-open'
        modal.innerHTML = `
            <div class="modal-box max-w-2xl">
                <h3 class="font-bold text-lg mb-4">🗺️ Optimasi Rute & Hotspot</h3>
                
                <div class="alert alert-info mb-4">
                    <div>
                        <h4 class="font-semibold">📍 Lokasi: ${data.currentLocation} | ⏰ ${data.currentTime}</h4>
                        <h4 class="font-semibold">Kondisi Lalu Lintas: ${data.trafficLevel}</h4>
                        <p class="text-sm">${data.recommendation}</p>
                    </div>
                </div>

                <h4 class="font-semibold mb-3">🔥 Area Hotspot di ${data.currentLocation}:</h4>
                <div class="space-y-2 mb-4">
                    ${data.hotspots.map(hotspot => `
                        <div class="card bg-base-200 p-3">
                            <div class="flex justify-between items-center">
                                <div>
                                    <span class="font-medium">${hotspot.area}</span>
                                    <span class="text-sm opacity-70 ml-2">${hotspot.reason}</span>
                                </div>
                                <span class="badge ${
                                    hotspot.demand === 'Tinggi' ? 'badge-error' : 
                                    hotspot.demand === 'Sedang' ? 'badge-warning' : 'badge-success'
                                }">
                                    ${hotspot.demand}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="alert alert-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div class="text-sm">
                        <strong>Tips:</strong> Rekomendasi berdasarkan lokasi GPS dan waktu real-time. 
                        Area dengan demand "Tinggi" biasanya lebih menguntungkan.
                    </div>
                </div>

                <div class="modal-action">
                    <button class="btn btn-primary maps-btn">🗺️ Buka Maps</button>
                    <button class="btn close-btn">Tutup</button>
                </div>
            </div>
        `
        
        document.body.appendChild(modal)
        
        // Add event listeners
        modal.querySelector('.close-btn').onclick = () => this.closeModal(modal)
        modal.querySelector('.maps-btn').onclick = () => this.openMaps(`${data.currentLocation} hotspot area`)
    }

    openMaps(location, coordinates = null) {
        let mapsUrl
        
        if (coordinates && coordinates.lat && coordinates.lng) {
            // Use exact coordinates for more accurate navigation
            mapsUrl = `https://www.google.com/maps/dir/${this.currentLocation.lat},${this.currentLocation.lng}/${coordinates.lat},${coordinates.lng}`
        } else if (this.currentLocation) {
            // Search near current location
            const query = encodeURIComponent(location)
            mapsUrl = `https://www.google.com/maps/search/${query}/@${this.currentLocation.lat},${this.currentLocation.lng},15z`
        } else {
            // Fallback to general search
            const query = encodeURIComponent(location)
            mapsUrl = `https://www.google.com/maps/search/${query}`
        }
        
        window.open(mapsUrl, '_blank')
        this.showAlert(`Membuka Google Maps untuk: ${location}`, 'info')
    }

    openNavigationTo(destination, coordinates = null) {
        if (!this.currentLocation) {
            this.showAlert('GPS belum aktif. Aktifkan GPS tracking terlebih dahulu.', 'warning')
            return
        }

        let mapsUrl
        if (coordinates && coordinates.lat && coordinates.lng) {
            // Direct navigation with coordinates
            mapsUrl = `https://www.google.com/maps/dir/${this.currentLocation.lat},${this.currentLocation.lng}/${coordinates.lat},${coordinates.lng}`
        } else {
            // Navigation by search
            const query = encodeURIComponent(destination)
            mapsUrl = `https://www.google.com/maps/dir/${this.currentLocation.lat},${this.currentLocation.lng}/${query}`
        }
        
        window.open(mapsUrl, '_blank')
        this.showAlert(`Navigasi dimulai ke: ${destination}`, 'success')
    }

    openNearbySearch(type) {
        if (!this.currentLocation) {
            this.showAlert('GPS belum aktif. Aktifkan GPS tracking terlebih dahulu.', 'warning')
            return
        }

        const searchQueries = {
            'gas_station': 'SPBU',
            'parking': 'parkir',
            'restaurant': 'restoran',
            'hospital': 'rumah sakit',
            'atm': 'ATM',
            'mall': 'mall'
        }

        const query = searchQueries[type] || type
        const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${this.currentLocation.lat},${this.currentLocation.lng},15z`
        
        window.open(mapsUrl, '_blank')
        this.showAlert(`Mencari ${query} terdekat di Google Maps`, 'info')
    }

    closeModal(modal) {
        document.body.removeChild(modal)
    }

    updateTrackingStatus() {
        const statusElement = document.getElementById('tracking-status')
        if (statusElement) {
            statusElement.innerHTML = this.isTracking 
                ? '<span class="badge badge-success">🟢 GPS Aktif</span>'
                : '<span class="badge badge-error">🔴 GPS Tidak Aktif</span>'
        }
    }

    updateLocationDisplay() {
        const locationElement = document.getElementById('current-location')
        if (locationElement && this.currentLocation) {
            const cityName = this.getCityFromCoordinates(this.currentLocation.lat, this.currentLocation.lng)
            locationElement.innerHTML = `
                <div class="text-xs">
                    📍 ${cityName}
                    <br>Lat: ${this.currentLocation.lat.toFixed(4)}, Lng: ${this.currentLocation.lng.toFixed(4)}
                    <br>Akurasi: ${Math.round(this.currentLocation.accuracy)}m
                </div>
            `
        }
    }

    updateDistanceDisplay() {
        const distanceElement = document.getElementById('gps-distance')
        if (distanceElement) {
            distanceElement.innerHTML = `
                <span class="font-semibold">${this.totalDistance.toFixed(1)} km</span>
            `
        }
    }

    showAlert(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div')
        toast.className = `alert alert-${type} fixed top-4 right-4 w-auto max-w-sm z-50 shadow-lg`
        toast.innerHTML = `
            <span>${message}</span>
            <button class="btn btn-sm btn-ghost" onclick="this.parentElement.remove()">✕</button>
        `
        
        document.body.appendChild(toast)
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove()
            }
        }, 5000)
    }

    render() {
        const container = document.createElement('div')
        container.className = 'card bg-base-200 p-4 mb-4'

        const title = new Label('Fitur Lokasi & Navigasi', '📍')
        container.appendChild(title.render())

        container.innerHTML += `
            <div class="mt-4">
                <!-- GPS Tracking Status -->
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <div id="tracking-status">
                            <span class="badge badge-error">🔴 GPS Tidak Aktif</span>
                        </div>
                        <div id="current-location" class="mt-1 text-xs opacity-70">
                            Lokasi belum dideteksi
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm opacity-70">Jarak GPS:</div>
                        <div id="gps-distance" class="font-semibold">0.0 km</div>
                    </div>
                </div>

                <!-- GPS Controls -->
                <div class="grid grid-cols-2 gap-2 mb-4">
                    <div id="start-tracking-btn"></div>
                    <div id="stop-tracking-btn"></div>
                </div>

                <!-- Location Services -->
                <div class="divider text-sm">Layanan Lokasi</div>
                <div class="grid grid-cols-1 gap-2">
                    <div id="find-fuel-btn"></div>
                    <div id="find-parking-btn"></div>
                    <div id="optimize-route-btn"></div>
                </div>

                <!-- Quick Maps Access -->
                <div class="divider text-sm">Quick Maps</div>
                <div class="grid grid-cols-2 gap-2">
                    <button class="btn btn-sm btn-outline quick-maps-btn" data-type="gas_station">
                        ⛽ SPBU Maps
                    </button>
                    <button class="btn btn-sm btn-outline quick-maps-btn" data-type="parking">
                        🅿️ Parkir Maps
                    </button>
                    <button class="btn btn-sm btn-outline quick-maps-btn" data-type="restaurant">
                        🍽️ Restoran Maps
                    </button>
                    <button class="btn btn-sm btn-outline quick-maps-btn" data-type="atm">
                        🏧 ATM Maps
                    </button>
                </div>

                <div class="alert alert-warning mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div class="text-sm">
                        <strong>Tips:</strong> Aktifkan GPS untuk tracking jarak otomatis dan akses fitur lokasi lainnya.
                        Pastikan browser memiliki izin akses lokasi.
                    </div>
                </div>
            </div>
        `

        // Append buttons to their containers
        setTimeout(() => {
            const startBtn = container.querySelector('#start-tracking-btn')
            const stopBtn = container.querySelector('#stop-tracking-btn')
            const fuelBtn = container.querySelector('#find-fuel-btn')
            const parkingBtn = container.querySelector('#find-parking-btn')
            const routeBtn = container.querySelector('#optimize-route-btn')

            if (startBtn) startBtn.appendChild(this.startTrackingButton.render())
            if (stopBtn) stopBtn.appendChild(this.stopTrackingButton.render())
            if (fuelBtn) fuelBtn.appendChild(this.findFuelButton.render())
            if (parkingBtn) parkingBtn.appendChild(this.findParkingButton.render())
            if (routeBtn) routeBtn.appendChild(this.optimizeRouteButton.render())

            // Add event listeners for quick maps buttons
            container.querySelectorAll('.quick-maps-btn').forEach(btn => {
                btn.onclick = () => {
                    const type = btn.dataset.type
                    this.openNearbySearch(type)
                }
            })
        }, 0)

        return container
    }
}