import { BaseComponent } from '../core/BaseComponent.js'

/**
 * Enhanced Input component with validation and formatting
 */
export class Input extends BaseComponent {
    constructor(props = {}) {
        super(props)

        // Default props
        this.props = {
            type: 'text',
            placeholder: '',
            value: '',
            className: '',
            description: '',
            required: false,
            disabled: false,
            min: null,
            max: null,
            pattern: null,
            validator: null,
            formatter: null,
            onInput: () => {},
            onChange: () => {},
            onBlur: () => {},
            onFocus: () => {},
            ...props,
        }

        this.isValid = true
        this.errorMessage = ''
    }

    render() {
        const {
            type,
            placeholder,
            value,
            className,
            required,
            disabled,
            min,
            max,
            pattern,
            onInput,
            onChange,
            onBlur,
            onFocus,
        } = this.props

        const classes = ['input', 'input-bordered', 'w-full', !this.isValid ? 'input-error' : '', className]
            .filter(Boolean)
            .join(' ')

        const inputElement = this.createElement('input', {
            type,
            placeholder,
            value: value || '',
            className: classes,
            required,
            disabled,
            min,
            max,
            pattern,
            'aria-invalid': !this.isValid,
            'aria-describedby': this.errorMessage ? 'input-error' : null,
            onInput: this.handleInput.bind(this),
            onChange: this.handleChange.bind(this),
            onBlur: this.handleBlur.bind(this),
            onFocus: this.handleFocus.bind(this),
        })

        // Store reference for external access
        this.inputElement = inputElement

        return inputElement
    }

    handleInput(e) {
        let value = e.target.value

        // Apply formatter if provided
        if (this.props.formatter) {
            value = this.props.formatter(value)
            e.target.value = value
        }

        // Update props
        this.props.value = value

        // Validate
        this.validate(value)

        // Call callback
        this.props.onInput(value, e)
    }

    handleChange(e) {
        const value = e.target.value
        this.props.onChange(value, e)
    }

    handleBlur(e) {
        const value = e.target.value
        this.validate(value)
        this.props.onBlur(value, e)
    }

    handleFocus(e) {
        this.props.onFocus(e.target.value, e)
    }

    /**
     * Validate input value
     * @param {string} value - Value to validate
     */
    validate(value) {
        this.isValid = true
        this.errorMessage = ''

        // Required validation
        if (this.props.required && !value.trim()) {
            this.isValid = false
            this.errorMessage = 'Field ini wajib diisi'
            return
        }

        // Custom validator
        if (this.props.validator) {
            const result = this.props.validator(value)
            if (result !== true) {
                this.isValid = false
                this.errorMessage = result || 'Input tidak valid'
                return
            }
        }

        // Update UI
        if (this.inputElement) {
            this.inputElement.classList.toggle('input-error', !this.isValid)
            this.inputElement.setAttribute('aria-invalid', !this.isValid)
        }
    }

    /**
     * Set input value
     * @param {string} value - New value
     */
    setValue(value) {
        this.props.value = value
        if (this.inputElement) {
            this.inputElement.value = value
        }
    }

    /**
     * Get input value
     * @returns {string} Current value
     */
    getValue() {
        return this.props.value
    }

    /**
     * Focus input
     */
    focus() {
        if (this.inputElement) {
            this.inputElement.focus()
        }
    }

    /**
     * Set disabled state
     * @param {boolean} disabled - Disabled state
     */
    setDisabled(disabled) {
        this.update({ disabled })
    }

    /**
     * Get validation state
     * @returns {Object} Validation result
     */
    getValidation() {
        return {
            isValid: this.isValid,
            errorMessage: this.errorMessage,
        }
    }
}
