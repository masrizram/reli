import { Label } from '../atoms/Label.js'
import { Button } from '../atoms/Button.js'

export class AdvancedAnalytics {
    constructor() {
        this.storageKey = 'reli-data'
        this.initCharts()
    }

    initCharts() {
        // Initialize chart configurations
        this.chartColors = {
            primary: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#06b6d4',
        }
    }

    getAllData() {
        try {
            const data = localStorage.getItem(this.storageKey)
            return data ? JSON.parse(data) : {}
        } catch (error) {
            console.error('Error loading analytics data:', error)
            return {}
        }
    }

    getAnalyticsData(days = 30) {
        const allData = this.getAllData()
        const dates = Object.keys(allData)
            .sort((a, b) => new Date(b) - new Date(a))
            .slice(0, days)

        return dates
            .map(date => ({
                date,
                ...allData[date],
            }))
            .reverse()
    }

    calculateAdvancedMetrics() {
        const data = this.getAnalyticsData(30)

        if (data.length === 0) {
            return {
                totalDays: 0,
                avgDailyEarnings: 0,
                totalEarnings: 0,
                totalDistance: 0,
                avgFuelEfficiency: 0,
                bestDay: null,
                worstDay: null,
                trends: {},
                platformPerformance: {},
                predictions: {},
            }
        }

        const totalEarnings = data.reduce((sum, day) => sum + (day.results?.pendapatanBersih || 0), 0)
        const totalDistance = data.reduce((sum, day) => sum + (day.fuel?.jarak || 0), 0)
        const avgDailyEarnings = totalEarnings / data.length

        // Platform performance
        const platformPerformance = this.calculatePlatformPerformance(data)

        // Best and worst days
        const sortedByEarnings = [...data].sort(
            (a, b) => (b.results?.pendapatanBersih || 0) - (a.results?.pendapatanBersih || 0)
        )
        const bestDay = sortedByEarnings[0]
        const worstDay = sortedByEarnings[sortedByEarnings.length - 1]

        // Trends
        const trends = this.calculateTrends(data)

        // Predictions
        const predictions = this.calculatePredictions(data)

        return {
            totalDays: data.length,
            avgDailyEarnings,
            totalEarnings,
            totalDistance,
            avgFuelEfficiency:
                totalDistance > 0
                    ? totalDistance / data.reduce((sum, day) => sum + (day.fuel?.literTerpakai || 0), 0)
                    : 0,
            bestDay,
            worstDay,
            trends,
            platformPerformance,
            predictions,
        }
    }

    calculatePlatformPerformance(data) {
        const platforms = ['grab', 'maxim', 'gojek', 'indrive']
        const performance = {}

        platforms.forEach(platform => {
            const platformData = data.map(day => day.platforms?.[platform] || { kotor: 0 })
            const totalEarnings = platformData.reduce((sum, p) => sum + p.kotor, 0)
            const avgDaily = totalEarnings / data.length
            const contribution =
                (totalEarnings / data.reduce((sum, day) => sum + (day.results?.totalKotor || 0), 0)) * 100

            performance[platform] = {
                totalEarnings,
                avgDaily,
                contribution: isNaN(contribution) ? 0 : contribution,
                trend: this.calculatePlatformTrend(platformData),
            }
        })

        return performance
    }

    calculatePlatformTrend(platformData) {
        if (platformData.length < 2) return 'stable'

        const recent = platformData.slice(-7).reduce((sum, p) => sum + p.kotor, 0) / 7
        const previous = platformData.slice(-14, -7).reduce((sum, p) => sum + p.kotor, 0) / 7

        if (recent > previous * 1.1) return 'up'
        if (recent < previous * 0.9) return 'down'
        return 'stable'
    }

    calculateTrends(data) {
        const recentWeek = data.slice(-7)
        const previousWeek = data.slice(-14, -7)

        const recentAvg =
            recentWeek.reduce((sum, day) => sum + (day.results?.pendapatanBersih || 0), 0) / recentWeek.length
        const previousAvg =
            previousWeek.reduce((sum, day) => sum + (day.results?.pendapatanBersih || 0), 0) / previousWeek.length

        const earningsTrend = recentAvg > previousAvg ? 'up' : recentAvg < previousAvg ? 'down' : 'stable'
        const trendPercentage = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0

        return {
            earnings: earningsTrend,
            percentage: Math.abs(trendPercentage).toFixed(1),
            direction: trendPercentage > 0 ? 'positive' : 'negative',
        }
    }

    calculatePredictions(data) {
        if (data.length < 7) return { nextWeek: 0, nextMonth: 0, confidence: 'low' }

        // Simple linear regression for prediction
        const earnings = data.map((day, index) => ({ x: index, y: day.results?.pendapatanBersih || 0 }))
        const { slope, intercept } = this.linearRegression(earnings)

        const nextWeekPrediction = (slope * (data.length + 7) + intercept) * 7
        const nextMonthPrediction = (slope * (data.length + 30) + intercept) * 30

        const confidence = data.length >= 30 ? 'high' : data.length >= 14 ? 'medium' : 'low'

        return {
            nextWeek: Math.max(0, nextWeekPrediction),
            nextMonth: Math.max(0, nextMonthPrediction),
            confidence,
        }
    }

    linearRegression(data) {
        const n = data.length
        const sumX = data.reduce((sum, point) => sum + point.x, 0)
        const sumY = data.reduce((sum, point) => sum + point.y, 0)
        const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0)
        const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0)

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
        const intercept = (sumY - slope * sumX) / n

        return { slope, intercept }
    }

    generateInsights() {
        const metrics = this.calculateAdvancedMetrics()
        const insights = []

        // Earnings insights
        if (metrics.trends.earnings === 'up') {
            insights.push({
                type: 'success',
                icon: '📈',
                title: 'Pendapatan Meningkat',
                message: `Pendapatan naik ${metrics.trends.percentage}% minggu ini! Pertahankan performa.`,
            })
        } else if (metrics.trends.earnings === 'down') {
            insights.push({
                type: 'warning',
                icon: '📉',
                title: 'Pendapatan Menurun',
                message: `Pendapatan turun ${metrics.trends.percentage}% minggu ini. Coba fokus ke platform terbaik.`,
            })
        }

        // Platform insights
        const bestPlatform = Object.entries(metrics.platformPerformance).sort(
            ([, a], [, b]) => b.contribution - a.contribution
        )[0]

        if (bestPlatform) {
            insights.push({
                type: 'info',
                icon: '🏆',
                title: 'Platform Terbaik',
                message: `${bestPlatform[0].toUpperCase()} kontribusi ${bestPlatform[1].contribution.toFixed(1)}% dari total pendapatan.`,
            })
        }

        // Efficiency insights
        if (metrics.avgFuelEfficiency > 15) {
            insights.push({
                type: 'success',
                icon: '⛽',
                title: 'Efisiensi BBM Baik',
                message: `Konsumsi BBM ${metrics.avgFuelEfficiency.toFixed(1)} km/liter. Sangat efisien!`,
            })
        }

        // Prediction insights
        if (metrics.predictions.confidence === 'high') {
            insights.push({
                type: 'info',
                icon: '🔮',
                title: 'Prediksi Bulan Depan',
                message: `Estimasi pendapatan bulan depan: Rp ${this.formatCurrency(metrics.predictions.nextMonth)}`,
            })
        }

        return insights
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID').format(Math.round(amount))
    }

    exportAdvancedReport() {
        const metrics = this.calculateAdvancedMetrics()
        const data = this.getAnalyticsData(30)

        let report = `RELI - LAPORAN ANALITIK LANJUTAN\n`
        report += `Periode: ${data.length} hari terakhir\n`
        report += `Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\n`

        report += `RINGKASAN PERFORMA:\n`
        report += `• Total Pendapatan: Rp ${this.formatCurrency(metrics.totalEarnings)}\n`
        report += `• Rata-rata Harian: Rp ${this.formatCurrency(metrics.avgDailyEarnings)}\n`
        report += `• Total Jarak: ${metrics.totalDistance.toFixed(1)} km\n`
        report += `• Efisiensi BBM: ${metrics.avgFuelEfficiency.toFixed(1)} km/liter\n\n`

        report += `PERFORMA PLATFORM:\n`
        Object.entries(metrics.platformPerformance).forEach(([platform, perf]) => {
            report += `• ${platform.toUpperCase()}: Rp ${this.formatCurrency(perf.totalEarnings)} (${perf.contribution.toFixed(1)}%)\n`
        })

        report += `\nTREN & PREDIKSI:\n`
        report += `• Tren Minggu Ini: ${metrics.trends.earnings === 'up' ? '📈 Naik' : metrics.trends.earnings === 'down' ? '📉 Turun' : '➡️ Stabil'} ${metrics.trends.percentage}%\n`
        report += `• Prediksi Minggu Depan: Rp ${this.formatCurrency(metrics.predictions.nextWeek)}\n`
        report += `• Prediksi Bulan Depan: Rp ${this.formatCurrency(metrics.predictions.nextMonth)}\n`

        // Download as text file
        const blob = new Blob([report], { type: 'text/plain' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reli-advanced-report-${new Date().toISOString().split('T')[0]}.txt`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    render() {
        const container = document.createElement('div')
        container.className = 'card bg-base-200 p-4 mb-4'

        const title = new Label('Advanced Analytics & Insights', '📊')
        container.appendChild(title.render())

        const metrics = this.calculateAdvancedMetrics()
        const insights = this.generateInsights()

        container.innerHTML += `
            <div class="mt-4">
                <!-- Key Metrics -->
                <div class="stats stats-vertical lg:stats-horizontal shadow w-full mb-4">
                    <div class="stat">
                        <div class="stat-figure text-primary">📈</div>
                        <div class="stat-title">Rata-rata Harian</div>
                        <div class="stat-value text-primary">Rp ${this.formatCurrency(metrics.avgDailyEarnings)}</div>
                        <div class="stat-desc">${metrics.totalDays} hari data</div>
                    </div>
                    <div class="stat">
                        <div class="stat-figure text-secondary">🏆</div>
                        <div class="stat-title">Hari Terbaik</div>
                        <div class="stat-value text-secondary">Rp ${this.formatCurrency(metrics.bestDay?.results?.pendapatanBersih || 0)}</div>
                        <div class="stat-desc">${metrics.bestDay?.date || 'N/A'}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-figure text-accent">⛽</div>
                        <div class="stat-title">Efisiensi BBM</div>
                        <div class="stat-value text-accent">${metrics.avgFuelEfficiency.toFixed(1)}</div>
                        <div class="stat-desc">km/liter</div>
                    </div>
                </div>

                <!-- Platform Performance -->
                <div class="card bg-base-100 p-4 mb-4">
                    <h3 class="font-bold mb-3">🏢 Performa Platform</h3>
                    <div class="space-y-2">
                        ${Object.entries(metrics.platformPerformance)
                            .map(
                                ([platform, perf]) => `
                            <div class="flex justify-between items-center p-2 bg-base-200 rounded">
                                <div>
                                    <span class="font-medium">${platform.toUpperCase()}</span>
                                    <span class="text-sm opacity-70 ml-2">Rp ${this.formatCurrency(perf.avgDaily)}/hari</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="badge badge-primary">${perf.contribution.toFixed(1)}%</span>
                                    <span class="text-sm ${perf.trend === 'up' ? 'text-success' : perf.trend === 'down' ? 'text-error' : 'text-base-content'}">
                                        ${perf.trend === 'up' ? '📈' : perf.trend === 'down' ? '📉' : '➡️'}
                                    </span>
                                </div>
                            </div>
                        `
                            )
                            .join('')}
                    </div>
                </div>

                <!-- Insights -->
                <div class="card bg-base-100 p-4 mb-4">
                    <h3 class="font-bold mb-3">💡 AI Insights</h3>
                    <div class="space-y-2">
                        ${insights
                            .map(
                                insight => `
                            <div class="alert alert-${insight.type === 'success' ? 'success' : insight.type === 'warning' ? 'warning' : 'info'} py-2">
                                <div class="flex items-start gap-2">
                                    <span class="text-lg">${insight.icon}</span>
                                    <div>
                                        <div class="font-medium text-sm">${insight.title}</div>
                                        <div class="text-xs">${insight.message}</div>
                                    </div>
                                </div>
                            </div>
                        `
                            )
                            .join('')}
                    </div>
                </div>

                <!-- Predictions -->
                <div class="card bg-base-100 p-4 mb-4">
                    <h3 class="font-bold mb-3">🔮 Prediksi Pendapatan</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="stat bg-base-200 rounded p-3">
                            <div class="stat-title text-xs">Minggu Depan</div>
                            <div class="stat-value text-sm">Rp ${this.formatCurrency(metrics.predictions.nextWeek)}</div>
                        </div>
                        <div class="stat bg-base-200 rounded p-3">
                            <div class="stat-title text-xs">Bulan Depan</div>
                            <div class="stat-value text-sm">Rp ${this.formatCurrency(metrics.predictions.nextMonth)}</div>
                        </div>
                    </div>
                    <div class="text-xs opacity-70 mt-2">
                        Akurasi: ${metrics.predictions.confidence === 'high' ? '🟢 Tinggi' : metrics.predictions.confidence === 'medium' ? '🟡 Sedang' : '🔴 Rendah'}
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="grid grid-cols-2 gap-2">
                    <button class="btn btn-primary btn-sm export-report-btn">
                        📄 Export Laporan
                    </button>
                    <button class="btn btn-secondary btn-sm refresh-analytics-btn">
                        🔄 Refresh Data
                    </button>
                </div>
            </div>
        `

        // Add event listeners
        setTimeout(() => {
            const exportBtn = container.querySelector('.export-report-btn')
            const refreshBtn = container.querySelector('.refresh-analytics-btn')

            if (exportBtn) {
                exportBtn.onclick = () => this.exportAdvancedReport()
            }

            if (refreshBtn) {
                refreshBtn.onclick = () => {
                    // Re-render the component
                    const parent = container.parentNode
                    const newContainer = this.render()
                    parent.replaceChild(newContainer, container)
                }
            }
        }, 0)

        return container
    }
}
