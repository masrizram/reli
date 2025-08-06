import { BaseComponent } from '../core/BaseComponent.js'
import { Card } from '../atoms/Card.js'
import { Badge } from '../atoms/Badge.js'
import { ProgressBar } from '../atoms/ProgressBar.js'

/**
 * Real-time metrics dashboard with live updates and animations
 */
export class RealtimeMetrics extends BaseComponent {
    constructor(props = {}) {
        super(props)

        this.props = {
            updateInterval: 5000, // 5 seconds
            showAnimations: true,
            showTargets: true,
            targets: {
                dailyEarnings: 300000,
                fuelEfficiency: 12,
                tripCount: 20,
                rating: 4.8,
            },
            ...props,
        }

        this.metrics = {
            currentEarnings: 0,
            fuelEfficiency: 0,
            tripCount: 0,
            rating: 0,
            activeTime: 0,
            distance: 0,
        }

        this.updateTimer = null
        this.animationFrameId = null
    }

    afterMount() {
        this.startRealTimeUpdates()
        this.subscribeToStateChanges()
    }

    beforeUnmount() {
        this.stopRealTimeUpdates()
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId)
        }
    }

    render() {
        const container = this.createElement('div', {
            className: 'realtime-metrics space-y-6',
        })

        // Header
        container.appendChild(this.renderHeader())

        // Main metrics grid
        container.appendChild(this.renderMetricsGrid())

        // Performance indicators
        container.appendChild(this.renderPerformanceIndicators())

        // Live activity feed
        container.appendChild(this.renderActivityFeed())

        return container
    }

    /**
     * Render header with live status
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
                '📊 Real-time Metrics',
                this.createElement('div', {
                    className: 'w-2 h-2 bg-success rounded-full animate-pulse',
                })
            )
        )

        titleSection.appendChild(
            this.createElement(
                'p',
                {
                    className: 'text-base-content/60 text-sm',
                },
                'Live performance monitoring'
            )
        )

        // Status badges
        const statusSection = this.createElement('div', {
            className: 'flex gap-2',
        })

        statusSection.appendChild(
            new Badge({
                text: 'LIVE',
                variant: 'badge-success',
                size: 'badge-sm',
            }).render()
        )

        statusSection.appendChild(
            new Badge({
                text: `Updated ${this.getLastUpdateTime()}`,
                variant: 'badge-ghost',
                size: 'badge-sm',
            }).render()
        )

        header.appendChild(titleSection)
        header.appendChild(statusSection)

        return header
    }

    /**
     * Render main metrics grid
     */
    renderMetricsGrid() {
        const grid = this.createElement('div', {
            className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
        })

        const metricsConfig = [
            {
                key: 'currentEarnings',
                title: 'Pendapatan Hari Ini',
                icon: '💰',
                format: 'currency',
                color: 'primary',
                target: this.props.targets.dailyEarnings,
            },
            {
                key: 'fuelEfficiency',
                title: 'Efisiensi BBM',
                icon: '⛽',
                format: 'decimal',
                suffix: ' km/l',
                color: 'success',
                target: this.props.targets.fuelEfficiency,
            },
            {
                key: 'tripCount',
                title: 'Jumlah Trip',
                icon: '🚗',
                format: 'number',
                color: 'info',
                target: this.props.targets.tripCount,
            },
            {
                key: 'rating',
                title: 'Rating',
                icon: '⭐',
                format: 'rating',
                color: 'warning',
                target: this.props.targets.rating,
            },
        ]

        metricsConfig.forEach(config => {
            const metricCard = this.renderMetricCard(config)
            grid.appendChild(metricCard)
        })

        return grid
    }

    /**
     * Render individual metric card
     */
    renderMetricCard(config) {
        const value = this.metrics[config.key] || 0
        const target = config.target || 0
        const progress = target > 0 ? Math.min((value / target) * 100, 100) : 0
        const isOnTarget = progress >= 80

        const card = new Card({
            className: `metric-card hover:shadow-lg transition-all duration-200 ${this.props.showAnimations ? 'animate-fade-in-up' : ''}`,
            content: this.createElement(
                'div',
                {
                    className: 'space-y-4',
                },
                // Header
                this.createElement(
                    'div',
                    {
                        className: 'flex items-center justify-between',
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
                            config.icon
                        ),
                        this.createElement(
                            'span',
                            {
                                className: 'text-sm font-medium text-base-content/60',
                            },
                            config.title
                        )
                    ),
                    isOnTarget
                        ? new Badge({
                              text: '🎯',
                              variant: 'badge-success',
                              size: 'badge-sm',
                          }).render()
                        : null
                ),

                // Value
                this.createElement(
                    'div',
                    {
                        className: 'space-y-2',
                    },
                    this.createElement(
                        'div',
                        {
                            className: `text-3xl font-bold text-${config.color} metric-value`,
                            'data-value': value,
                        },
                        this.formatMetricValue(value, config.format, config.suffix)
                    ),

                    // Progress bar
                    this.props.showTargets && target > 0
                        ? new ProgressBar({
                              value: progress,
                              color: config.color,
                              size: 'sm',
                              animated: true,
                          }).render()
                        : null
                ),

                // Target info
                this.props.showTargets && target > 0
                    ? this.createElement(
                          'div',
                          {
                              className: 'text-xs text-base-content/60 flex justify-between',
                          },
                          this.createElement(
                              'span',
                              {},
                              `Target: ${this.formatMetricValue(target, config.format, config.suffix)}`
                          ),
                          this.createElement('span', {}, `${progress.toFixed(0)}%`)
                      )
                    : null
            ),
        })

        return card.render()
    }

    /**
     * Render performance indicators
     */
    renderPerformanceIndicators() {
        const indicators = this.createElement('div', {
            className: 'grid grid-cols-1 md:grid-cols-3 gap-4',
        })

        // Efficiency indicator
        indicators.appendChild(this.renderEfficiencyIndicator())

        // Trend indicator
        indicators.appendChild(this.renderTrendIndicator())

        // Activity indicator
        indicators.appendChild(this.renderActivityIndicator())

        return indicators
    }

    /**
     * Render efficiency indicator
     */
    renderEfficiencyIndicator() {
        const efficiency = this.calculateOverallEfficiency()

        return new Card({
            title: '⚡ Efisiensi Operasional',
            content: this.createElement(
                'div',
                {
                    className: 'text-center space-y-3',
                },
                this.createElement(
                    'div',
                    {
                        className: `text-4xl font-bold ${this.getEfficiencyColor(efficiency)}`,
                    },
                    `${efficiency}%`
                ),

                this.createElement(
                    'div',
                    {
                        className: 'text-sm text-base-content/60',
                    },
                    this.getEfficiencyLabel(efficiency)
                ),

                new ProgressBar({
                    value: efficiency,
                    color: this.getEfficiencyProgressColor(efficiency),
                    size: 'sm',
                    animated: true,
                }).render()
            ),
        }).render()
    }

    /**
     * Render trend indicator
     */
    renderTrendIndicator() {
        const trend = this.calculateTrend()

        return new Card({
            title: '📈 Trend Performa',
            content: this.createElement(
                'div',
                {
                    className: 'text-center space-y-3',
                },
                this.createElement(
                    'div',
                    {
                        className: 'text-3xl',
                    },
                    trend.icon
                ),

                this.createElement(
                    'div',
                    {
                        className: `text-lg font-semibold ${trend.color}`,
                    },
                    trend.label
                ),

                this.createElement(
                    'div',
                    {
                        className: 'text-sm text-base-content/60',
                    },
                    trend.description
                )
            ),
        }).render()
    }

    /**
     * Render activity indicator
     */
    renderActivityIndicator() {
        const activityLevel = this.calculateActivityLevel()

        return new Card({
            title: '🔥 Level Aktivitas',
            content: this.createElement(
                'div',
                {
                    className: 'space-y-3',
                },
                this.createElement(
                    'div',
                    {
                        className: 'flex items-center justify-between',
                    },
                    this.createElement(
                        'span',
                        {
                            className: 'text-lg font-semibold',
                        },
                        activityLevel.label
                    ),
                    this.createElement(
                        'span',
                        {
                            className: 'text-2xl',
                        },
                        activityLevel.icon
                    )
                ),

                new ProgressBar({
                    value: activityLevel.percentage,
                    color: activityLevel.color,
                    size: 'md',
                    animated: true,
                    striped: true,
                }).render(),

                this.createElement(
                    'div',
                    {
                        className: 'text-sm text-base-content/60',
                    },
                    `Aktif selama ${this.formatDuration(this.metrics.activeTime)}`
                )
            ),
        }).render()
    }

    /**
     * Render live activity feed
     */
    renderActivityFeed() {
        const activities = this.getRecentActivities()

        const feed = new Card({
            title: '📱 Aktivitas Terkini',
            content: this.createElement(
                'div',
                {
                    className: 'space-y-3 max-h-64 overflow-y-auto',
                },
                ...activities.map(activity => this.renderActivityItem(activity))
            ),
        })

        return feed.render()
    }

    /**
     * Render activity item
     */
    renderActivityItem(activity) {
        return this.createElement(
            'div',
            {
                className: 'flex items-center gap-3 p-2 rounded-lg bg-base-200 hover:bg-base-300 transition-colors',
            },
            this.createElement(
                'div',
                {
                    className: 'text-lg',
                },
                activity.icon
            ),

            this.createElement(
                'div',
                {
                    className: 'flex-1',
                },
                this.createElement(
                    'div',
                    {
                        className: 'font-medium text-sm',
                    },
                    activity.title
                ),
                this.createElement(
                    'div',
                    {
                        className: 'text-xs text-base-content/60',
                    },
                    activity.description
                )
            ),

            this.createElement(
                'div',
                {
                    className: 'text-xs text-base-content/60',
                },
                activity.time
            )
        )
    }

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        this.updateTimer = setInterval(() => {
            this.updateMetrics()
        }, this.props.updateInterval)
    }

    /**
     * Stop real-time updates
     */
    stopRealTimeUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer)
            this.updateTimer = null
        }
    }

    /**
     * Subscribe to state changes
     */
    subscribeToStateChanges() {
        this.subscribeToState('results', results => {
            this.metrics.currentEarnings = results.pendapatanBersih || 0
            this.animateValueChange('currentEarnings')
        })

        this.subscribeToState('fuel', fuel => {
            this.metrics.fuelEfficiency = fuel.konsumsi || 0
            this.metrics.distance = fuel.jarak || 0
            this.animateValueChange('fuelEfficiency')
        })
    }

    /**
     * Update metrics with simulated real-time data
     */
    updateMetrics() {
        // Simulate real-time updates
        this.metrics.activeTime += this.props.updateInterval
        this.metrics.tripCount = Math.floor(Math.random() * 25) + 1
        this.metrics.rating = 4.2 + Math.random() * 0.8

        this.update()
    }

    /**
     * Animate value changes
     */
    animateValueChange(metricKey) {
        if (!this.props.showAnimations) return

        const elements = document.querySelectorAll(`[data-value]`)
        elements.forEach(element => {
            element.classList.add('animate-pulse')
            setTimeout(() => {
                element.classList.remove('animate-pulse')
            }, 1000)
        })
    }

    /**
     * Calculate overall efficiency
     */
    calculateOverallEfficiency() {
        const targets = this.props.targets
        const metrics = this.metrics

        const efficiencyScores = [
            targets.dailyEarnings > 0 ? Math.min((metrics.currentEarnings / targets.dailyEarnings) * 100, 100) : 0,
            targets.fuelEfficiency > 0 ? Math.min((metrics.fuelEfficiency / targets.fuelEfficiency) * 100, 100) : 0,
            targets.tripCount > 0 ? Math.min((metrics.tripCount / targets.tripCount) * 100, 100) : 0,
            targets.rating > 0 ? Math.min((metrics.rating / targets.rating) * 100, 100) : 0,
        ]

        return Math.round(efficiencyScores.reduce((sum, score) => sum + score, 0) / efficiencyScores.length)
    }

    /**
     * Calculate trend
     */
    calculateTrend() {
        // Simulate trend calculation
        const trendValue = Math.random()

        if (trendValue > 0.6) {
            return {
                icon: '📈',
                label: 'Meningkat',
                description: 'Performa sedang naik',
                color: 'text-success',
            }
        } else if (trendValue < 0.4) {
            return {
                icon: '📉',
                label: 'Menurun',
                description: 'Perlu optimasi',
                color: 'text-error',
            }
        } else {
            return {
                icon: '➡️',
                label: 'Stabil',
                description: 'Performa konsisten',
                color: 'text-info',
            }
        }
    }

    /**
     * Calculate activity level
     */
    calculateActivityLevel() {
        const activeHours = this.metrics.activeTime / (1000 * 60 * 60)
        const percentage = Math.min((activeHours / 8) * 100, 100)

        if (percentage > 80) {
            return {
                label: 'Sangat Aktif',
                icon: '🔥',
                color: 'success',
                percentage,
            }
        } else if (percentage > 50) {
            return {
                label: 'Aktif',
                icon: '⚡',
                color: 'warning',
                percentage,
            }
        } else {
            return {
                label: 'Kurang Aktif',
                icon: '😴',
                color: 'error',
                percentage,
            }
        }
    }

    /**
     * Get recent activities
     */
    getRecentActivities() {
        // Simulate recent activities
        return [
            {
                icon: '🚗',
                title: 'Trip Completed',
                description: 'Sudirman → Senayan (Rp 25,000)',
                time: '2 menit lalu',
            },
            {
                icon: '⛽',
                title: 'Fuel Update',
                description: 'Efisiensi BBM: 12.5 km/l',
                time: '5 menit lalu',
            },
            {
                icon: '💰',
                title: 'Earnings Update',
                description: 'Target harian 75% tercapai',
                time: '10 menit lalu',
            },
        ]
    }

    /**
     * Utility methods
     */
    formatMetricValue(value, format, suffix = '') {
        switch (format) {
            case 'currency':
                return this.formatCurrency(value)
            case 'decimal':
                return value.toFixed(1) + suffix
            case 'number':
                return Math.round(value).toString()
            case 'rating':
                return value.toFixed(1) + '/5'
            default:
                return value.toString()
        }
    }

    getEfficiencyColor(efficiency) {
        if (efficiency >= 80) return 'text-success'
        if (efficiency >= 60) return 'text-warning'
        return 'text-error'
    }

    getEfficiencyLabel(efficiency) {
        if (efficiency >= 80) return 'Excellent'
        if (efficiency >= 60) return 'Good'
        if (efficiency >= 40) return 'Average'
        return 'Needs Improvement'
    }

    getEfficiencyProgressColor(efficiency) {
        if (efficiency >= 80) return 'success'
        if (efficiency >= 60) return 'warning'
        return 'error'
    }

    formatDuration(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60))
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

        if (hours > 0) {
            return `${hours}j ${minutes}m`
        }
        return `${minutes}m`
    }

    getLastUpdateTime() {
        return new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }
}
