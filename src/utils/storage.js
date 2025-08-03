export class StorageManager {
    constructor() {
        this.storageKey = 'reli-data'
    }

    saveDaily(data) {
        const today = new Date().toISOString().split('T')[0]
        const existingData = this.getAllData()

        existingData[today] = {
            ...data,
            timestamp: new Date().toISOString(),
            version: '1.0',
        }

        localStorage.setItem(this.storageKey, JSON.stringify(existingData))
    }

    getAllData() {
        try {
            const data = localStorage.getItem(this.storageKey)
            return data ? JSON.parse(data) : {}
        } catch (error) {
            console.error('Error loading data:', error)
            return {}
        }
    }

    getLastNDays(days = 7) {
        const allData = this.getAllData()
        const dates = Object.keys(allData)
            .sort((a, b) => new Date(b) - new Date(a))
            .slice(0, days)

        return dates.map(date => ({
            date,
            ...allData[date],
        }))
    }

    getTodayData() {
        const today = new Date().toISOString().split('T')[0]
        const allData = this.getAllData()
        return allData[today] || null
    }

    exportToCSV() {
        const allData = this.getAllData()
        const headers = [
            'Tanggal',
            'Grab Topup',
            'Grab Sisa',
            'Maxim Topup',
            'Maxim Sisa',
            'Gojek Topup',
            'Gojek Sisa',
            'Indrive Topup',
            'Indrive Sisa',
            'Jarak',
            'Konsumsi',
            'Harga BBM',
            'Total Kotor',
            'Biaya BBM',
            'Pendapatan Bersih',
        ]

        let csv = headers.join(',') + '\n'

        Object.entries(allData).forEach(([date, data]) => {
            const row = [
                date,
                data.platforms?.grab?.topup || 0,
                data.platforms?.grab?.sisa || 0,
                data.platforms?.maxim?.topup || 0,
                data.platforms?.maxim?.sisa || 0,
                data.platforms?.gojek?.topup || 0,
                data.platforms?.gojek?.sisa || 0,
                data.platforms?.indrive?.topup || 0,
                data.platforms?.indrive?.sisa || 0,
                data.fuel?.jarak || 0,
                data.fuel?.konsumsi || 0,
                data.fuel?.harga || 0,
                data.results?.totalKotor || 0,
                data.results?.biayaBBM || 0,
                data.results?.pendapatanBersih || 0,
            ]
            csv += row.join(',') + '\n'
        })

        return csv
    }

    downloadCSV() {
        const csv = this.exportToCSV()
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reli-data-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }
}
