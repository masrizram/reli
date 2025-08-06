import { BaseComponent } from '../core/BaseComponent.js'
import { Card } from '../atoms/Card.js'
import { Badge } from '../atoms/Badge.js'
import { DataVisualization } from './DataVisualization.js'
import { StorageManager } from '../utils/storage.js'

/**
 * Advanced Performance Analytics with AI insights
 */
export class PerformanceAnalytics extends BaseComponent {
    constructor(props = {}) {
        super(props)

        this.props = {
            period: 7, // days
            showPredictions: true,
            showInsights: true,
            ...props,
        }

        this.storage = new StorageManager()
        this.analytics = null
    }

    afterMount() {
        this.loadAnalytics()
    }

    /**
     * Load analytics data
     */
    async loadAnalytics() {
        try {
            const data = this.storage.getLastNDays(this.props.period)
            this.analytics = data.analytics
            this.update()
        } catch (error) {
            console.error('Failed to load analytics:', error)
        }
    }

    render() {
        const container = this.createElement('div', {
            className: 'performance-analytics space-y-6',
        })

        // Header
        container.appendChild(this.renderHeader())

        if (!this.analytics) {
            container.appendChild(this.renderLoading())
            return container
        }

        // Key Metrics
        container.appendChild(this.renderKeyMetrics())

        // Performance Trends
        container.appendChild(this.renderTrends())

        // Platform Analysis
        container.appendChild(this.renderPlatformAnalysis())

        // AI Insights
        if (this.props.showInsights) {
            container.appendChild(this.renderInsights())
        }

        // Predictions
        if (this.props.showPredictions) {
            container.appendChild(this.renderPredictions())
        }

        return container
    }

    /**
     * Render header section
     */
    renderHeader() {
        const header = this.createElement('div', {
            className: 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4',
        })

        // Title
        const titleSection = this.createElement('div')
        titleSection.appendChild(
            this.createElement(
                'h2',
                {
                    className: 'text-2xl font-bold text-base-content',
                },
                '📊 Performance Analytics'
            )
        )

        titleSection.appendChild(
            this.createElement(
                'p',
                {
                    className: 'text-base-content/60',
                },
                `Analisis performa ${this.props.period} hari terakhir`
            )
        )

        // Controls
        const controls = this.createElement('div', {
            className: 'flex gap-2',
        })

        const periods = [
            { value: 7, label: '7 Hari' },
            { value: 14, label: '14 Hari' },
            { value: 30, label: '30 Hari' },
        ]

        periods.forEach(period => {
            const btn = this.createElement(
                'button',
                {
                    className: `btn btn-sm ${this.props.period === period.value ? 'btn-primary' : 'btn-outline'}`,
                    onClick: () => this.changePeriod(period.value),
                },
                period.label
            )

            controls.appendChild(btn)
        })

        header.appendChild(titleSection)
        header.appendChild(controls)

        return header
    }

    /**
     * Render loading state
     */
    renderLoading() {
        return this.createElement(
            'div',
            {
                className: 'flex items-center justify-center py-12',
            },
            this.createElement(
                'div',
                {
                    className: 'text-center',
                },
                this.createElement('div', {
                    className: 'loading loading-spinner loading-lg mb-4',
                }),
                this.createElement(
                    'p',
                    {
                        className: 'text-base-content/60',
                    },
                    'Memuat data analytics...'
                )
            )
        )
    }

    /**
     * Render key metrics cards
     */
    renderKeyMetrics() {
        const { totals, averages, trend } = this.analytics

        const metricsGrid = this.createElement('div', {
            className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
        })

        const metrics = [
            {
                title: 'Total Pendapatan',
                value: totals.earnings,
                format: 'currency',
                icon: '💰',
                trend: trend.direction,
                change: trend.percentage,
            },
            {
                title: 'Rata-rata Harian',
                value: averages.dailyEarnings,
                format: 'currency',
                icon: '📈',
                subtitle: 'Per hari',
            },
            {
                title: 'Total Jarak',
                value: totals.distance,
                format: 'number',
                icon: '🛣️',
                subtitle: 'Kilometer',
            },
            {
                title: 'Efisiensi BBM',
                value: averages.fuelEfficiency,
                format: 'decimal',
                icon: '⛽',
                subtitle: 'km/liter',
            },
        ]

        metrics.forEach(metric => {
            const card = new Card({
                className: 'hover:shadow-lg transition-shadow',
                content: this.renderMetricContent(metric),
            })

            metricsGrid.appendChild(card.render())
        })

        return metricsGrid
    }

    /**
     * Render metric card content
     */
    renderMetricContent(metric) {
        const content = this.createElement('div', {
            className: 'text-center',
        })

        // Icon
        content.appendChild(
            this.createElement(
                'div',
                {
                    className: 'text-3xl mb-2',
                },
                metric.icon
            )
        )

        // Value
        content.appendChild(
            this.createElement(
                'div',
                {
                    className: 'text-2xl font-bold text-primary mb-1',
                },
                this.formatValue(metric.value, metric.format)
            )
        )

        // Title
        content.appendChild(
            this.createElement(
                'div',
                {
                    className: 'font-medium text-base-content',
                },
                metric.title
            )
        )

        // Subtitle
        if (metric.subtitle) {
            content.appendChild(
                this.createElement(
                    'div',
                    {
                        className: 'text-sm text-base-content/60',
                    },
                    metric.subtitle
                )
            )
        }

        // Trend indicator
        if (metric.trend && metric.change) {
            const trendColor =
                metric.trend === 'up' ? 'text-success' : metric.trend === 'down' ? 'text-error' : 'text-base-content/60'
            const trendIcon = metric.trend === 'up' ? '↗️' : metric.trend === 'down' ? '↘️' : '➡️'

            content.appendChild(
                this.createElement(
                    'div',
                    {
                        className: `text-xs ${trendColor} mt-2`,
                    },
                    `${trendIcon} ${metric.change.toFixed(1)}%`
                )
            )
        }

        return content
    }

    /**
     * Render performance trends
     */
    renderTrends() {
        const data = this.storage.getLastNDays(this.props.period)
        const chartData = data.data
            .map(day => ({
                label: new Date(day.date).toLocaleDateString('id-ID', {
                    month: 'short',
                    day: 'numeric',
                }),
                value: day.results?.pendapatanBersih || 0,
            }))
            .reverse()

        const trendsCard = new Card({
            title: '📈 Trend Pendapatan',
            subtitle: 'Perkembangan pendapatan harian',
            content: new DataVisualization({
                data: chartData,
                type: 'line',
                height: 250,
                showGrid: true,
                animate: true,
            }).render(),
        })

        return trendsCard.render()
    }

    /**
     * Render platform analysis
     */
    renderPlatformAnalysis() {
        const data = this.storage.getLastNDays(this.props.period)
        const platformTotals = { grab: 0, maxim: 0, gojek: 0, indrive: 0 }

        data.data.forEach(day => {
            if (day.platforms) {
                Object.keys(platformTotals).forEach(platform => {
                    platformTotals[platform] += day.platforms[platform]?.kotor || 0
                })
            }
        })

        const chartData = Object.entries(platformTotals)
            .filter(([_, value]) => value > 0)
            .map(([platform, value]) => ({
                label: platform.charAt(0).toUpperCase() + platform.slice(1),
                value,
            }))

        const platformCard = new Card({
            title: '🏢 Analisis Platform',
            subtitle: 'Kontribusi pendapatan per platform',
            content: this.createElement(
                'div',
                {
                    className: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
                },
                // Pie chart
                new DataVisualization({
                    data: chartData,
                    type: 'pie',
                    height: 200,
                }).render(),

                // Platform rankings
                this.renderPlatformRankings(chartData)
            ),
        })

        return platformCard.render()
    }

    /**
     * Render platform rankings
     */
    renderPlatformRankings(data) {
        const rankings = this.createElement('div', {
            className: 'space-y-3',
        })

        rankings.appendChild(
            this.createElement(
                'h4',
                {
                    className: 'font-semibold text-base-content mb-3',
                },
                'Ranking Platform'
            )
        )

        const sortedData = [...data].sort((a, b) => b.value - a.value)
        const total = data.reduce((sum, d) => sum + d.value, 0)

        sortedData.forEach((platform, index) => {
            const percentage = total > 0 ? (platform.value / total) * 100 : 0
            const rankColors = ['badge-primary', 'badge-secondary', 'badge-accent', 'badge-neutral']

            const rankItem = this.createElement('div', {
                className: 'flex items-center justify-between p-3 bg-base-200 rounded-lg',
            })

            const leftSection = this.createElement('div', {
                className: 'flex items-center gap-3',
            })

            // Rank badge
            leftSection.appendChild(
                new Badge({
                    text: `#${index + 1}`,
                    variant: rankColors[index] || 'badge-neutral',
                    size: 'badge-sm',
                }).render()
            )

            // Platform name
            leftSection.appendChild(
                this.createElement(
                    'span',
                    {
                        className: 'font-medium',
                    },
                    platform.label
                )
            )

            const rightSection = this.createElement('div', {
                className: 'text-right',
            })

            // Value
            rightSection.appendChild(
                this.createElement(
                    'div',
                    {
                        className: 'font-semibold text-primary',
                    },
                    this.formatCurrency(platform.value)
                )
            )

            // Percentage
            rightSection.appendChild(
                this.createElement(
                    'div',
                    {
                        className: 'text-xs text-base-content/60',
                    },
                    `${percentage.toFixed(1)}%`
                )
            )

            rankItem.appendChild(leftSection)
            rankItem.appendChild(rightSection)
            rankings.appendChild(rankItem)
        })

        return rankings
    }

    /**
     * Render AI insights
     */
    renderInsights() {
        const insights = this.generateInsights()

        const insightsCard = new Card({
            title: '🧠 AI Insights',
            subtitle: 'Wawasan cerdas berdasarkan data Anda',
            content: this.createElement(
                'div',
                {
                    className: 'space-y-4',
                },
                ...insights.map(insight => this.renderInsight(insight))
            ),
        })

        return insightsCard.render()
    }

    /**
     * Generate AI insights
     */
    generateInsights() {
        const { averages, totals, bestDay, worstDay, trend } = this.analytics
        const insights = []

        // Trend insight
        if (trend.direction === 'up') {
            insights.push({
                type: 'success',
                icon: '📈',
                title: 'Performa Meningkat',
                message: `Pendapatan Anda meningkat ${trend.percentage.toFixed(1)}% dalam periode ini. Pertahankan strategi yang sedang berjalan!`,
            })
        } else if (trend.direction === 'down') {
            insights.push({
                type: 'warning',
                icon: '📉',
                title: 'Performa Menurun',
                message: `Pendapatan menurun ${trend.percentage.toFixed(1)}%. Pertimbangkan untuk mengoptimalkan waktu kerja atau area operasi.`,
            })
        }

        // Efficiency insight
        if (averages.fuelEfficiency < 10) {
            insights.push({
                type: 'warning',
                icon: '⛽',
                title: 'Efisiensi BBM Rendah',
                message: `Efisiensi BBM Anda ${averages.fuelEfficiency.toFixed(1)} km/liter. Coba kurangi idle time dan pilih rute yang lebih efisien.`,
            })
        } else if (averages.fuelEfficiency > 15) {
            insights.push({
                type: 'success',
                icon: '🌟',
                title: 'Efisiensi BBM Excellent',
                message: `Efisiensi BBM sangat baik: ${averages.fuelEfficiency.toFixed(1)} km/liter. Anda menghemat biaya operasional dengan baik!`,
            })
        }

        // Best day insight
        if (bestDay && worstDay) {
            const bestEarnings = bestDay.results?.pendapatanBersih || 0
            const worstEarnings = worstDay.results?.pendapatanBersih || 0
            const difference = bestEarnings - worstEarnings

            if (difference > 50000) {
                insights.push({
                    type: 'info',
                    icon: '🎯',
                    title: 'Konsistensi Perlu Ditingkatkan',
                    message: `Gap antara hari terbaik (${this.formatCurrency(bestEarnings)}) dan terburuk (${this.formatCurrency(worstEarnings)}) cukup besar. Analisis pola hari terbaik untuk konsistensi.`,
                })
            }
        }

        // Daily average insight
        if (averages.dailyEarnings > 200000) {
            insights.push({
                type: 'success',
                icon: '💎',
                title: 'Performa Premium',
                message: `Rata-rata harian ${this.formatCurrency(averages.dailyEarnings)} menunjukkan performa yang sangat baik. Anda termasuk driver top performer!`,
            })
        }

        return insights.length > 0
            ? insights
            : [
                  {
                      type: 'info',
                      icon: '📊',
                      title: 'Butuh Lebih Banyak Data',
                      message: 'Kumpulkan lebih banyak data untuk mendapatkan insights yang lebih akurat dan personal.',
                  },
              ]
    }

    /**
     * Render single insight
     */
    renderInsight(insight) {
        const typeColors = {
            success: 'border-success bg-success/10',
            warning: 'border-warning bg-warning/10',
            error: 'border-error bg-error/10',
            info: 'border-info bg-info/10',
        }

        return this.createElement(
            'div',
            {
                className: `border-l-4 p-4 rounded-r-lg ${typeColors[insight.type] || typeColors.info}`,
            },
            this.createElement(
                'div',
                {
                    className: 'flex items-start gap-3',
                },
                this.createElement(
                    'div',
                    {
                        className: 'text-xl',
                    },
                    insight.icon
                ),

                this.createElement(
                    'div',
                    {
                        className: 'flex-1',
                    },
                    this.createElement(
                        'h4',
                        {
                            className: 'font-semibold text-base-content mb-1',
                        },
                        insight.title
                    ),

                    this.createElement(
                        'p',
                        {
                            className: 'text-sm text-base-content/80',
                        },
                        insight.message
                    )
                )
            )
        )
    }

    /**
     * Render predictions
     */
    renderPredictions() {
        const predictions = this.generatePredictions()

        const predictionsCard = new Card({
            title: '🔮 Prediksi & Rekomendasi',
            subtitle: 'Proyeksi berdasarkan tren saat ini',
            content: this.createElement(
                'div',
                {
                    className: 'grid grid-cols-1 md:grid-cols-2 gap-4',
                },
                ...predictions.map(prediction => this.renderPrediction(prediction))
            ),
        })

        return predictionsCard.render()
    }

    /**
     * Generate predictions
     */
    generatePredictions() {
        const { averages, trend } = this.analytics

        // Weekly prediction
        const weeklyPrediction = averages.dailyEarnings * 7
        const weeklyAdjustment = trend.direction === 'up' ? 1.1 : trend.direction === 'down' ? 0.9 : 1.0
        const adjustedWeekly = weeklyPrediction * weeklyAdjustment

        // Monthly prediction
        const monthlyPrediction = averages.dailyEarnings * 30 * weeklyAdjustment

        return [
            {
                title: 'Prediksi Minggu Depan',
                value: adjustedWeekly,
                format: 'currency',
                icon: '📅',
                confidence: trend.direction === 'stable' ? 'Tinggi' : 'Sedang',
            },
            {
                title: 'Proyeksi Bulanan',
                value: monthlyPrediction,
                format: 'currency',
                icon: '🗓️',
                confidence: 'Sedang',
            },
            {
                title: 'Target Harian Optimal',
                value: averages.dailyEarnings * 1.2,
                format: 'currency',
                icon: '🎯',
                confidence: 'Tinggi',
            },
            {
                title: 'Potensi Penghematan BBM',
                value: averages.dailyFuelCost * 0.15,
                format: 'currency',
                icon: '💡',
                confidence: 'Sedang',
            },
        ]
    }

    /**
     * Render single prediction
     */
    renderPrediction(prediction) {
        return this.createElement(
            'div',
            {
                className: 'bg-base-200 rounded-lg p-4 text-center hover:bg-base-300 transition-colors',
            },
            this.createElement(
                'div',
                {
                    className: 'text-2xl mb-2',
                },
                prediction.icon
            ),

            this.createElement(
                'div',
                {
                    className: 'text-xl font-bold text-primary mb-1',
                },
                this.formatValue(prediction.value, prediction.format)
            ),

            this.createElement(
                'div',
                {
                    className: 'font-medium text-base-content mb-2',
                },
                prediction.title
            ),

            new Badge({
                text: `Confidence: ${prediction.confidence}`,
                variant: prediction.confidence === 'Tinggi' ? 'badge-success' : 'badge-warning',
                size: 'badge-sm',
            }).render()
        )
    }

    /**
     * Change analysis period
     */
    changePeriod(period) {
        this.update({ period })
        this.loadAnalytics()
    }

    /**
     * Format value based on type
     */
    formatValue(value, format) {
        switch (format) {
            case 'currency':
                return this.formatCurrency(value)
            case 'percentage':
                return `${value.toFixed(1)}%`
            case 'number':
                return value.toLocaleString('id-ID')
            case 'decimal':
                return value.toFixed(2)
            default:
                return value.toString()
        }
    }
}
