import { Label } from '../atoms/Label.js'
import { Input } from '../atoms/Input.js'

export class PlatformInput {
    constructor(platform, emoji, onUpdate) {
        this.platform = platform
        this.emoji = emoji
        this.onUpdate = onUpdate
        this.topupInput = new Input('0', 'number', 'currency-input')
        this.sisaInput = new Input('0', 'number', 'currency-input')

        this.topupInput.setOnInput(() => this.calculateAndUpdate())
        this.sisaInput.setOnInput(() => this.calculateAndUpdate())
    }

    calculateAndUpdate() {
        const topup = parseInt(this.topupInput.value) || 0
        const sisa = parseInt(this.sisaInput.value) || 0
        const kotor = topup - sisa
        this.onUpdate(this.platform, { topup, sisa, kotor })
    }

    render() {
        const container = document.createElement('div')
        container.className = 'card bg-base-200 p-4 mb-4'

        const label = new Label(this.platform, this.emoji)
        const topupLabel = new Label('Top-up', '', 'Jumlah saldo yang di-top up hari ini')
        const sisaLabel = new Label('Sisa', '', 'Saldo yang tersisa di akhir hari')

        container.appendChild(label.render())

        const inputContainer = document.createElement('div')
        inputContainer.className = 'grid grid-cols-2 gap-4 mt-2'

        const topupDiv = document.createElement('div')
        topupDiv.appendChild(topupLabel.render())
        topupDiv.appendChild(this.topupInput.render())

        const sisaDiv = document.createElement('div')
        sisaDiv.appendChild(sisaLabel.render())
        sisaDiv.appendChild(this.sisaInput.render())

        inputContainer.appendChild(topupDiv)
        inputContainer.appendChild(sisaDiv)
        container.appendChild(inputContainer)

        return container
    }
}
