import { Label } from '../atoms/Label.js'
import { Button } from '../atoms/Button.js'

export class EarningsOptimizer {
    constructor() {
        this.storageKey = 'reli-data'
        this.optimizationRules = this.initOptimizationRules()
    }

    initOptimizationRules() {
        return {
            timeSlots: {
                'peak_morning': { start: 7, end: 9, multiplier: 1.4, description: 'Rush hour pagi' },
                'lunch': { start: 11, end: 14, multiplier: 1.2, description: 'Jam makan siang' },
                'peak_evening': { start: 17, end: 20, multiplier: 1.5, description: 'Rush hour sore' },
                'dinner': { start: 19, end: 22, multiplier: 1.3, description: 'Jam makan malam' },
                'late_night': { start: 22, end: 24, multiplier: 1.1, description: 'Malam hari' }
            },
            platforms: {
                'grab': { commission: 0.2, surge_frequency: 0.3, avg_distance: 8.5 },
                'gojek': { commission: 0.2, surge_frequency: 0.25, avg_distance: 7.2 },
                'maxim': { commission: 0.15, surge_frequency: 0.2, avg_distance: 9.1 },
                'indrive': { commission: 0.1, surge_frequency: 0.15, avg_distance: 10.3 }
            },
            weather: {
                'sunny': { demand_multiplier: 1.0, efficiency_impact: 1.0 },
                'rainy': { demand_multiplier: 1.3, efficiency_impact: 0.9 },
                'cloudy': { demand_multiplier: 1.1, efficiency_impact: 1.0 }
            },
            locations: {
                'jakarta_pusat': { demand_score: 9, competition_level: 8, avg_fare: 25000 },
                'jakarta_selatan': { demand_score: 8, competition_level: 7, avg_fare: 22000 },
                'depok': { demand_score: 6, competition_level: 5, avg_fare: 18000 },
                'bandung': { demand_score: 7, competition_level: 6, avg_fare: 20000 },
                'yogyakarta': { demand_score: 6, competition_level: 5, avg_fare: 16000 }
            }
        }
    }

    getAllData() {
        try {
            const data = localStorage.getItem(this.storageKey)
            return data ? JSON.parse(data) : {}
        } catch (error) {
            console.error('Error loading data:', error)
            return {}
        }
    }

    analyzeCurrentPerformance() {
        const allData = this.getAllData()
        const last30Days = Object.keys(allData)
            .sort((a, b) => new Date(b) - new Date(a))
            .slice(0, 30)
            .map(date => ({ date, ...allData[date] }))

        if (last30Days.length === 0) {
            return {
                avgDailyEarnings: 0,
                bestPlatform: null,
                worstPlatform: null,
                peakHours: [],
                efficiency: 0
            }
        }

        // Calculate platform performance
        const platformPerformance = {}
        const platforms = ['grab', 'maxim', 'gojek', 'indrive']

        platforms.forEach(platform => {
            const earnings = last30Days.map(day => day.platforms?.[platform]?.kotor || 0)
            const total = earnings.reduce((sum, earning) => sum + earning, 0)
            const avg = total / last30Days.length

            platformPerformance[platform] = {
                total,
                avg,
                consistency: this.calculateConsistency(earnings)
            }
        })

        const bestPlatform = Object.entries(platformPerformance)
            .sort(([, a], [, b]) => b.avg - a.avg)[0]
        const worstPlatform = Object.entries(platformPerformance)
            .sort(([, a], [, b]) => a.avg - b.avg)[0]

        return {
            avgDailyEarnings: last30Days.reduce((sum, day) => sum + (day.results?.pendapatanBersih || 0), 0) / last30Days.length,
            bestPlatform: bestPlatform ? { name: bestPlatform[0], ...bestPlatform[1] } : null,
            worstPlatform: worstPlatform ? { name: worstPlatform[0], ...worstPlatform[1] } : null,
            platformPerformance,
            efficiency: this.calculateOverallEfficiency(last30Days)
        }
    }

    calculateConsistency(earnings) {
        if (earnings.length === 0) return 0
        const avg = earnings.reduce((sum, e) => sum + e, 0) / earnings.length
        const variance = earnings.reduce((sum, e) => sum + Math.pow(e - avg, 2), 0) / earnings.length
        const stdDev = Math.sqrt(variance)
        return avg > 0 ? Math.max(0, 100 - (stdDev / avg * 100)) : 0
    }

    calculateOverallEfficiency(data) {
        const totalEarnings = data.reduce((sum, day) => sum + (day.results?.pendapatanBersih || 0), 0)
        const totalDistance = data.reduce((sum, day) => sum + (day.fuel?.jarak || 0), 0)
        const totalFuelCost = data.reduce((sum, day) => sum + (day.results?.biayaBBM || 0), 0)

        return totalDistance > 0 ? (totalEarnings / totalDistance) : 0
    }

    generateOptimizationRecommendations() {
        const performance = this.analyzeCurrentPerformance()
        const currentHour = new Date().getHours()
        const currentDay = new Date().getDay()
        const recommendations = []

        // Time-based recommendations
        const currentTimeSlot = this.getCurrentTimeSlot(currentHour)
        if (currentTimeSlot) {
            recommendations.push({
                type: 'time',
                priority: 'high',
                icon: '⏰',
                title: 'Waktu Optimal Aktif',
                message: `Sekarang ${currentTimeSlot.description} (multiplier ${currentTimeSlot.multiplier}x). Waktu yang tepat untuk aktif!`,
                action: 'Mulai kerja sekarang untuk memaksimalkan pendapatan.',
                impact: `+${((currentTimeSlot.multiplier - 1) * 100).toFixed(0)}% potensi pendapatan`
            })
        }

        // Platform recommendations
        if (performance.bestPlatform && performance.worstPlatform) {
            const improvement = ((performance.bestPlatform.avg - performance.worstPlatform.avg) / performance.worstPlatform.avg * 100)
            if (improvement > 20) {
                recommendations.push({
                    type: 'platform',
                    priority: 'high',
                    icon: '📱',
                    title: 'Fokus Platform Terbaik',
                    message: `${performance.bestPlatform.name.toUpperCase()} performa ${improvement.toFixed(0)}% lebih baik dari ${performance.worstPlatform.name.toUpperCase()}`,
                    action: `Prioritaskan ${performance.bestPlatform.name.toUpperCase()} untuk meningkatkan pendapatan.`,
                    impact: `+Rp ${this.formatCurrency(performance.bestPlatform.avg - performance.worstPlatform.avg)}/hari`
                })
            }
        }

        // Efficiency recommendations
        if (performance.efficiency < 2000) {
            recommendations.push({
                type: 'efficiency',
                priority: 'medium',
                icon: '⛽',
                title: 'Tingkatkan Efisiensi',
                message: `Efisiensi saat ini Rp ${this.formatCurrency(performance.efficiency)}/km masih bisa ditingkatkan`,
                action: 'Pilih order jarak menengah (5-15km) dan hindari macet panjang.',
                impact: 'Potensi +15-25% pendapatan bersih'
            })
        }

        // Weather-based recommendations
        const weatherRec = this.getWeatherRecommendation()
        if (weatherRec) {
            recommendations.push(weatherRec)
        }

        // Day-based recommendations
        const dayRec = this.getDayBasedRecommendation(currentDay)
        if (dayRec) {
            recommendations.push(dayRec)
        }

        return recommendations.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
            return priorityOrder[b.priority] - priorityOrder[a.priority]
        })
    }

    getCurrentTimeSlot(hour) {
        for (const [key, slot] of Object.entries(this.optimizationRules.timeSlots)) {
            if (hour >= slot.start && hour < slot.end) {
                return slot
            }
        }
        return null
    }

    getWeatherRecommendation() {
        // Simulate weather detection (in real app, use weather API)
        const hour = new Date().getHours()
        const isRainyTime = (hour >= 14 && hour <= 17) || (hour >= 19 && hour <= 21)

        if (isRainyTime) {
            return {
                type: 'weather',
                priority: 'medium',
                icon: '🌧️',
                title: 'Potensi Hujan',
                message: 'Waktu yang biasanya hujan. Demand naik tapi hati-hati di jalan.',
                action: 'Siapkan jas hujan dan fokus ke area yang tidak banjir.',
                impact: '+30% demand, tapi -10% efisiensi'
            }
        }
        return null
    }

    getDayBasedRecommendation(day) {
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
        const dayName = dayNames[day]

        if (day === 0 || day === 6) { // Weekend
            return {
                type: 'day',
                priority: 'medium',
                icon: '🎉',
                title: 'Strategi Weekend',
                message: `Hari ${dayName} - fokus ke area rekreasi dan mall`,
                action: 'Target area wisata, mall, dan tempat hiburan. Mulai agak siang.',
                impact: 'Jarak lebih jauh tapi tarif lebih tinggi'
            }
        } else if (day >= 1 && day <= 5) { // Weekday
            return {
                type: 'day',
                priority: 'low',
                icon: '💼',
                title: 'Strategi Weekday',
                message: `Hari ${dayName} - fokus ke area perkantoran dan bisnis`,
                action: 'Target area CBD, perkantoran, dan stasiun. Mulai pagi.',
                impact: 'Order lebih konsisten dengan pola rush hour'
            }
        }
        return null
    }

    calculatePotentialEarnings(recommendations) {
        let baseEarnings = this.analyzeCurrentPerformance().avgDailyEarnings
        let optimizedEarnings = baseEarnings

        recommendations.forEach(rec => {
            switch (rec.type) {
                case 'time':
                    optimizedEarnings *= 1.2 // 20% boost from optimal timing
                    break
                case 'platform':
                    optimizedEarnings *= 1.15 // 15% boost from platform optimization
                    break
                case 'efficiency':
                    optimizedEarnings *= 1.1 // 10% boost from efficiency
                    break
                case 'weather':
                    optimizedEarnings *= 1.05 // 5% boost from weather awareness
                    break
            }
        })

        return {
            current: baseEarnings,
            optimized: optimizedEarnings,
            improvement: optimizedEarnings - baseEarnings,
            percentage: baseEarnings > 0 ? ((optimizedEarnings - baseEarnings) / baseEarnings * 100) : 0
        }
    }

    generateActionPlan() {
        const recommendations = this.generateOptimizationRecommendations()
        const potential = this.calculatePotentialEarnings(recommendations)

        return {
            immediate: recommendations.filter(r => r.priority === 'high').slice(0, 2),
            shortTerm: recommendations.filter(r => r.priority === 'medium').slice(0, 3),
            longTerm: recommendations.filter(r => r.priority === 'low'),
            potential
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID').format(Math.round(amount))
    }

    exportOptimizationReport() {
        const actionPlan = this.generateActionPlan()
        const performance = this.analyzeCurrentPerformance()

        let report = `RELI - LAPORAN OPTIMASI PENDAPATAN\n`
        report += `Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\n`

        report += `ANALISIS PERFORMA SAAT INI:\n`
        report += `• Rata-rata Harian: Rp ${this.formatCurrency(performance.avgDailyEarnings)}\n`
        report += `• Platform Terbaik: ${performance.bestPlatform?.name?.toUpperCase() || 'N/A'}\n`
        report += `• Efisiensi: Rp ${this.formatCurrency(performance.efficiency)}/km\n\n`

        report += `POTENSI PENINGKATAN:\n`
        report += `• Pendapatan Saat Ini: Rp ${this.formatCurrency(actionPlan.potential.current)}/hari\n`
        report += `• Potensi Optimal: Rp ${this.formatCurrency(actionPlan.potential.optimized)}/hari\n`
        report += `• Peningkatan: +Rp ${this.formatCurrency(actionPlan.potential.improvement)} (+${actionPlan.potential.percentage.toFixed(1)}%)\n\n`

        report += `REKOMENDASI PRIORITAS TINGGI:\n`
        actionPlan.immediate.forEach((rec, index) => {
            report += `${index + 1}. ${rec.title}\n`
            report += `   ${rec.message}\n`
            report += `   Action: ${rec.action}\n`
            report += `   Impact: ${rec.impact}\n\n`
        })

        report += `REKOMENDASI JANGKA PENDEK:\n`
        actionPlan.shortTerm.forEach((rec, index) => {
            report += `${index + 1}. ${rec.title}\n`
            report += `   ${rec.message}\n`
            report += `   Action: ${rec.action}\n\n`
        })

        // Download report
        const blob = new Blob([report], { type: 'text/plain' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reli-optimization-report-${new Date().toISOString().split('T')[0]}.txt`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    render() {
        const container = document.createElement('div')
        container.className = 'card bg-base-200 p-4 mb-4'

        const title = new Label('AI Earnings Optimizer', '🚀')
        container.appendChild(title.render())

        const actionPlan = this.generateActionPlan()
        const performance = this.analyzeCurrentPerformance()

        container.innerHTML += `
            <div class="mt-4">
                <!-- Potential Earnings -->
                <div class="alert alert-success mb-4">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">💰</span>
                        <div>
                            <h3 class="font-bold">Potensi Peningkatan Pendapatan</h3>
                            <div class="text-sm">
                                Dari Rp ${this.formatCurrency(actionPlan.potential.current)}/hari → 
                                <span class="font-bold text-success">Rp ${this.formatCurrency(actionPlan.potential.optimized)}/hari</span>
                                <span class="badge badge-success ml-2">+${actionPlan.potential.percentage.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Immediate Actions -->
                <div class="card bg-base-100 p-4 mb-4">
                    <h3 class="font-bold mb-3 text-error">🔥 Aksi Segera (Prioritas Tinggi)</h3>
                    <div class="space-y-3">
                        ${actionPlan.immediate.map(rec => `
                            <div class="alert alert-error">
                                <div class="flex items-start gap-3">
                                    <span class="text-xl">${rec.icon}</span>
                                    <div class="flex-1">
                                        <div class="font-bold text-sm">${rec.title}</div>
                                        <div class="text-xs mt-1">${rec.message}</div>
                                        <div class="text-xs mt-2 font-medium">Action: ${rec.action}</div>
                                        <div class="badge badge-success badge-sm mt-2">${rec.impact}</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Short Term Actions -->
                <div class="card bg-base-100 p-4 mb-4">
                    <h3 class="font-bold mb-3 text-warning">⚡ Aksi Jangka Pendek</h3>
                    <div class="space-y-2">
                        ${actionPlan.shortTerm.map(rec => `
                            <div class="alert alert-warning py-2">
                                <div class="flex items-start gap-2">
                                    <span class="text-lg">${rec.icon}</span>
                                    <div class="flex-1">
                                        <div class="font-medium text-sm">${rec.title}</div>
                                        <div class="text-xs">${rec.message}</div>
                                        <div class="text-xs mt-1 opacity-80">${rec.action}</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Performance Summary -->
                <div class="card bg-base-100 p-4 mb-4">
                    <h3 class="font-bold mb-3">📊 Ringkasan Performa</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="stat bg-base-200 rounded p-3">
                            <div class="stat-title text-xs">Platform Terbaik</div>
                            <div class="stat-value text-sm">${performance.bestPlatform?.name?.toUpperCase() || 'N/A'}</div>
                            <div class="stat-desc text-xs">Rp ${this.formatCurrency(performance.bestPlatform?.avg || 0)}/hari</div>
                        </div>
                        <div class="stat bg-base-200 rounded p-3">
                            <div class="stat-title text-xs">Efisiensi</div>
                            <div class="stat-value text-sm">Rp ${this.formatCurrency(performance.efficiency)}</div>
                            <div class="stat-desc text-xs">per kilometer</div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="grid grid-cols-2 gap-2">
                    <button class="btn btn-primary btn-sm export-optimization-btn">
                        📋 Export Laporan
                    </button>
                    <button class="btn btn-secondary btn-sm refresh-optimizer-btn">
                        🔄 Refresh Analisis
                    </button>
                </div>
            </div>
        `

        // Add event listeners
        setTimeout(() => {
            const exportBtn = container.querySelector('.export-optimization-btn')
            const refreshBtn = container.querySelector('.refresh-optimizer-btn')

            if (exportBtn) {
                exportBtn.onclick = () => this.exportOptimizationReport()
            }

            if (refreshBtn) {
                refreshBtn.onclick = () => {
                    const parent = container.parentNode
                    const newContainer = this.render()
                    parent.replaceChild(newContainer, container)
                }
            }
        }, 0)

        return container
    }
}