import { BaseComponent } from '../core/BaseComponent.js'

/**
 * Modal component with backdrop and keyboard handling
 */
export class Modal extends BaseComponent {
    constructor(props = {}) {
        super(props)

        // Default props
        this.props = {
            title: '',
            content: '',
            actions: [],
            open: false,
            closable: true,
            size: '', // modal-sm, modal-md, modal-lg, modal-xl
            className: '',
            onClose: () => {},
            onOpen: () => {},
            ...props,
        }

        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.handleBackdropClick = this.handleBackdropClick.bind(this)
    }

    render() {
        const { title, content, actions, open, size, className } = this.props

        const modalClasses = ['modal', open ? 'modal-open' : '', className].filter(Boolean).join(' ')

        const boxClasses = ['modal-box', size, 'relative'].filter(Boolean).join(' ')

        const modalElement = this.createElement('div', {
            className: modalClasses,
            onClick: this.handleBackdropClick,
        })

        const modalBox = this.createElement('div', {
            className: boxClasses,
            onClick: e => e.stopPropagation(),
        })

        // Close button
        if (this.props.closable) {
            modalBox.appendChild(
                this.createElement(
                    'button',
                    {
                        className: 'btn btn-sm btn-circle btn-ghost absolute right-2 top-2',
                        onClick: () => this.close(),
                        'aria-label': 'Close modal',
                    },
                    '✕'
                )
            )
        }

        // Title
        if (title) {
            modalBox.appendChild(
                this.createElement(
                    'h3',
                    {
                        className: 'font-bold text-lg mb-4',
                    },
                    title
                )
            )
        }

        // Content
        if (content) {
            const contentElement = this.createElement('div', {
                className: 'py-4',
            })

            if (typeof content === 'string') {
                contentElement.innerHTML = content
            } else if (content instanceof HTMLElement) {
                contentElement.appendChild(content)
            } else if (content instanceof BaseComponent) {
                contentElement.appendChild(content.render())
            }

            modalBox.appendChild(contentElement)
        }

        // Actions
        if (actions && actions.length > 0) {
            const actionsContainer = this.createElement('div', {
                className: 'modal-action',
            })

            actions.forEach(action => {
                if (action instanceof BaseComponent) {
                    actionsContainer.appendChild(action.render())
                } else if (action instanceof HTMLElement) {
                    actionsContainer.appendChild(action)
                }
            })

            modalBox.appendChild(actionsContainer)
        }

        modalElement.appendChild(modalBox)
        return modalElement
    }

    afterMount() {
        if (this.props.open) {
            this.addEventListeners()
        }
    }

    beforeUnmount() {
        this.removeEventListeners()
    }

    addEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown)
    }

    removeEventListeners() {
        document.removeEventListener('keydown', this.handleKeyDown)
    }

    handleKeyDown(e) {
        if (e.key === 'Escape' && this.props.closable) {
            this.close()
        }
    }

    handleBackdropClick(e) {
        if (e.target === e.currentTarget && this.props.closable) {
            this.close()
        }
    }

    /**
     * Open modal
     */
    open() {
        this.update({ open: true })
        this.addEventListeners()
        this.props.onOpen()

        // Prevent body scroll
        document.body.style.overflow = 'hidden'
    }

    /**
     * Close modal
     */
    close() {
        this.update({ open: false })
        this.removeEventListeners()
        this.props.onClose()

        // Restore body scroll
        document.body.style.overflow = ''
    }

    /**
     * Toggle modal
     */
    toggle() {
        if (this.props.open) {
            this.close()
        } else {
            this.open()
        }
    }

    /**
     * Update modal content
     * @param {string|HTMLElement|BaseComponent} content - New content
     */
    setContent(content) {
        this.update({ content })
    }

    /**
     * Update modal title
     * @param {string} title - New title
     */
    setTitle(title) {
        this.update({ title })
    }
}
