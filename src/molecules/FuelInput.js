import { Label } from '../atoms/Label.js'
import { Input } from '../atoms/Input.js'

export class FuelInput {
    constructor(onUpdate) {
        this.onUpdate = onUpdate
        this.jarakInput = new Input('0', 'number', 'currency-input')
        this.konsumsiInput = new Input('14', 'number', 'currency-input')
        this.hargaInput = new Input('10000', 'number', 'currency-input')

        // Set default values
        this.konsumsiInput.value = '14'
        this.hargaInput.value = '10000'

        this.jarakInput.setOnInput(() => this.calculateAndUpdate())
        this.konsumsiInput.setOnInput(() => this.calculateAndUpdate())
        this.hargaInput.setOnInput(() => this.calculateAndUpdate())
    }

    calculateAndUpdate() {
        const jarak = parseFloat(this.jarakInput.value) || 0
        const konsumsi = parseFloat(this.konsumsiInput.value) || 14
        const harga = parseInt(this.hargaInput.value) || 10000

        const literTerpakai = jarak / konsumsi
        const biayaBBM = literTerpakai * harga

        this.onUpdate({ jarak, konsumsi, harga, literTerpakai, biayaBBM })
    }

    render() {
        const container = document.createElement('div')
        container.className = 'card bg-base-200 p-4 mb-4'

        const title = new Label('Data BBM & Jarak', '⛽')
        container.appendChild(title.render())

        const inputContainer = document.createElement('div')
        inputContainer.className = 'grid grid-cols-1 gap-4 mt-2'

        // Jarak
        const jarakDiv = document.createElement('div')
        const jarakLabel = new Label('Jarak Tempuh (km)', '📏', 'Reset Trip A di pagi hari, catat di sore hari')
        jarakDiv.appendChild(jarakLabel.render())
        jarakDiv.appendChild(this.jarakInput.render())

        // Konsumsi
        const konsumsiDiv = document.createElement('div')
        const konsumsiLabel = new Label('Konsumsi (km/liter)', '🛣️', 'Rata-rata konsumsi kendaraan Anda')
        konsumsiDiv.appendChild(konsumsiLabel.render())
        konsumsiDiv.appendChild(this.konsumsiInput.render())

        // Harga
        const hargaDiv = document.createElement('div')
        const hargaLabel = new Label('Harga BBM (Rp/liter)', '💰', 'Harga BBM hari ini (cek struk SPBU)')
        hargaDiv.appendChild(hargaLabel.render())
        hargaDiv.appendChild(this.hargaInput.render())

        inputContainer.appendChild(jarakDiv)
        inputContainer.appendChild(konsumsiDiv)
        inputContainer.appendChild(hargaDiv)
        container.appendChild(inputContainer)

        // Trigger initial calculation with default values
        setTimeout(() => this.calculateAndUpdate(), 0)

        return container
    }
}
