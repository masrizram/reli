import { BaseComponent } from '../core/BaseComponent.js'
import { Card } from '../atoms/Card.js'

/**
 * Advanced Data Visualization component with charts and metrics
 */
export class DataVisualization extends BaseComponent {
    constructor(props = {}) {
        super(props)

        this.props = {
            data: [],
            type: 'line', // line, bar, pie, metric
            title: '',
            subtitle: '',
            showLegend: true,
            showGrid: true,
            animate: true,
            height: 300,
            ...props,
        }
    }

    render() {
        const { type, title, subtitle, height } = this.props

        const container = this.createElement('div', {
            className: 'data-visualization w-full',
        })

        // Title section
        if (title || subtitle) {
            const header = this.createElement('div', {
                className: 'mb-4',
            })

            if (title) {
                header.appendChild(
                    this.createElement(
                        'h3',
                        {
                            className: 'text-lg font-semibold text-base-content',
                        },
                        title
                    )
                )
            }

            if (subtitle) {
                header.appendChild(
                    this.createElement(
                        'p',
                        {
                            className: 'text-sm text-base-content/60',
                        },
                        subtitle
                    )
                )
            }

            container.appendChild(header)
        }

        // Chart container
        const chartContainer = this.createElement('div', {
            className: 'chart-container bg-base-100 rounded-lg p-4 shadow-sm border border-base-200',
            style: `height: ${height}px; position: relative;`,
        })

        // Render chart based on type
        switch (type) {
            case 'line':
                chartContainer.appendChild(this.renderLineChart())
                break
            case 'bar':
                chartContainer.appendChild(this.renderBarChart())
                break
            case 'pie':
                chartContainer.appendChild(this.renderPieChart())
                break
            case 'metric':
                chartContainer.appendChild(this.renderMetricCards())
                break
            default:
                chartContainer.appendChild(this.renderNoData())
        }

        container.appendChild(chartContainer)
        return container
    }

    /**
     * Render line chart using SVG
     */
    renderLineChart() {
        const { data, showGrid, animate } = this.props

        if (!data || data.length === 0) {
            return this.renderNoData()
        }

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.setAttribute('width', '100%')
        svg.setAttribute('height', '100%')
        svg.setAttribute('viewBox', '0 0 400 200')
        svg.setAttribute('class', 'w-full h-full')

        // Calculate data points
        const maxValue = Math.max(...data.map(d => d.value))
        const minValue = Math.min(...data.map(d => d.value))
        const range = maxValue - minValue || 1

        const points = data
            .map((d, i) => {
                const x = (i / (data.length - 1)) * 360 + 20
                const y = 180 - ((d.value - minValue) / range) * 160
                return `${x},${y}`
            })
            .join(' ')

        // Grid lines
        if (showGrid) {
            for (let i = 0; i <= 4; i++) {
                const y = 20 + i * 40
                const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
                gridLine.setAttribute('x1', '20')
                gridLine.setAttribute('y1', y.toString())
                gridLine.setAttribute('x2', '380')
                gridLine.setAttribute('y2', y.toString())
                gridLine.setAttribute('stroke', 'currentColor')
                gridLine.setAttribute('stroke-opacity', '0.1')
                gridLine.setAttribute('stroke-width', '1')
                svg.appendChild(gridLine)
            }
        }

        // Line path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
        path.setAttribute('points', points)
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke', 'hsl(var(--p))')
        path.setAttribute('stroke-width', '2')
        path.setAttribute('stroke-linecap', 'round')
        path.setAttribute('stroke-linejoin', 'round')

        if (animate) {
            path.setAttribute('stroke-dasharray', '1000')
            path.setAttribute('stroke-dashoffset', '1000')
            path.style.animation = 'drawLine 2s ease-out forwards'
        }

        svg.appendChild(path)

        // Data points
        data.forEach((d, i) => {
            const x = (i / (data.length - 1)) * 360 + 20
            const y = 180 - ((d.value - minValue) / range) * 160

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
            circle.setAttribute('cx', x.toString())
            circle.setAttribute('cy', y.toString())
            circle.setAttribute('r', '4')
            circle.setAttribute('fill', 'hsl(var(--p))')
            circle.setAttribute('class', 'cursor-pointer hover:r-6 transition-all')
            circle.setAttribute('title', `${d.label}: ${this.formatCurrency(d.value)}`)

            svg.appendChild(circle)
        })

        return svg
    }

    /**
     * Render bar chart using CSS
     */
    renderBarChart() {
        const { data } = this.props

        if (!data || data.length === 0) {
            return this.renderNoData()
        }

        const maxValue = Math.max(...data.map(d => d.value))

        const container = this.createElement('div', {
            className: 'flex items-end justify-between h-full gap-2 p-4',
        })

        data.forEach((d, i) => {
            const barContainer = this.createElement('div', {
                className: 'flex flex-col items-center flex-1',
            })

            // Bar
            const barHeight = (d.value / maxValue) * 80
            const bar = this.createElement('div', {
                className:
                    'bg-primary rounded-t w-full transition-all duration-1000 hover:bg-primary-focus cursor-pointer',
                style: `height: ${barHeight}%; min-height: 4px;`,
                title: `${d.label}: ${this.formatCurrency(d.value)}`,
            })

            // Value label
            const valueLabel = this.createElement(
                'div',
                {
                    className: 'text-xs font-medium text-primary mt-1',
                },
                this.formatCurrency(d.value)
            )

            // Category label
            const categoryLabel = this.createElement(
                'div',
                {
                    className: 'text-xs text-base-content/60 mt-1 text-center',
                },
                d.label
            )

            barContainer.appendChild(bar)
            barContainer.appendChild(valueLabel)
            barContainer.appendChild(categoryLabel)
            container.appendChild(barContainer)
        })

        return container
    }

    /**
     * Render pie chart using SVG
     */
    renderPieChart() {
        const { data } = this.props

        if (!data || data.length === 0) {
            return this.renderNoData()
        }

        const total = data.reduce((sum, d) => sum + d.value, 0)
        const colors = [
            'hsl(var(--p))',
            'hsl(var(--s))',
            'hsl(var(--a))',
            'hsl(var(--n))',
            'hsl(var(--in))',
            'hsl(var(--su))',
            'hsl(var(--wa))',
            'hsl(var(--er))',
        ]

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.setAttribute('width', '100%')
        svg.setAttribute('height', '100%')
        svg.setAttribute('viewBox', '0 0 200 200')
        svg.setAttribute('class', 'w-full h-full')

        let currentAngle = 0
        const centerX = 100
        const centerY = 100
        const radius = 80

        data.forEach((d, i) => {
            const percentage = d.value / total
            const angle = percentage * 360
            const startAngle = currentAngle
            const endAngle = currentAngle + angle

            // Convert to radians
            const startRad = ((startAngle - 90) * Math.PI) / 180
            const endRad = ((endAngle - 90) * Math.PI) / 180

            // Calculate arc path
            const x1 = centerX + radius * Math.cos(startRad)
            const y1 = centerY + radius * Math.sin(startRad)
            const x2 = centerX + radius * Math.cos(endRad)
            const y2 = centerY + radius * Math.sin(endRad)

            const largeArc = angle > 180 ? 1 : 0

            const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                'Z',
            ].join(' ')

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            path.setAttribute('d', pathData)
            path.setAttribute('fill', colors[i % colors.length])
            path.setAttribute('class', 'cursor-pointer hover:opacity-80 transition-opacity')
            path.setAttribute(
                'title',
                `${d.label}: ${this.formatCurrency(d.value)} (${(percentage * 100).toFixed(1)}%)`
            )

            svg.appendChild(path)
            currentAngle += angle
        })

        return svg
    }

    /**
     * Render metric cards
     */
    renderMetricCards() {
        const { data } = this.props

        if (!data || data.length === 0) {
            return this.renderNoData()
        }

        const container = this.createElement('div', {
            className: 'grid grid-cols-2 gap-4 h-full',
        })

        data.forEach((d, i) => {
            const card = this.createElement('div', {
                className:
                    'bg-base-200 rounded-lg p-4 flex flex-col justify-center items-center text-center hover:bg-base-300 transition-colors cursor-pointer',
            })

            // Icon or emoji
            if (d.icon) {
                card.appendChild(
                    this.createElement(
                        'div',
                        {
                            className: 'text-2xl mb-2',
                        },
                        d.icon
                    )
                )
            }

            // Value
            card.appendChild(
                this.createElement(
                    'div',
                    {
                        className: 'text-2xl font-bold text-primary',
                    },
                    this.formatValue(d.value, d.format)
                )
            )

            // Label
            card.appendChild(
                this.createElement(
                    'div',
                    {
                        className: 'text-sm text-base-content/60',
                    },
                    d.label
                )
            )

            // Change indicator
            if (d.change !== undefined) {
                const changeClass = d.change > 0 ? 'text-success' : d.change < 0 ? 'text-error' : 'text-base-content/60'
                const changeIcon = d.change > 0 ? '↗️' : d.change < 0 ? '↘️' : '➡️'

                card.appendChild(
                    this.createElement(
                        'div',
                        {
                            className: `text-xs ${changeClass} mt-1`,
                        },
                        `${changeIcon} ${Math.abs(d.change).toFixed(1)}%`
                    )
                )
            }

            container.appendChild(card)
        })

        return container
    }

    /**
     * Render no data message
     */
    renderNoData() {
        return this.createElement(
            'div',
            {
                className: 'flex flex-col items-center justify-center h-full text-base-content/60',
            },
            this.createElement(
                'div',
                {
                    className: 'text-4xl mb-2',
                },
                '📊'
            ),
            this.createElement(
                'div',
                {
                    className: 'text-sm',
                },
                'Tidak ada data untuk ditampilkan'
            )
        )
    }

    /**
     * Format value based on type
     * @param {number} value - Value to format
     * @param {string} format - Format type
     * @returns {string} Formatted value
     */
    formatValue(value, format = 'currency') {
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

    /**
     * Update chart data
     * @param {Array} data - New data
     */
    updateData(data) {
        this.update({ data })
    }

    /**
     * Change chart type
     * @param {string} type - New chart type
     */
    setType(type) {
        this.update({ type })
    }
}
