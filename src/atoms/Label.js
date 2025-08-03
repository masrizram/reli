export class Label {
    constructor(text, emoji = '', description = '') {
        this.text = text
        this.emoji = emoji
        this.description = description
    }

    render() {
        const label = document.createElement('label')
        label.className = 'label'
        label.innerHTML = `
            <span class="label-text font-medium">
                ${this.emoji} ${this.text}
            </span>
            ${this.description ? `<span class="label-text-alt text-xs opacity-70">${this.description}</span>` : ''}
        `
        return label
    }
}
