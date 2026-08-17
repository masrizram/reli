# RELI – Rangkuman Earnings Lintas-Industri

> Kalkulator pendapatan driver ojol multi-platform dengan PWA support

## 🚀 Demo Live

[https://reli-beryl.vercel.app/](https://reli-beryl.vercel.app/)

> Hosted on Vercel with automatic deployment from GitHub

## 📱 Fitur Utama

### 🎯 Core Features

- **Multi-Platform**: Support Grab, Maxim, Gojek, Indrive
- **Dual Payment Models**: Support sistem Top-up/Saldo dan Cash + Transfer
- **Auto Commission**: Perhitungan komisi platform otomatis dengan persentase yang bisa disesuaikan
- **Perhitungan Otomatis**: Real-time calculation saat input data
- **Comprehensive Costs**: Input biaya BBM, parkir, tol, makan, dan biaya lainnya
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

### 📊 Formula Lengkap

**1. Total Kotor (Pendapatan Bruto)**

```
Sistem Top-up Saldo:
Total Kotor = (Top-up - Sisa Saldo) untuk semua platform

Sistem Pembayaran Langsung:
Total Kotor = Pendapatan Cash + Transfer Platform
```

**2. BBM Terpakai**

```
BBM Terpakai (liter) = Jarak Tempuh (km) ÷ Konsumsi Kendaraan (km/liter)
```

**3. Biaya BBM**

```
Biaya BBM = BBM Terpakai × Harga BBM per Liter
```

**4. Biaya Lain (Opsional)**

```
Biaya Lain = Parkir + Tol + Makan + Kuota + Perawatan + Lainnya
```

**5. Pendapatan Bersih (Netto)**

```
Pendapatan Bersih = Total Kotor - Biaya BBM - Biaya Lain
```

### 💡 Contoh Perhitungan

**Contoh 1: Model Top-up/Saldo (Grab)**

```
Top-up: Rp 500.000
Sisa Saldo: Rp 135.300
Total Kotor = Rp 500.000 - Rp 135.300 = Rp 364.700

Jarak: 120 km, Konsumsi: 15 km/liter, Harga BBM: Rp 10.000/liter
BBM Terpakai = 120 ÷ 15 = 8 liter
Biaya BBM = 8 × Rp 10.000 = Rp 80.000

Biaya Lain: Parkir Rp 15.000 + Makan Rp 25.000 = Rp 40.000

Pendapatan Bersih = Rp 364.700 - Rp 80.000 - Rp 40.000 = Rp 244.700
```

**Contoh 2: Model Cash + Transfer (InDrive)**

```
Cash dari Penumpang: Rp 200.000
Transfer Platform: Rp 255.875
Komisi Platform (15%): Rp 68.381
Total Kotor = Rp 200.000 + Rp 255.875 - Rp 68.381 = Rp 387.494

BBM dan Biaya Lain sama seperti contoh 1
Pendapatan Bersih = Rp 387.494 - Rp 80.000 - Rp 40.000 = Rp 267.494
```

### 📋 Panduan Penggunaan

**1. Pilih Model Pembayaran**

- **Top-up/Saldo**: Untuk platform seperti Grab, Maxim yang menggunakan sistem saldo driver
- **Cash + Transfer**: Untuk platform yang membayar kombinasi cash + transfer dengan komisi

**2. Input Data Platform**

- Masukkan data sesuai model yang dipilih
- Sistem akan menghitung komisi otomatis untuk model Cash + Transfer
- Bisa input langsung total kotor jika sudah tahu angka pastinya

**3. Input Data BBM**

- Jarak tempuh dalam km
- Konsumsi kendaraan (km/liter)
- Harga BBM per liter

**4. Input Biaya Tambahan**

- Parkir, tol, makan, kuota internet, perawatan, dll
- Semua biaya operasional selain BBM

**5. Lihat Hasil**

- Pendapatan bersih dihitung otomatis
- Export ke WhatsApp atau CSV untuk dokumentasi

## 📝 Development

### Architecture

- **Entry point**: `src/main.js` — view rendering, state, and routing
- **Services** (`src/services/`): `AnalyticsService`, `DatabaseService`, `OptimizerService`, `LocationService`
- **Utils** (`src/utils/`): `calc.js` (pure calculation engine), `export.js` (CSV generation), `debounce.js`
- **Config** (`src/config/`): `supabase.js` (Supabase client setup)
- **Database schema**: `database/schema.sql`

### Architecture Features

- **Pure calculation engine**: `calc.js` is fully unit-tested without a DOM
- **Hybrid storage**: localStorage-first with optional Supabase cloud sync
- **Offline support**: PWA with service worker (app shell caching)
- **Responsive**: Mobile-first design approach
- **Event-Driven**: Custom events for location updates

## 🚀 Deployment

Auto-deploy ke Vercel setiap push ke branch `main`. Live at: [https://reli-beryl.vercel.app/](https://reli-beryl.vercel.app/)

---

**RELI** - Rangkuman Earnings Lintas-Industri
Membantu driver ojol menghitung pendapatan harian dengan mudah dan akurat.
