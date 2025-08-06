import { BaseComponent } from '../core/BaseComponent.js'

/**
 * Enhanced Label component with accessibility and styling options
 */
export class Label extends BaseComponent {
    constructor(props = {}) {
        super(props)

        // Default props
        this.props = {
            text: '',
            emoji: '',
            description: '',
            required: false,
            htmlFor: null,
            className: '',
            size: 'normal', // normal, sm, lg
            ...props,
        }
    }

    render() {
        const { text, emoji, description, required, htmlFor, className, size } = this.props

        const labelClasses = ['label', size === 'sm' ? 'label-sm' : '', size === 'lg' ? 'label-lg' : '', className]
            .filter(Boolean)
            .join(' ')

        const textClasses = [
            'label-text',
            'font-medium',
            size === 'sm' ? 'text-sm' : '',
            size === 'lg' ? 'text-lg' : '',
        ]
            .filter(Boolean)
            .join(' ')

        return this.createElement(
            'label',
            {
                className: labelClasses,
                htmlFor,
            },
            this.createElement(
                'span',
                {
                    className: textClasses,
                },
                emoji ? `${emoji} ${text}` : text,
                required
                    ? this.createElement(
                          'span',
                          {
                              className: 'text-error ml-1',
                              'aria-label': 'required',
                          },
                          '*'
                      )
                    : null
            ),
            description
                ? this.createElement(
                      'span',
                      {
                          className: 'label-text-alt text-xs opacity-70',
                      },
                      description
                  )
                : null
        )
    }

    /**
     * Update label text
     * @param {string} text - New text
     */
    setText(text) {
        this.update({ text })
    }

    /**
     * Update description
     * @param {string} description - New description
     */
    setDescription(description) {
        this.update({ description })
    }

    /**
     * Set required state
     * @param {boolean} required - Required state
     */
    setRequired(required) {
        this.update({ required })
    }
}
