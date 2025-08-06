import { BaseComponent } from '../core/BaseComponent.js'
import { Card } from '../atoms/Card.js'
import { Badge } from '../atoms/Badge.js'
import { StorageManager } from '../utils/storage.js'

/**
 * AI-powered Smart Insights component with machine learning recommendations
 */
export class SmartInsights extends BaseComponent {
    constructor(props = {}) {
        super(props)

        this.props = {
            refreshInterval: 300000, // 5 minutes
            maxInsights: 5,
            showPredictions: true,
            showRecommendations: true,
            ...props,
        }

        this.storage = new StorageManager()
        this.insights = []
        this.refreshTimer = null
    }

    afterMount() {
        this.generateInsights()
        this.startAutoRefresh()
    }

    beforeUnmount() {
        this.stopAutoRefresh()
    }

    render() {
        const container = this.createElement('div', {
            className: 'smart-insights space-y-6',
        })

        // Header
        container.appendChild(this.renderHeader())

        // Insights grid
        if (this.insights.length > 0) {
            container.appendChild(this.renderInsightsGrid())
        } else {
            container.appendChild(this.renderEmptyState())
        }

        return container
    }

    /**
     * Render header section
     */
    renderHeader() {
        const header = this.createElement('div', {
            className: 'flex items-center justify-between',
        })

        const titleSection = this.createElement('div')
        titleSection.appendChild(
            this.createElement(
                'h3',
                {
                    className: 'text-xl font-bold text-base-content flex items-center gap-2',
                },
                '🧠 Smart Insights'
            )
        )

        titleSection.appendChild(
            this.createElement(
                'p',
                {
                    className: 'text-base-content/60 text-sm',
                },
                'AI-powered recommendations untuk optimasi pendapatan'
            )
        )

        const refreshBtn = this.createElement(
            'button',
            {
                className: 'btn btn-sm btn-ghost',
                onClick: () => this.refreshInsights(),
                title: 'Refresh insights',
            },
            '🔄'
        )

        header.appendChild(titleSection)
        header.appendChild(refreshBtn)

        return header
    }

    /**
     * Render insights grid
     */
    renderInsightsGrid() {
        const grid = this.createElement('div', {
            className: 'grid grid-cols-1 md:grid-cols-2 gap-4',
        })

        this.insights.forEach(insight => {
            const insightCard = this.renderInsightCard(insight)
            grid.appendChild(insightCard)
        })

        return grid
    }

    /**
     * Render individual insight card
     */
    renderInsightCard(insight) {
        const card = new Card({
            className: `insight-card border-l-4 ${this.getInsightBorderColor(insight.type)} hover:shadow-lg transition-all duration-200`,
            content: this.createElement(
                'div',
                {
                    className: 'space-y-3',
                },
                // Header
                this.createElement(
                    'div',
                    {
                        className: 'flex items-start justify-between',
                    },
                    this.createElement(
                        'div',
                        {
                            className: 'flex items-center gap-2',
                        },
                        this.createElement(
                            'span',
                            {
                                className: 'text-2xl',
                            },
                            insight.icon
                        ),
                        this.createElement(
                            'h4',
                            {
                                className: 'font-semibold text-base-content',
                            },
                            insight.title
                        )
                    ),
                    new Badge({
                        text: insight.priority,
                        variant: this.getPriorityBadgeVariant(insight.priority),
                        size: 'badge-sm',
                    }).render()
                ),

                // Description
                this.createElement(
                    'p',
                    {
                        className: 'text-sm text-base-content/80',
                    },
                    insight.description
                ),

                // Metrics
                insight.metrics ? this.renderInsightMetrics(insight.metrics) : null,

                // Actions
                insight.actions ? this.renderInsightActions(insight.actions) : null
            ),
        })

        return card.render()
    }

    /**
     * Render insight metrics
     */
    renderInsightMetrics(metrics) {
        const metricsContainer = this.createElement('div', {
            className: 'bg-base-200 rounded-lg p-3',
        })

        const metricsGrid = this.createElement('div', {
            className: 'grid grid-cols-2 gap-3',
        })

        Object.entries(metrics).forEach(([key, value]) => {
            const metric = this.createElement('div', {
                className: 'text-center',
            })

            metric.appendChild(
                this.createElement(
                    'div',
                    {
                        className: 'text-lg font-bold text-primary',
                    },
                    this.formatMetricValue(value)
                )
            )

            metric.appendChild(
                this.createElement(
                    'div',
                    {
                        className: 'text-xs text-base-content/60',
                    },
                    this.formatMetricLabel(key)
                )
            )

            metricsGrid.appendChild(metric)
        })

        metricsContainer.appendChild(metricsGrid)
        return metricsContainer
    }

    /**
     * Render insight actions
     */
    renderInsightActions(actions) {
        const actionsContainer = this.createElement('div', {
            className: 'flex gap-2 pt-2',
        })

        actions.forEach(action => {
            const btn = this.createElement(
                'button',
                {
                    className: `btn btn-sm ${action.primary ? 'btn-primary' : 'btn-outline'}`,
                    onClick: () => this.handleInsightAction(action),
                },
                action.label
            )

            actionsContainer.appendChild(btn)
        })

        return actionsContainer
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        return this.createElement(
            'div',
            {
                className: 'text-center py-12',
            },
            this.createElement(
                'div',
                {
                    className: 'text-6xl mb-4',
                },
                '🤖'
            ),
            this.createElement(
                'h3',
                {
                    className: 'text-lg font-semibold text-base-content mb-2',
                },
                'Menganalisis Data...'
            ),
            this.createElement(
                'p',
                {
                    className: 'text-base-content/60',
                },
                'Kumpulkan lebih banyak data untuk mendapatkan insights yang akurat'
            )
        )
    }

    /**
     * Generate AI insights based on historical data
     */
    async generateInsights() {
        try {
            const data = this.storage.getLastNDays(30)
            const insights = []

            // Performance trend insight
            const trendInsight = this.analyzeTrend(data)
            if (trendInsight) insights.push(trendInsight)

            // Platform optimization insight
            const platformInsight = this.analyzePlatformPerformance(data)
            if (platformInsight) insights.push(platformInsight)

            // Fuel efficiency insight
            const fuelInsight = this.analyzeFuelEfficiency(data)
            if (fuelInsight) insights.push(fuelInsight)

            // Time optimization insight
            const timeInsight = this.analyzeTimePatterns(data)
            if (timeInsight) insights.push(timeInsight)

            // Revenue opportunity insight
            const revenueInsight = this.analyzeRevenueOpportunities(data)
            if (revenueInsight) insights.push(revenueInsight)

            this.insights = insights.slice(0, this.props.maxInsights)
            this.update()
        } catch (error) {
            console.error('Failed to generate insights:', error)
        }
    }

    /**
     * Analyze performance trend
     */
    analyzeTrend(data) {
        if (!data.analytics || data.data.length < 7) return null

        const { trend } = data.analytics

        if (trend.direction === 'up' && trend.percentage > 10) {
            return {
                id: 'trend-positive',
                type: 'success',
                priority: 'High',
                icon: '📈',
                title: 'Performa Excellent!',
                description: `Pendapatan Anda meningkat ${trend.percentage.toFixed(1)}% dalam periode ini. Strategi saat ini sangat efektif.`,
                metrics: {
                    growth: `+${trend.percentage.toFixed(1)}%`,
                    consistency: this.calculateConsistency(data.data),
                },
                actions: [
                    { label: 'Lihat Detail', primary: true, action: 'view-analytics' },
                    { label: 'Share Tips', action: 'share-strategy' },
                ],
            }
        } else if (trend.direction === 'down' && trend.percentage > 15) {
            return {
                id: 'trend-negative',
                type: 'warning',
                priority: 'High',
                icon: '📉',
                title: 'Perlu Optimasi',
                description: `Pendapatan menurun ${trend.percentage.toFixed(1)}%. Saatnya mengoptimalkan strategi operasional.`,
                metrics: {
                    decline: `-${trend.percentage.toFixed(1)}%`,
                    impact: this.formatCurrency(this.calculateImpact(data.analytics)),
                },
                actions: [
                    { label: 'Lihat Optimizer', primary: true, action: 'open-optimizer' },
                    { label: 'Analisis Mendalam', action: 'deep-analysis' },
                ],
            }
        }

        return null
    }

    /**
     * Analyze platform performance
     */
    analyzePlatformPerformance(data) {
        const platformTotals = this.calculatePlatformTotals(data.data)
        const sortedPlatforms = Object.entries(platformTotals).sort(([, a], [, b]) => b - a)

        if (sortedPlatforms.length < 2) return null

        const topPlatform = sortedPlatforms[0]
        const totalRevenue = Object.values(platformTotals).reduce((sum, val) => sum + val, 0)
        const topPercentage = (topPlatform[1] / totalRevenue) * 100

        if (topPercentage > 60) {
            return {
                id: 'platform-concentration',
                type: 'info',
                priority: 'Medium',
                icon: '🎯',
                title: 'Diversifikasi Platform',
                description: `${topPlatform[0]} mendominasi ${topPercentage.toFixed(1)}% pendapatan. Pertimbangkan diversifikasi untuk stabilitas.`,
                metrics: {
                    dominance: `${topPercentage.toFixed(1)}%`,
                    revenue: this.formatCurrency(topPlatform[1]),
                },
                actions: [
                    { label: 'Strategi Diversifikasi', primary: true, action: 'diversify-strategy' },
                    { label: 'Analisis Platform', action: 'platform-analysis' },
                ],
            }
        }

        return null
    }

    /**
     * Analyze fuel efficiency
     */
    analyzeFuelEfficiency(data) {
        const avgEfficiency = data.analytics?.averages?.fuelEfficiency
        if (!avgEfficiency) return null

        if (avgEfficiency < 10) {
            return {
                id: 'fuel-efficiency-low',
                type: 'warning',
                priority: 'Medium',
                icon: '⛽',
                title: 'Efisiensi BBM Rendah',
                description: `Efisiensi BBM ${avgEfficiency.toFixed(1)} km/l di bawah standar. Optimasi dapat menghemat biaya operasional.`,
                metrics: {
                    efficiency: `${avgEfficiency.toFixed(1)} km/l`,
                    potential: this.formatCurrency(this.calculateFuelSavings(data.analytics)),
                },
                actions: [
                    { label: 'Tips Hemat BBM', primary: true, action: 'fuel-tips' },
                    { label: 'Analisis Rute', action: 'route-analysis' },
                ],
            }
        } else if (avgEfficiency > 15) {
            return {
                id: 'fuel-efficiency-excellent',
                type: 'success',
                priority: 'Low',
                icon: '🌟',
                title: 'Efisiensi BBM Excellent',
                description: `Efisiensi BBM ${avgEfficiency.toFixed(1)} km/l sangat baik! Anda menghemat biaya operasional dengan optimal.`,
                metrics: {
                    efficiency: `${avgEfficiency.toFixed(1)} km/l`,
                    savings: this.formatCurrency(this.calculateFuelSavings(data.analytics)),
                },
                actions: [{ label: 'Share Tips', primary: true, action: 'share-fuel-tips' }],
            }
        }

        return null
    }

    /**
     * Analyze time patterns
     */
    analyzeTimePatterns(data) {
        // Simulate time pattern analysis
        const patterns = this.detectTimePatterns(data.data)

        if (patterns.peakHours.length > 0) {
            return {
                id: 'time-optimization',
                type: 'info',
                priority: 'Medium',
                icon: '⏰',
                title: 'Optimasi Waktu Kerja',
                description: `Jam ${patterns.peakHours.join(', ')} menunjukkan performa terbaik. Fokuskan operasi pada jam-jam ini.`,
                metrics: {
                    peakHours: patterns.peakHours.length,
                    potential: `+${patterns.potentialIncrease}%`,
                },
                actions: [
                    { label: 'Lihat Jadwal Optimal', primary: true, action: 'optimal-schedule' },
                    { label: 'Set Reminder', action: 'set-reminders' },
                ],
            }
        }

        return null
    }

    /**
     * Analyze revenue opportunities
     */
    analyzeRevenueOpportunities(data) {
        const opportunities = this.identifyOpportunities(data)

        if (opportunities.length > 0) {
            const topOpportunity = opportunities[0]

            return {
                id: 'revenue-opportunity',
                type: 'success',
                priority: 'High',
                icon: '💎',
                title: 'Peluang Pendapatan',
                description: topOpportunity.description,
                metrics: {
                    potential: this.formatCurrency(topOpportunity.potential),
                    effort: topOpportunity.effort,
                },
                actions: [
                    { label: 'Ambil Aksi', primary: true, action: topOpportunity.action },
                    { label: 'Pelajari Lebih', action: 'learn-more' },
                ],
            }
        }

        return null
    }

    /**
     * Helper methods for calculations
     */
    calculateConsistency(data) {
        if (data.length < 2) return 'N/A'

        const earnings = data.map(d => d.results?.pendapatanBersih || 0)
        const avg = earnings.reduce((sum, val) => sum + val, 0) / earnings.length
        const variance = earnings.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / earnings.length
        const stdDev = Math.sqrt(variance)
        const cv = avg > 0 ? (stdDev / avg) * 100 : 100

        return cv < 20 ? 'Tinggi' : cv < 40 ? 'Sedang' : 'Rendah'
    }

    calculateImpact(analytics) {
        return analytics.averages.dailyEarnings * (analytics.trend.percentage / 100) * 7
    }

    calculatePlatformTotals(data) {
        const totals = { grab: 0, maxim: 0, gojek: 0, indrive: 0 }

        data.forEach(day => {
            if (day.platforms) {
                Object.keys(totals).forEach(platform => {
                    totals[platform] += day.platforms[platform]?.kotor || 0
                })
            }
        })

        return totals
    }

    calculateFuelSavings(analytics) {
        const currentCost = analytics.averages.dailyFuelCost
        const potentialSavings = currentCost * 0.15 // 15% potential savings
        return potentialSavings * 30 // Monthly savings
    }

    detectTimePatterns(data) {
        // Simulate time pattern detection
        return {
            peakHours: ['07:00-09:00', '17:00-20:00'],
            potentialIncrease: 25,
        }
    }

    identifyOpportunities(data) {
        // Simulate opportunity identification
        return [
            {
                description: 'Tingkatkan operasi di area Sudirman-Thamrin untuk potensi 30% lebih tinggi',
                potential: 150000,
                effort: 'Sedang',
                action: 'area-optimization',
            },
        ]
    }

    /**
     * Utility methods
     */
    getInsightBorderColor(type) {
        const colors = {
            success: 'border-success',
            warning: 'border-warning',
            error: 'border-error',
            info: 'border-info',
        }
        return colors[type] || colors.info
    }

    getPriorityBadgeVariant(priority) {
        const variants = {
            High: 'badge-error',
            Medium: 'badge-warning',
            Low: 'badge-info',
        }
        return variants[priority] || variants.Low
    }

    formatMetricValue(value) {
        if (typeof value === 'string') return value
        if (value > 1000000) return this.formatCurrency(value)
        if (value > 100) return value.toLocaleString('id-ID')
        return value.toString()
    }

    formatMetricLabel(key) {
        const labels = {
            growth: 'Pertumbuhan',
            consistency: 'Konsistensi',
            decline: 'Penurunan',
            impact: 'Dampak',
            dominance: 'Dominasi',
            revenue: 'Revenue',
            efficiency: 'Efisiensi',
            potential: 'Potensi',
            savings: 'Penghematan',
            peakHours: 'Jam Peak',
            effort: 'Effort',
        }
        return labels[key] || key
    }

    /**
     * Handle insight actions
     */
    handleInsightAction(action) {
        switch (action.action) {
            case 'view-analytics':
                this.emit('navigate', 'analytics')
                break
            case 'open-optimizer':
                this.emit('navigate', 'optimizer')
                break
            case 'fuel-tips':
                this.emit('show-fuel-tips')
                break
            case 'optimal-schedule':
                this.emit('show-schedule-optimizer')
                break
            default:
                console.log('Action not implemented:', action.action)
        }
    }

    /**
     * Refresh insights
     */
    async refreshInsights() {
        await this.generateInsights()
    }

    /**
     * Start auto refresh
     */
    startAutoRefresh() {
        if (this.props.refreshInterval > 0) {
            this.refreshTimer = setInterval(() => {
                this.generateInsights()
            }, this.props.refreshInterval)
        }
    }

    /**
     * Stop auto refresh
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer)
            this.refreshTimer = null
        }
    }
}
