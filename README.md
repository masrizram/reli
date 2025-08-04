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

## 📊 Cara Penggunaan Lengkap

### 🚀 Getting Started (Pengguna Baru)

1. **Akses Aplikasi**: Buka [https://reli-beryl.vercel.app/](https://reli-beryl.vercel.app/)
2. **Install PWA** (Opsional): Klik "Add to Home Screen" di browser mobile
3. **Mulai Input Data**: Klik "Input Data Hari Ini" di dashboard

### 📝 Input Data Harian

#### 1. Input Data Platform

- **Grab**: Masukkan top-up dan sisa saldo Grab
- **Maxim**: Masukkan top-up dan sisa saldo Maxim
- **Gojek**: Masukkan top-up dan sisa saldo Gojek
- **Indrive**: Masukkan top-up dan sisa saldo Indrive
- **Auto Calculate**: Pendapatan kotor dihitung otomatis (Top-up - Sisa)

#### 2. Input Data BBM

- **Jarak Tempuh**: Masukkan total kilometer hari ini
- **Konsumsi BBM**: Set konsumsi kendaraan (km/liter)
- **Harga BBM**: Input harga BBM per liter
- **GPS Integration**: Gunakan GPS tracking untuk jarak otomatis

#### 3. Input Biaya Tambahan

- **Parkir**: Biaya parkir total hari ini
- **Makan & Minum**: Pengeluaran konsumsi
- **Kuota Internet**: Biaya paket data
- **Tol**: Biaya tol yang dikeluarkan
- **Lainnya**: Biaya tambahan lain

### 📍 Menggunakan Location Features

#### GPS Tracking

1. **Aktifkan GPS**: Klik "📍 Mulai GPS Tracking"
2. **Izinkan Akses Lokasi**: Approve permission browser
3. **Tracking Otomatis**: Jarak akan terekam otomatis
4. **Stop Tracking**: Klik "⏹️ Stop Tracking" untuk selesai
5. **Auto Update**: Jarak otomatis masuk ke input BBM

#### Cari SPBU Terdekat

1. **Pastikan GPS Aktif**: GPS tracking harus berjalan
2. **Klik "⛽ Cari SPBU Terdekat"**: Sistem akan mencari SPBU
3. **Lihat Hasil**: Daftar SPBU dengan jarak, harga, rating
4. **Navigasi**: Klik "🧭 Navigasi" untuk buka Google Maps
5. **Maps**: Klik "🗺️ Maps" untuk lihat lokasi

#### Cari Tempat Parkir

1. **GPS Harus Aktif**: Pastikan location tracking berjalan
2. **Klik "🅿️ Cari Parkir"**: Cari parkir terdekat
3. **Filter Hasil**: Lihat harga, availability, tipe parkir
4. **Navigasi**: Gunakan tombol navigasi ke lokasi

#### Optimasi Rute & Hotspot

1. **Klik "🗺️ Optimasi Rute"**: Analisis area hotspot
2. **Lihat Rekomendasi**: Area dengan demand tinggi/sedang/rendah
3. **Tips Waktu**: Rekomendasi berdasarkan jam dan hari
4. **Buka Maps**: Navigasi ke area hotspot terbaik

### 🧠 Menggunakan AI Features

#### Advanced Analytics

1. **Akses Analytics**: Klik menu "📊 Analytics" di sidebar
2. **Lihat Metrics**: Rata-rata harian, hari terbaik, efisiensi BBM
3. **Platform Performance**: Analisis kontribusi setiap platform
4. **AI Insights**: Rekomendasi berbasis data historis
5. **Prediksi**: Estimasi pendapatan minggu/bulan depan
6. **Export Report**: Download laporan lengkap

#### Earnings Optimizer

1. **Buka Optimizer**: Menu "🚀 Optimizer" di sidebar
2. **Analisis Performa**: Lihat performa saat ini vs potensi
3. **Rekomendasi Prioritas**: Aksi segera untuk tingkatkan pendapatan
4. **Platform Terbaik**: Fokus ke platform dengan ROI tertinggi
5. **Waktu Optimal**: Rekomendasi jam kerja terbaik
6. **Action Plan**: Rencana aksi jangka pendek dan panjang

#### Smart Notifications

1. **Konfigurasi**: Menu "🔔 Notifications" di sidebar
2. **Set Threshold**: Atur batas minimum pendapatan
3. **Fuel Alerts**: Peringatan efisiensi BBM rendah
4. **Performance Alerts**: Notifikasi performa di bawah rata-rata
5. **Time Reminders**: Pengingat waktu optimal kerja

### 🤖 Automation Hub

#### Setup Automasi

1. **Buka Automation**: Menu "🤖 Automation" di sidebar
2. **Toggle Features**: Aktifkan/nonaktifkan automasi
3. **Auto Calculate**: Perhitungan otomatis setiap 5 detik
4. **Auto Save**: Simpan data otomatis setiap 30 detik
5. **Auto Backup**: Backup data setiap 1 jam
6. **Smart Alerts**: Cek peringatan setiap 1 menit

#### Konfigurasi Lanjutan

1. **Export Config**: Backup pengaturan automasi
2. **Import Config**: Restore pengaturan dari file
3. **Test Mode**: Jalankan semua automasi untuk testing
4. **Reset All**: Kembalikan ke pengaturan default

### 📊 Dashboard & Navigation

#### Menggunakan Sidebar

1. **Toggle Sidebar**: Klik tombol collapse untuk minimize
2. **Quick Stats**: Lihat pendapatan bersih dan total kotor
3. **Quick Actions**: Calculate, WhatsApp, Export langsung
4. **Navigation**: Klik menu untuk pindah halaman

#### Dashboard Overview

1. **Welcome Section**: Ringkasan dan quick actions
2. **Quick Stats**: 4 metric utama dengan visual
3. **Feature Cards**: Akses cepat ke fitur utama
4. **Real-time Updates**: Data update otomatis

### 📱 Export & Sharing

#### WhatsApp Export

1. **Klik "📱 Kirim ke WhatsApp"**: Buka modal WhatsApp
2. **Input Nomor**: Format 628123456789 (tanpa +)
3. **Auto Save Number**: Nomor tersimpan untuk next time
4. **Send**: Otomatis buka WhatsApp dengan catatan
5. **Copy Text**: Alternatif copy ke clipboard

#### CSV Export

1. **Klik "📊 Export CSV"**: Download data dalam format CSV
2. **Historical Data**: Semua data harian ter-export
3. **Excel Compatible**: Bisa dibuka di Excel/Google Sheets
4. **Analysis Ready**: Format siap untuk analisis lanjutan

### 💡 Tips Penggunaan Optimal

#### Untuk Hasil Terbaik

1. **Reset Trip A**: Reset odometer setiap pagi
2. **Input Konsisten**: Isi data setelah selesai shift
3. **Simpan Struk**: Validasi harga BBM dan liter
4. **Gunakan GPS**: Untuk data jarak yang akurat
5. **Check Analytics**: Review performa mingguan

#### Troubleshooting

1. **GPS Tidak Akurat**: Pastikan di area terbuka
2. **Data Tidak Tersimpan**: Check browser storage
3. **WhatsApp Error**: Periksa format nomor
4. **Performance Slow**: Clear browser cache

### 🔧 Advanced Features

#### Data Management

- **Auto Backup**: Data otomatis ter-backup setiap jam
- **Cloud Sync**: Simulasi sinkronisasi cloud
- **Data Recovery**: Restore dari backup jika diperlukan
- **Export Options**: Multiple format export (CSV, TXT, JSON)

#### Customization

- **Automation Rules**: Buat aturan automasi custom
- **Notification Settings**: Atur threshold dan timing
- **Platform Priority**: Set prioritas platform favorit
- **Theme & Layout**: Responsive design untuk semua device

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
