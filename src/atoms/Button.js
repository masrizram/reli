import { BaseComponent } from '../core/BaseComponent.js'

/**
 * Enhanced Button component with loading states and accessibility
 */
export class Button extends BaseComponent {
    constructor(props = {}) {
        super(props)

        // Default props
        this.props = {
            text: 'Button',
            variant: 'btn-primary',
            size: '',
            disabled: false,
            loading: false,
            icon: null,
            onClick: () => {},
            ...props,
        }
    }

    render() {
        const { text, variant, size, disabled, loading, icon, onClick } = this.props

        const classes = ['btn', variant, size, loading ? 'loading' : '', 'w-full'].filter(Boolean).join(' ')

        return this.createElement(
            'button',
            {
                className: classes,
                disabled: disabled || loading,
                onClick: e => {
                    e.preventDefault()
                    if (!disabled && !loading) {
                        onClick(e)
                    }
                },
                'aria-label': text,
            },
            loading ? '' : icon ? `${icon} ${text}` : text
        )
    }

    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        this.update({ loading })
    }

    /**
     * Set disabled state
     * @param {boolean} disabled - Disabled state
     */
    setDisabled(disabled) {
        this.update({ disabled })
    }

    /**
     * Update button text
     * @param {string} text - New text
     */
    setText(text) {
        this.update({ text })
    }
}
