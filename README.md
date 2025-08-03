# RELI – Rangkuman Earnings Lintas-Industri

> Kalkulator pendapatan driver ojol multi-platform dengan PWA support

## 🚀 Demo Live

[https://reli-beryl.vercel.app/](https://reli-beryl.vercel.app/)

> Hosted on Vercel with automatic deployment from GitHub

## 📱 Fitur Utama

- **Multi-Platform**: Support Grab, Maxim, Gojek, Indrive
- **Perhitungan Otomatis**: Real-time calculation saat input data
- **Kirim WhatsApp**: Export catatan harian ke WhatsApp pribadi
- **PWA Ready**: Bisa diinstall di mobile device
- **Responsive**: Optimized untuk mobile dan desktop

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

## 📊 Cara Penggunaan

1. **Input Data Platform**: Masukkan top-up dan sisa saldo untuk setiap platform
2. **Input Data BBM**: Masukkan jarak tempuh, konsumsi, dan harga BBM
3. **Lihat Hasil**: Aplikasi akan menghitung otomatis pendapatan bersih
4. **Kirim WhatsApp**: Klik tombol kirim untuk export ke WhatsApp

## 🎯 Formula Perhitungan

```
Total Kotor = (Top-up - Sisa) untuk semua platform
BBM Terpakai = Jarak ÷ Konsumsi
Biaya BBM = BBM Terpakai × Harga per Liter
Pendapatan Bersih = Total Kotor - Biaya BBM
```

## 📝 Development

Project ini menggunakan Atomic Design Pattern:

- **Atoms**: Button, Input, Label
- **Molecules**: PlatformInput, FuelInput
- **Organisms**: App (main component)

## 🚀 Deployment

Auto-deploy ke Vercel setiap push ke branch `main`. Live at: [https://reli-beryl.vercel.app/](https://reli-beryl.vercel.app/)

---

**RELI** - Rangkuman Earnings Lintas-Industri
Membantu driver ojol menghitung pendapatan harian dengan mudah dan akurat.
