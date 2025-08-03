export class Input {
    constructor(placeholder, type = 'text', className = '', description = '') {
        this.placeholder = placeholder
        this.type = type
        this.className = className
        this.description = description
        this.value = ''
    }

    render() {
        const input = document.createElement('input')
        input.type = this.type
        input.placeholder = this.placeholder
        input.value = this.value
        input.className = `input input-bordered w-full ${this.className}`
        input.addEventListener('input', e => {
            this.value = e.target.value
            if (this.onInputCallback) {
                this.onInputCallback(e.target.value)
            }
        })
        this.element = input
        return input
    }

    setValue(value) {
        this.value = value
        if (this.element) {
            this.element.value = value
        }
    }

    setOnInput(callback) {
        this.onInputCallback = callback
    }
}
