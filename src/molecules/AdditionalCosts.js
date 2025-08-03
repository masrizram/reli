import { Label } from '../atoms/Label.js'
import { Input } from '../atoms/Input.js'

export class AdditionalCosts {
    constructor(onUpdate) {
        this.onUpdate = onUpdate
        this.costs = {
            parkir: 0,
            makan: 0,
            kuota: 0,
            tol: 0,
            lainnya: 0,
        }

        this.initInputs()
    }

    initInputs() {
        this.parkirInput = new Input('0', 'number', 'currency-input')
        this.makanInput = new Input('0', 'number', 'currency-input')
        this.kuotaInput = new Input('0', 'number', 'currency-input')
        this.tolInput = new Input('0', 'number', 'currency-input')
        this.lainnyaInput = new Input('0', 'number', 'currency-input')

        // Set up event listeners
        this.parkirInput.setOnInput(() => this.calculateAndUpdate())
        this.makanInput.setOnInput(() => this.calculateAndUpdate())
        this.kuotaInput.setOnInput(() => this.calculateAndUpdate())
        this.tolInput.setOnInput(() => this.calculateAndUpdate())
        this.lainnyaInput.setOnInput(() => this.calculateAndUpdate())
    }

    calculateAndUpdate() {
        this.costs = {
            parkir: parseInt(this.parkirInput.value) || 0,
            makan: parseInt(this.makanInput.value) || 0,
            kuota: parseInt(this.kuotaInput.value) || 0,
            tol: parseInt(this.tolInput.value) || 0,
            lainnya: parseInt(this.lainnyaInput.value) || 0,
        }

        const totalAdditionalCosts = Object.values(this.costs).reduce((sum, cost) => sum + cost, 0)

        this.onUpdate({ ...this.costs, total: totalAdditionalCosts })
    }

    render() {
        const container = document.createElement('div')
        container.className = 'card bg-base-200 p-4 mb-4'

        const title = new Label('Biaya Tambahan', '💸')
        container.appendChild(title.render())

        // Quick preset buttons
        const presetContainer = document.createElement('div')
        presetContainer.className = 'flex flex-wrap gap-2 mb-4'
        presetContainer.innerHTML = `
      <button class="btn btn-xs btn-outline" onclick="this.setPreset('hemat')">
        💰 Hemat (15k)
      </button>
      <button class="btn btn-xs btn-outline" onclick="this.setPreset('normal')">
        🍽️ Normal (35k)
      </button>
      <button class="btn btn-xs btn-outline" onclick="this.setPreset('lengkap')">
        🛣️ Lengkap (55k)
      </button>
    `

        // Add preset event listeners
        presetContainer.querySelectorAll('button').forEach((btn, index) => {
            const presets = ['hemat', 'normal', 'lengkap']
            btn.onclick = () => this.setPreset(presets[index])
        })

        container.appendChild(presetContainer)

        const inputContainer = document.createElement('div')
        inputContainer.className = 'grid grid-cols-2 md:grid-cols-3 gap-4 mt-2'

        // Parkir
        const parkirDiv = document.createElement('div')
        const parkirLabel = new Label('Parkir', '🅿️', 'Biaya parkir harian')
        parkirDiv.appendChild(parkirLabel.render())
        parkirDiv.appendChild(this.parkirInput.render())

        // Makan & Minum
        const makanDiv = document.createElement('div')
        const makanLabel = new Label('Makan & Minum', '🍽️', 'Biaya konsumsi harian')
        makanDiv.appendChild(makanLabel.render())
        makanDiv.appendChild(this.makanInput.render())

        // Kuota Internet
        const kuotaDiv = document.createElement('div')
        const kuotaLabel = new Label('Kuota Internet', '📱', 'Biaya kuota data harian')
        kuotaDiv.appendChild(kuotaLabel.render())
        kuotaDiv.appendChild(this.kuotaInput.render())

        // Tol
        const tolDiv = document.createElement('div')
        const tolLabel = new Label('Tol', '🛣️', 'Biaya tol (jika ada)')
        tolDiv.appendChild(tolLabel.render())
        tolDiv.appendChild(this.tolInput.render())

        // Lainnya
        const lainnyaDiv = document.createElement('div')
        const lainnyaLabel = new Label('Lainnya', '📝', 'Biaya lain-lain')
        lainnyaDiv.appendChild(lainnyaLabel.render())
        lainnyaDiv.appendChild(this.lainnyaInput.render())

        // Total Display
        const totalDiv = document.createElement('div')
        totalDiv.className = 'col-span-2 md:col-span-3'
        totalDiv.innerHTML = `
      <div class="bg-base-100 rounded-lg p-3 mt-2">
        <div class="flex justify-between items-center">
          <span class="font-semibold">Total Biaya Tambahan:</span>
          <span id="additional-total" class="text-lg font-bold text-error">Rp 0</span>
        </div>
      </div>
    `

        inputContainer.appendChild(parkirDiv)
        inputContainer.appendChild(makanDiv)
        inputContainer.appendChild(kuotaDiv)
        inputContainer.appendChild(tolDiv)
        inputContainer.appendChild(lainnyaDiv)
        inputContainer.appendChild(totalDiv)

        container.appendChild(inputContainer)

        return container
    }

    setPreset(type) {
        const presets = {
            hemat: { parkir: 5000, makan: 10000, kuota: 0, tol: 0, lainnya: 0 },
            normal: { parkir: 10000, makan: 20000, kuota: 5000, tol: 0, lainnya: 0 },
            lengkap: { parkir: 15000, makan: 25000, kuota: 5000, tol: 10000, lainnya: 0 },
        }

        const preset = presets[type]
        if (preset) {
            this.parkirInput.setValue(preset.parkir.toString())
            this.makanInput.setValue(preset.makan.toString())
            this.kuotaInput.setValue(preset.kuota.toString())
            this.tolInput.setValue(preset.tol.toString())
            this.lainnyaInput.setValue(preset.lainnya.toString())

            this.calculateAndUpdate()
        }
    }

    updateTotalDisplay(total) {
        const totalElement = document.getElementById('additional-total')
        if (totalElement) {
            totalElement.textContent = `Rp ${new Intl.NumberFormat('id-ID').format(total)}`
        }
    }
}
