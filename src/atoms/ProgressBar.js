import { BaseComponent } from '../core/BaseComponent.js'

/**
 * Animated progress bar component with customizable styles
 */
export class ProgressBar extends BaseComponent {
    constructor(props = {}) {
        super(props)

        this.props = {
            value: 0, // 0-100
            max: 100,
            size: 'md', // xs, sm, md, lg
            color: 'primary', // primary, secondary, accent, success, warning, error, info
            showLabel: false,
            label: '',
            animated: true,
            striped: false,
            className: '',
            ...props,
        }
    }

    render() {
        const { value, max, size, color, showLabel, label, animated, striped, className } = this.props

        const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

        const sizeClasses = {
            xs: 'h-1',
            sm: 'h-2',
            md: 'h-4',
            lg: 'h-6',
        }

        const colorClasses = {
            primary: 'progress-primary',
            secondary: 'progress-secondary',
            accent: 'progress-accent',
            success: 'progress-success',
            warning: 'progress-warning',
            error: 'progress-error',
            info: 'progress-info',
        }

        const container = this.createElement('div', {
            className: `progress-container ${className}`,
        })

        // Label
        if (showLabel && label) {
            const labelElement = this.createElement('div', {
                className: 'flex justify-between items-center mb-2',
            })

            labelElement.appendChild(
                this.createElement(
                    'span',
                    {
                        className: 'text-sm font-medium text-base-content',
                    },
                    label
                )
            )

            labelElement.appendChild(
                this.createElement(
                    'span',
                    {
                        className: 'text-sm text-base-content/60',
                    },
                    `${Math.round(percentage)}%`
                )
            )

            container.appendChild(labelElement)
        }

        // Progress bar
        const progressBar = this.createElement('progress', {
            className: `progress ${colorClasses[color] || colorClasses.primary} ${sizeClasses[size] || sizeClasses.md} w-full`,
            value: percentage,
            max: 100,
        })

        // Add animation classes
        if (animated) {
            progressBar.classList.add('progress-animated')
        }

        if (striped) {
            progressBar.classList.add('progress-striped')
        }

        container.appendChild(progressBar)

        // Custom styling for striped and animated effects
        if (striped || animated) {
            this.addCustomStyles()
        }

        return container
    }

    /**
     * Add custom CSS for animations
     */
    addCustomStyles() {
        if (!document.getElementById('progress-styles')) {
            const style = document.createElement('style')
            style.id = 'progress-styles'
            style.textContent = `
                .progress-striped::-webkit-progress-value {
                    background-image: linear-gradient(
                        45deg,
                        rgba(255, 255, 255, 0.15) 25%,
                        transparent 25%,
                        transparent 50%,
                        rgba(255, 255, 255, 0.15) 50%,
                        rgba(255, 255, 255, 0.15) 75%,
                        transparent 75%,
                        transparent
                    );
                    background-size: 1rem 1rem;
                }
                
                .progress-animated::-webkit-progress-value {
                    animation: progress-bar-stripes 1s linear infinite;
                }
                
                @keyframes progress-bar-stripes {
                    0% {
                        background-position: 1rem 0;
                    }
                    100% {
                        background-position: 0 0;
                    }
                }
                
                .progress-animated {
                    transition: all 0.6s ease;
                }
            `
            document.head.appendChild(style)
        }
    }

    /**
     * Update progress value with animation
     * @param {number} newValue - New progress value
     */
    setValue(newValue) {
        this.update({ value: newValue })
    }

    /**
     * Increment progress value
     * @param {number} increment - Amount to increment
     */
    increment(increment = 1) {
        const newValue = Math.min(this.props.value + increment, this.props.max)
        this.setValue(newValue)
    }

    /**
     * Set progress to complete
     */
    complete() {
        this.setValue(this.props.max)
    }

    /**
     * Reset progress to zero
     */
    reset() {
        this.setValue(0)
    }

    /**
     * Get current percentage
     * @returns {number} Current percentage
     */
    getPercentage() {
        return Math.min(Math.max((this.props.value / this.props.max) * 100, 0), 100)
    }

    /**
     * Check if progress is complete
     * @returns {boolean} Is complete
     */
    isComplete() {
        return this.props.value >= this.props.max
    }
}
