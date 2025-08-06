/**
 * Sample Data Generator
 * Generates sample data for testing optimizer functionality
 */

export class SampleDataGenerator {
    /**
     * Generate sample data for testing
     */
    static generateSampleData(days = 7) {
        const sampleData = {}
        const today = new Date()

        for (let i = 0; i < days; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]

            // Generate realistic sample data
            const grabEarnings = Math.floor(Math.random() * 200000) + 100000
            const maximEarnings = Math.floor(Math.random() * 150000) + 50000
            const gojekEarnings = Math.floor(Math.random() * 180000) + 80000
            const indriveEarnings = Math.floor(Math.random() * 100000) + 30000

            const totalKotor = grabEarnings + maximEarnings + gojekEarnings + indriveEarnings
            const jarak = Math.floor(Math.random() * 200) + 150
            const konsumsi = 12 + Math.random() * 4 // 12-16 km/liter
            const hargaBBM = 10000
            const literTerpakai = jarak / konsumsi
            const biayaBBM = literTerpakai * hargaBBM

            const biayaTambahan = Math.floor(Math.random() * 100000) + 50000
            const pendapatanBersih = totalKotor - biayaBBM - biayaTambahan

            sampleData[dateStr] = {
                platforms: {
                    grab: { topup: 0, sisa: 0, kotor: grabEarnings },
                    maxim: { topup: 0, sisa: 0, kotor: maximEarnings },
                    gojek: { topup: 0, sisa: 0, kotor: gojekEarnings },
                    indrive: { topup: 0, sisa: 0, kotor: indriveEarnings },
                },
                fuel: {
                    jarak,
                    konsumsi,
                    harga: hargaBBM,
                    literTerpakai,
                    biayaBBM,
                },
                additionalCosts: {
                    parkir: Math.floor(Math.random() * 20000) + 10000,
                    makan: Math.floor(Math.random() * 30000) + 20000,
                    kuota: Math.floor(Math.random() * 15000) + 5000,
                    tol: Math.floor(Math.random() * 25000) + 15000,
                    lainnya: Math.floor(Math.random() * 10000),
                    total: biayaTambahan,
                },
                results: {
                    totalKotor,
                    biayaBBM: Math.round(biayaBBM),
                    totalAdditionalCosts: biayaTambahan,
                    pendapatanBersih: Math.round(pendapatanBersih),
                },
                timestamp: new Date().toISOString(),
            }
        }

        return sampleData
    }

    /**
     * Load sample data to localStorage
     */
    static loadSampleDataToStorage(days = 7) {
        const sampleData = this.generateSampleData(days)
        const existing = JSON.parse(localStorage.getItem('reli-data') || '{}')
        const merged = { ...existing, ...sampleData }
        localStorage.setItem('reli-data', JSON.stringify(merged))
        return Object.keys(sampleData).length
    }
}

// Make it globally available for testing
window.SampleDataGenerator = SampleDataGenerator
