import { BaseComponent } from '../core/BaseComponent.js'

/**
 * Reusable Card component with various styles and layouts
 */
export class Card extends BaseComponent {
    constructor(props = {}) {
        super(props)

        // Default props
        this.props = {
            title: '',
            subtitle: '',
            content: '',
            actions: [],
            variant: 'default', // default, compact, bordered, glass
            shadow: true,
            hover: false,
            className: '',
            onClick: null,
            ...props,
        }
    }

    render() {
        const { title, subtitle, content, actions, variant, shadow, hover, className, onClick } = this.props

        const cardClasses = [
            'card',
            'bg-base-100',
            shadow ? 'shadow-xl' : '',
            hover ? 'hover:shadow-2xl transition-shadow duration-200' : '',
            variant === 'compact' ? 'card-compact' : '',
            variant === 'bordered' ? 'card-bordered' : '',
            variant === 'glass' ? 'glass' : '',
            onClick ? 'cursor-pointer' : '',
            className,
        ]
            .filter(Boolean)
            .join(' ')

        const cardElement = this.createElement('div', {
            className: cardClasses,
            onClick: onClick ? e => onClick(e, this) : null,
        })

        // Card body
        const cardBody = this.createElement('div', {
            className: 'card-body',
        })

        // Title and subtitle
        if (title) {
            cardBody.appendChild(
                this.createElement(
                    'h2',
                    {
                        className: 'card-title',
                    },
                    title
                )
            )
        }

        if (subtitle) {
            cardBody.appendChild(
                this.createElement(
                    'p',
                    {
                        className: 'text-base-content/60 text-sm',
                    },
                    subtitle
                )
            )
        }

        // Content
        if (content) {
            if (typeof content === 'string') {
                cardBody.appendChild(this.createElement('p', {}, content))
            } else if (content instanceof HTMLElement) {
                cardBody.appendChild(content)
            } else if (content instanceof BaseComponent) {
                cardBody.appendChild(content.render())
            }
        }

        // Actions
        if (actions && actions.length > 0) {
            const actionsContainer = this.createElement('div', {
                className: 'card-actions justify-end mt-4',
            })

            actions.forEach(action => {
                if (action instanceof BaseComponent) {
                    actionsContainer.appendChild(action.render())
                } else if (action instanceof HTMLElement) {
                    actionsContainer.appendChild(action)
                }
            })

            cardBody.appendChild(actionsContainer)
        }

        cardElement.appendChild(cardBody)
        return cardElement
    }

    /**
     * Update card content
     * @param {string|HTMLElement|BaseComponent} content - New content
     */
    setContent(content) {
        this.update({ content })
    }

    /**
     * Update card title
     * @param {string} title - New title
     */
    setTitle(title) {
        this.update({ title })
    }

    /**
     * Add action to card
     * @param {BaseComponent|HTMLElement} action - Action element
     */
    addAction(action) {
        const actions = [...this.props.actions, action]
        this.update({ actions })
    }

    /**
     * Clear all actions
     */
    clearActions() {
        this.update({ actions: [] })
    }
}
