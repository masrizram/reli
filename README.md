# RELI – Rangkuman Earnings Lintas-Industri

> Kalkulator pendapatan driver ojol multi-platform dengan PWA support

## 🚀 Demo Live

[https://reli-beryl.vercel.app/](https://reli-beryl.vercel.app/)

> Hosted on Vercel with automatic deployment from GitHub

## 📱 Fitur Utama

### 🎯 Core Features

- **Multi-Platform**: Support Grab, Maxim, Gojek, Indrive
- **Perhitungan Otomatis**: Real-time calculation saat input data
- **Kirim WhatsApp**: Export catatan harian ke WhatsApp pribadi
- **PWA Ready**: Bisa diinstall di mobile device
- **Responsive**: Optimized untuk mobile dan desktop

### 🧠 AI-Powered Features

- **Advanced Analytics**: Analisis mendalam dengan AI insights dan prediksi
- **Earnings Optimizer**: Rekomendasi AI untuk maksimalkan pendapatan
- **Smart Notifications**: Pengingat cerdas berbasis pola data
- **Automation Hub**: Otomatisasi tugas-tugas rutin

### 📍 Location Features

- **GPS Tracking**: Pelacakan jarak otomatis dengan GPS
- **SPBU Finder**: Cari SPBU terdekat dengan harga real-time
- **Parking Finder**: Temukan tempat parkir terdekat
- **Route Optimization**: Optimasi rute berdasarkan hotspot dan traffic

### 📊 Analytics & Reporting

- **Dashboard Interaktif**: Visualisasi data dengan sidebar navigasi
- **Export CSV**: Export data untuk analisis lanjutan
- **Advanced Reports**: Laporan mendalam dengan prediksi
- **Platform Performance**: Analisis performa per platform

### 🤖 Automation Features

- **Auto Calculate**: Perhitungan otomatis berkala
- **Auto Save**: Penyimpanan data otomatis
- **Auto Backup**: Backup data berkala
- **Smart Alerts**: Peringatan berbasis AI
- **Cloud Sync**: Sinkronisasi data cloud (simulasi)

## 🛠️ Teknologi

- **Frontend**: Vanilla JavaScript dengan Atomic Design
- **UI Framework**: DaisyUI + Tailwind CSS
- **Build Tool**: Vite
- **PWA**: Service Worker support
- **Hosting**: Vercel

## 🏃‍♂️ Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Format code
npm run format

# Deploy to GitHub Pages
npm run deploy
```

## � Daokumentasi

- **[� PanduanS Penggunaan Lengkap](USAGE_GUIDE.md)** - Tutorial detail semua fitur
- **[🚀 Quick Start](#-quick-start)** - Mulai development
- **[🎯 Formula Perhitungan](#-formula-perhitungan)** - Logika kalkulasi

## 🎯 Formula Perhitungan

```
Total Kotor = (Top-up - Sisa) untuk semua platform
BBM Terpakai = Jarak ÷ Konsumsi
Biaya BBM = BBM Terpakai × Harga per Liter
Pendapatan Bersih = Total Kotor - Biaya BBM
```

## 📝 Development

Project ini menggunakan Atomic Design Pattern:

### Atoms (Basic Components)

- **Button**: Reusable button component
- **Input**: Form input dengan validation
- **Label**: Text label dengan icon support

### Molecules (Feature Components)

- **PlatformInput**: Input untuk setiap platform (Grab, Maxim, dll)
- **FuelInput**: Input data BBM dengan auto-calculation
- **AdditionalCosts**: Input biaya tambahan (parkir, makan, dll)
- **AnalyticsDashboard**: Dashboard analytics dengan charts
- **SmartNotifications**: Sistem notifikasi cerdas
- **LocationFeatures**: GPS tracking dan location services
- **AdvancedAnalytics**: AI-powered analytics dan insights
- **EarningsOptimizer**: AI optimizer untuk maksimalkan pendapatan
- **AutomationHub**: Automation management system
- **Sidebar**: Navigation sidebar dengan quick actions

### Organisms (Main Components)

- **App**: Main application component (legacy)
- **Dashboard**: New dashboard dengan sidebar navigation

### Utils

- **StorageManager**: Local storage management
- **PWA**: Progressive Web App utilities

### Architecture Features

- **Modular Design**: Setiap component independent
- **Event-Driven**: Custom events untuk inter-component communication
- **Responsive**: Mobile-first design approach
- **PWA Ready**: Service worker dan manifest
- **Performance**: Lazy loading dan optimization

## 🚀 Deployment

Auto-deploy ke Vercel setiap push ke branch `main`. Live at: [https://reli-beryl.vercel.app/](https://reli-beryl.vercel.app/)

---

**RELI** - Rangkuman Earnings Lintas-Industri
Membantu driver ojol menghitung pendapatan harian dengan mudah dan akurat.
