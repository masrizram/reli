import { StorageManager } from '../utils/storage.js'

export class AnalyticsDashboard {
    constructor() {
        this.storage = new StorageManager()
    }

    render() {
        const container = document.createElement('div')
        container.className = 'card bg-base-200 p-4 mb-4'

        const data = this.storage.getLastNDays(7)
        const stats = this.calculateStats(data)

        container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold">📊 Analytics (7 Hari Terakhir)</h3>
        <button class="btn btn-sm btn-outline" onclick="this.toggleView()">
          📈 Detail
        </button>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div class="stat bg-base-100 rounded-lg p-3">
          <div class="stat-title text-xs">Rata-rata Harian</div>
          <div class="stat-value text-sm text-primary">Rp ${this.formatCurrency(stats.avgDaily)}</div>
        </div>
        <div class="stat bg-base-100 rounded-lg p-3">
          <div class="stat-title text-xs">Total 7 Hari</div>
          <div class="stat-value text-sm text-success">Rp ${this.formatCurrency(stats.total7Days)}</div>
        </div>
        <div class="stat bg-base-100 rounded-lg p-3">
          <div class="stat-title text-xs">Hari Terbaik</div>
          <div class="stat-value text-sm text-warning">Rp ${this.formatCurrency(stats.bestDay)}</div>
        </div>
        <div class="stat bg-base-100 rounded-lg p-3">
          <div class="stat-title text-xs">Efisiensi BBM</div>
          <div class="stat-value text-sm text-info">${stats.avgFuelEfficiency.toFixed(1)} km/L</div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-base-100 rounded-lg p-3">
          <h4 class="font-semibold mb-2">🏆 Platform Terbaik</h4>
          ${this.renderPlatformRanking(stats.platformRanking)}
        </div>
        <div class="bg-base-100 rounded-lg p-3">
          <h4 class="font-semibold mb-2">📈 Trend Mingguan</h4>
          ${this.renderWeeklyTrend(data)}
        </div>
      </div>
      
      <div id="detailed-analytics" class="hidden mt-4">
        ${this.renderDetailedView(data)}
      </div>
    `

        // Add event listener for toggle
        const toggleBtn = container.querySelector('button')
        toggleBtn.onclick = () => this.toggleDetailedView(container)

        return container
    }

    calculateStats(data) {
        if (data.length === 0) {
            return {
                avgDaily: 0,
                total7Days: 0,
                bestDay: 0,
                avgFuelEfficiency: 0,
                platformRanking: {},
            }
        }

        const earnings = data.map(d => d.results?.pendapatanBersih || 0)
        const total7Days = earnings.reduce((sum, val) => sum + val, 0)
        const avgDaily = total7Days / Math.max(data.length, 1)
        const bestDay = Math.max(...earnings)

        const fuelEfficiencies = data.map(d => d.fuel?.konsumsi || 0).filter(val => val > 0)
        const avgFuelEfficiency =
            fuelEfficiencies.length > 0
                ? fuelEfficiencies.reduce((sum, val) => sum + val, 0) / fuelEfficiencies.length
                : 0

        // Platform ranking
        const platformTotals = {
            grab: 0,
            maxim: 0,
            gojek: 0,
            indrive: 0,
        }

        data.forEach(d => {
            if (d.platforms) {
                Object.keys(platformTotals).forEach(platform => {
                    platformTotals[platform] += d.platforms[platform]?.kotor || 0
                })
            }
        })

        const platformRanking = Object.entries(platformTotals)
            .sort(([, a], [, b]) => b - a)
            .reduce((acc, [platform, total]) => {
                acc[platform] = total
                return acc
            }, {})

        return {
            avgDaily,
            total7Days,
            bestDay,
            avgFuelEfficiency,
            platformRanking,
        }
    }

    renderPlatformRanking(ranking) {
        const platformNames = {
            grab: 'Grab',
            maxim: 'Maxim',
            gojek: 'Gojek',
            indrive: 'Indrive',
        }

        return Object.entries(ranking)
            .slice(0, 3)
            .map(([platform, total], index) => {
                const medals = ['🥇', '🥈', '🥉']
                return `
          <div class="flex justify-between items-center py-1">
            <span class="text-sm">${medals[index]} ${platformNames[platform]}</span>
            <span class="text-sm font-semibold">Rp ${this.formatCurrency(total)}</span>
          </div>
        `
            })
            .join('')
    }

    renderWeeklyTrend(data) {
        if (data.length === 0) return '<p class="text-sm opacity-70">Belum ada data</p>'

        const last3Days = data.slice(0, 3).reverse()
        return last3Days
            .map(d => {
                const date = new Date(d.date).toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                })
                const earning = d.results?.pendapatanBersih || 0
                return `
        <div class="flex justify-between items-center py-1">
          <span class="text-sm">${date}</span>
          <span class="text-sm font-semibold">Rp ${this.formatCurrency(earning)}</span>
        </div>
      `
            })
            .join('')
    }

    renderDetailedView(data) {
        return `
      <div class="bg-base-100 rounded-lg p-4">
        <h4 class="font-semibold mb-3">📋 History Detail</h4>
        <div class="overflow-x-auto">
          <table class="table table-xs">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Total Kotor</th>
                <th>Biaya BBM</th>
                <th>Pendapatan Bersih</th>
                <th>Jarak (km)</th>
              </tr>
            </thead>
            <tbody>
              ${data
                  .map(
                      d => `
                <tr>
                  <td>${new Date(d.date).toLocaleDateString('id-ID')}</td>
                  <td>Rp ${this.formatCurrency(d.results?.totalKotor || 0)}</td>
                  <td>Rp ${this.formatCurrency(d.results?.biayaBBM || 0)}</td>
                  <td class="font-semibold">Rp ${this.formatCurrency(d.results?.pendapatanBersih || 0)}</td>
                  <td>${d.fuel?.jarak || 0} km</td>
                </tr>
              `
                  )
                  .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
    }

    toggleDetailedView(container) {
        const detailedView = container.querySelector('#detailed-analytics')
        const toggleBtn = container.querySelector('button')

        if (detailedView.classList.contains('hidden')) {
            detailedView.classList.remove('hidden')
            toggleBtn.textContent = '📊 Ringkas'
        } else {
            detailedView.classList.add('hidden')
            toggleBtn.textContent = '📈 Detail'
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID').format(amount)
    }
}
