import { BaseComponent } from '../core/BaseComponent.js'

/**
 * Toast notification component with auto-dismiss and positioning
 */
export class Toast extends BaseComponent {
    constructor(props = {}) {
        super(props)

        this.props = {
            message: '',
            type: 'info', // success, error, warning, info
            duration: 5000,
            position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
            closable: true,
            icon: null,
            action: null,
            onClose: () => {},
            ...props,
        }

        this.timeoutId = null
    }

    render() {
        const { message, type, closable, icon, action, position } = this.props

        const typeClasses = {
            success: 'alert-success',
            error: 'alert-error',
            warning: 'alert-warning',
            info: 'alert-info',
        }

        const positionClasses = {
            'top-right': 'toast-top toast-end',
            'top-left': 'toast-top toast-start',
            'bottom-right': 'toast-bottom toast-end',
            'bottom-left': 'toast-bottom toast-start',
            'top-center': 'toast-top toast-center',
            'bottom-center': 'toast-bottom toast-center',
        }

        const toastContainer = this.createElement('div', {
            className: `toast ${positionClasses[position] || positionClasses['top-right']} z-50`,
        })

        const alert = this.createElement('div', {
            className: `alert ${typeClasses[type] || typeClasses.info} shadow-lg animate-slide-in-down`,
        })

        // Icon
        if (icon) {
            alert.appendChild(
                this.createElement(
                    'div',
                    {
                        className: 'text-xl',
                    },
                    icon
                )
            )
        }

        // Message
        alert.appendChild(
            this.createElement(
                'div',
                {
                    className: 'flex-1',
                },
                message
            )
        )

        // Action button
        if (action) {
            const actionBtn = this.createElement(
                'button',
                {
                    className: 'btn btn-sm btn-ghost',
                    onClick: action.onClick,
                },
                action.text
            )

            alert.appendChild(actionBtn)
        }

        // Close button
        if (closable) {
            const closeBtn = this.createElement(
                'button',
                {
                    className: 'btn btn-sm btn-circle btn-ghost',
                    onClick: () => this.close(),
                    'aria-label': 'Close',
                },
                '✕'
            )

            alert.appendChild(closeBtn)
        }

        toastContainer.appendChild(alert)
        return toastContainer
    }

    afterMount() {
        // Auto-dismiss after duration
        if (this.props.duration > 0) {
            this.timeoutId = setTimeout(() => {
                this.close()
            }, this.props.duration)
        }
    }

    beforeUnmount() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId)
        }
    }

    /**
     * Close toast with animation
     */
    close() {
        if (this.element) {
            const alert = this.element.querySelector('.alert')
            if (alert) {
                alert.classList.remove('animate-slide-in-down')
                alert.classList.add('animate-fade-out')

                setTimeout(() => {
                    this.props.onClose()
                    this.unmount()
                }, 300)
            }
        }
    }

    /**
     * Pause auto-dismiss
     */
    pause() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId)
            this.timeoutId = null
        }
    }

    /**
     * Resume auto-dismiss
     */
    resume() {
        if (this.props.duration > 0 && !this.timeoutId) {
            this.timeoutId = setTimeout(() => {
                this.close()
            }, this.props.duration)
        }
    }
}
