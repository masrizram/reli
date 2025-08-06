import { BaseComponent } from '../core/BaseComponent.js'

/**
 * Badge component for status indicators and labels
 */
export class Badge extends BaseComponent {
    constructor(props = {}) {
        super(props)

        // Default props
        this.props = {
            text: '',
            variant: 'badge-primary', // badge-primary, badge-secondary, badge-accent, badge-ghost, etc.
            size: '', // badge-sm, badge-md, badge-lg
            outline: false,
            className: '',
            ...props,
        }
    }

    render() {
        const { text, variant, size, outline, className } = this.props

        const classes = ['badge', variant, size, outline ? 'badge-outline' : '', className].filter(Boolean).join(' ')

        return this.createElement(
            'div',
            {
                className: classes,
            },
            text
        )
    }

    /**
     * Update badge text
     * @param {string} text - New text
     */
    setText(text) {
        this.update({ text })
    }

    /**
     * Update badge variant
     * @param {string} variant - New variant
     */
    setVariant(variant) {
        this.update({ variant })
    }
}
