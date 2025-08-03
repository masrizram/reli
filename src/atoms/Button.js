export class Button {
    constructor(text, onClick, variant = 'btn-primary') {
        this.text = text
        this.onClick = onClick
        this.variant = variant
    }

    render() {
        const button = document.createElement('button')
        button.className = `btn ${this.variant} w-full`
        button.textContent = this.text
        button.addEventListener('click', this.onClick)
        return button
    }
}
