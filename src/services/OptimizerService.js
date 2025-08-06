/**
 * Optimizer Service
 * AI-powered recommendations for driver earnings optimization
 */

import { analyticsService } from './AnalyticsService.js'

export class OptimizerService {
    /**
     * Get comprehensive optimization recommendations
     */
    async getOptimizationRecommendations() {
        try {
            // Get analytics data for analysis
            const summaryResult = await analyticsService.getSummaryStats(30)
            const dailyResult = await analyticsService.getDailyStats(30)
            const trendResult = await analyticsService.getTrendAnalysis(14)

            if (!summaryResult.success || !dailyResult.success) {
                return {
                    success: false,
                    error: 'Insufficient data for optimization analysis',
                }
            }

            const summary = summaryResult.data
            const dailyStats = dailyResult.data
            const trend = trendResult.success ? trendResult.data : null

            // Generate recommendations
            const recommendations = {
                earnings: await this.generateEarningsRecommendations(summary, dailyStats, trend),
                fuel: await this.generateFuelRecommendations(summary, dailyStats),
                platform: await this.generatePlatformRecommendations(summary, dailyStats),
                time: await this.generateTimeRecommendations(dailyStats),
                cost: await this.generateCostRecommendations(summary, dailyStats),
                overall: await this.generateOverallScore(summary, dailyStats),
            }

            return {
                success: true,
                data: recommendations,
            }
        } catch (error) {
            console.error('Error generating optimization recommendations:', error)
            return {
                success: false,
                error: error.message,
            }
        }
    }

    /**
     * Generate earnings optimization recommendations
     */
    async generateEarningsRecommendations(summary, dailyStats, trend) {
        const recommendations = []
        const avgEarnings = summary.averageEarnings
        const bestDay = summary.bestDay
        const worstDay = summary.worstDay

        // Trend-based recommendations
        if (trend) {
            if (trend.trend === 'decreasing') {
                recommendations.push({
                    type: 'warning',
                    title: 'Pendapatan Menurun',
                    description: `Pendapatan turun ${Math.abs(trend.change).toFixed(1)}% dalam 2 minggu terakhir`,
                    action: 'Fokus pada platform dengan performa terbaik dan tingkatkan jam kerja di waktu prime time',
                    priority: 'high',
                    impact: 'high',
                })
            } else if (trend.trend === 'increasing') {
                recommendations.push({
                    type: 'success',
                    title: 'Momentum Positif',
                    description: `Pendapatan naik ${trend.change.toFixed(1)}% dalam 2 minggu terakhir`,
                    action: 'Pertahankan strategi saat ini dan pertimbangkan untuk menambah jam kerja',
                    priority: 'medium',
                    impact: 'medium',
                })
            }
        }

        // Best vs worst day analysis
        if (bestDay && worstDay && bestDay.earnings > worstDay.earnings * 1.5) {
            const dayDiff = bestDay.earnings - worstDay.earnings
            recommendations.push({
                type: 'info',
                title: 'Konsistensi Pendapatan',
                description: `Gap antara hari terbaik dan terburuk: Rp ${this.formatCurrency(dayDiff)}`,
                action: 'Analisis pola hari terbaik dan terapkan strategi serupa di hari lain',
                priority: 'medium',
                impact: 'high',
            })
        }

        // Average earnings benchmark
        const nationalAverage = 150000 // Estimated national average for ojol drivers
        if (avgEarnings < nationalAverage) {
            recommendations.push({
                type: 'warning',
                title: 'Pendapatan Di Bawah Rata-rata',
                description: `Rata-rata harian Anda: Rp ${this.formatCurrency(avgEarnings)}`,
                action: 'Pertimbangkan untuk bekerja di area dengan demand tinggi atau jam prime time',
                priority: 'high',
                impact: 'high',
            })
        } else if (avgEarnings > nationalAverage * 1.2) {
            recommendations.push({
                type: 'success',
                title: 'Performa Excellent',
                description: `Pendapatan Anda 20% di atas rata-rata nasional`,
                action: 'Bagikan strategi Anda dengan driver lain atau pertimbangkan menjadi mentor',
                priority: 'low',
                impact: 'low',
            })
        }

        return recommendations
    }

    /**
     * Generate fuel efficiency recommendations
     */
    async generateFuelRecommendations(summary, dailyStats) {
        const recommendations = []
        const avgConsumption = summary.averageFuelConsumption
        const totalDistance = summary.totalDistance
        const totalFuel = summary.totalFuel

        // Fuel efficiency analysis
        if (avgConsumption < 10) {
            recommendations.push({
                type: 'warning',
                title: 'Konsumsi BBM Tinggi',
                description: `Rata-rata konsumsi: ${avgConsumption.toFixed(1)} km/liter`,
                action: 'Periksa kondisi kendaraan, ganti filter udara, dan pertimbangkan gaya berkendara yang lebih efisien',
                priority: 'high',
                impact: 'high',
            })
        } else if (avgConsumption > 15) {
            recommendations.push({
                type: 'success',
                title: 'Efisiensi BBM Excellent',
                description: `Konsumsi BBM sangat efisien: ${avgConsumption.toFixed(1)} km/liter`,
                action: 'Pertahankan gaya berkendara saat ini dan rawat kendaraan dengan baik',
                priority: 'low',
                impact: 'low',
            })
        }

        // Distance vs earnings ratio
        if (totalDistance > 0 && summary.totalEarnings > 0) {
            const earningsPerKm = summary.totalEarnings / totalDistance
            if (earningsPerKm < 500) {
                recommendations.push({
                    type: 'info',
                    title: 'Optimasi Rute',
                    description: `Pendapatan per km: Rp ${this.formatCurrency(earningsPerKm)}`,
                    action: 'Fokus pada order jarak dekat dengan nilai tinggi, hindari perjalanan kosong',
                    priority: 'medium',
                    impact: 'medium',
                })
            }
        }

        return recommendations
    }

    /**
     * Generate platform optimization recommendations
     */
    async generatePlatformRecommendations(summary, dailyStats) {
        const recommendations = []
        const platformBreakdown = summary.platformBreakdown
        const totalPlatformEarnings = Object.values(platformBreakdown).reduce((a, b) => a + b, 0)

        if (totalPlatformEarnings === 0) {
            return [
                {
                    type: 'info',
                    title: 'Multi-Platform Strategy',
                    description: 'Belum ada data platform yang cukup',
                    action: 'Coba gunakan multiple platform untuk memaksimalkan order',
                    priority: 'medium',
                    impact: 'high',
                },
            ]
        }

        // Find best performing platform
        const sortedPlatforms = Object.entries(platformBreakdown)
            .sort(([, a], [, b]) => b - a)
            .filter(([, earnings]) => earnings > 0)

        if (sortedPlatforms.length > 0) {
            const [bestPlatform, bestEarnings] = sortedPlatforms[0]
            const bestPercentage = ((bestEarnings / totalPlatformEarnings) * 100).toFixed(1)

            if (bestPercentage > 70) {
                recommendations.push({
                    type: 'warning',
                    title: 'Ketergantungan Platform Tinggi',
                    description: `${bestPlatform.charAt(0).toUpperCase() + bestPlatform.slice(1)} menyumbang ${bestPercentage}% pendapatan`,
                    action: 'Diversifikasi ke platform lain untuk mengurangi risiko',
                    priority: 'medium',
                    impact: 'medium',
                })
            } else if (sortedPlatforms.length === 1) {
                recommendations.push({
                    type: 'info',
                    title: 'Ekspansi Platform',
                    description: 'Hanya menggunakan satu platform',
                    action: 'Coba daftar di platform lain seperti Grab, Gojek, Maxim, atau InDrive',
                    priority: 'high',
                    impact: 'high',
                })
            }

            // Recommend focusing on best platform
            if (sortedPlatforms.length > 1) {
                const [secondPlatform, secondEarnings] = sortedPlatforms[1]
                if (bestEarnings > secondEarnings * 2) {
                    recommendations.push({
                        type: 'success',
                        title: 'Platform Unggulan',
                        description: `${bestPlatform.charAt(0).toUpperCase() + bestPlatform.slice(1)} memberikan hasil terbaik`,
                        action: 'Fokuskan lebih banyak waktu di platform ini pada jam prime time',
                        priority: 'medium',
                        impact: 'high',
                    })
                }
            }
        }

        return recommendations
    }

    /**
     * Generate time-based recommendations
     */
    async generateTimeRecommendations(dailyStats) {
        const recommendations = []

        // Analyze day patterns (this would need more detailed time data)
        const workingDays = dailyStats.dates.length
        if (workingDays < 20) {
            recommendations.push({
                type: 'info',
                title: 'Konsistensi Kerja',
                description: `Bekerja ${workingDays} hari dalam sebulan`,
                action: 'Pertimbangkan untuk menambah hari kerja untuk meningkatkan pendapatan bulanan',
                priority: 'medium',
                impact: 'high',
            })
        }

        // Prime time recommendations
        recommendations.push({
            type: 'info',
            title: 'Optimasi Waktu Kerja',
            description: 'Maksimalkan pendapatan dengan strategi waktu',
            action: 'Fokus pada jam sibuk: 07:00-09:00, 12:00-14:00, 17:00-20:00, dan weekend',
            priority: 'high',
            impact: 'high',
        })

        return recommendations
    }

    /**
     * Generate cost optimization recommendations
     */
    async generateCostRecommendations(summary, dailyStats) {
        const recommendations = []
        const avgExpenses = summary.averageExpenses
        const avgEarnings = summary.averageEarnings

        if (avgEarnings > 0) {
            const expenseRatio = (avgExpenses / avgEarnings) * 100

            if (expenseRatio > 40) {
                recommendations.push({
                    type: 'warning',
                    title: 'Biaya Operasional Tinggi',
                    description: `Biaya ${expenseRatio.toFixed(1)}% dari pendapatan`,
                    action: 'Review dan kurangi biaya tidak perlu, optimasi rute untuk hemat BBM',
                    priority: 'high',
                    impact: 'high',
                })
            } else if (expenseRatio < 25) {
                recommendations.push({
                    type: 'success',
                    title: 'Manajemen Biaya Excellent',
                    description: `Biaya hanya ${expenseRatio.toFixed(1)}% dari pendapatan`,
                    action: 'Pertahankan efisiensi biaya saat ini',
                    priority: 'low',
                    impact: 'low',
                })
            }
        }

        return recommendations
    }

    /**
     * Generate overall performance score
     */
    async generateOverallScore(summary, dailyStats) {
        let score = 0
        let maxScore = 0
        const factors = []

        // Earnings consistency (25 points)
        maxScore += 25
        if (summary.bestDay && summary.worstDay) {
            const consistency =
                1 - Math.abs(summary.bestDay.earnings - summary.worstDay.earnings) / summary.averageEarnings
            const consistencyScore = Math.max(0, Math.min(25, consistency * 25))
            score += consistencyScore
            factors.push({
                name: 'Konsistensi Pendapatan',
                score: consistencyScore,
                maxScore: 25,
                percentage: ((consistencyScore / 25) * 100).toFixed(1),
            })
        }

        // Fuel efficiency (20 points)
        maxScore += 20
        const fuelScore = Math.min(20, Math.max(0, (summary.averageFuelConsumption - 8) * 2))
        score += fuelScore
        factors.push({
            name: 'Efisiensi BBM',
            score: fuelScore,
            maxScore: 20,
            percentage: ((fuelScore / 20) * 100).toFixed(1),
        })

        // Platform diversification (15 points)
        maxScore += 15
        const activePlatforms = Object.values(summary.platformBreakdown).filter(v => v > 0).length
        const diversificationScore = Math.min(15, activePlatforms * 5)
        score += diversificationScore
        factors.push({
            name: 'Diversifikasi Platform',
            score: diversificationScore,
            maxScore: 15,
            percentage: ((diversificationScore / 15) * 100).toFixed(1),
        })

        // Cost management (20 points)
        maxScore += 20
        const expenseRatio = summary.averageEarnings > 0 ? summary.averageExpenses / summary.averageEarnings : 1
        const costScore = Math.max(0, Math.min(20, (0.4 - expenseRatio) * 50))
        score += costScore
        factors.push({
            name: 'Manajemen Biaya',
            score: costScore,
            maxScore: 20,
            percentage: ((costScore / 20) * 100).toFixed(1),
        })

        // Working days (20 points)
        maxScore += 20
        const workingDays = dailyStats.dates.length
        const workingDaysScore = Math.min(20, workingDays)
        score += workingDaysScore
        factors.push({
            name: 'Konsistensi Kerja',
            score: workingDaysScore,
            maxScore: 20,
            percentage: ((workingDaysScore / 20) * 100).toFixed(1),
        })

        const overallPercentage = ((score / maxScore) * 100).toFixed(1)
        let grade = 'D'
        let gradeColor = 'red'

        if (overallPercentage >= 90) {
            grade = 'A+'
            gradeColor = 'green'
        } else if (overallPercentage >= 80) {
            grade = 'A'
            gradeColor = 'green'
        } else if (overallPercentage >= 70) {
            grade = 'B'
            gradeColor = 'blue'
        } else if (overallPercentage >= 60) {
            grade = 'C'
            gradeColor = 'yellow'
        }

        return {
            score: score.toFixed(1),
            maxScore,
            percentage: overallPercentage,
            grade,
            gradeColor,
            factors,
        }
    }

    /**
     * Get quick optimization tips
     */
    getQuickTips() {
        return [
            {
                icon: '⏰',
                title: 'Waktu Prime Time',
                tip: 'Fokus pada jam 07:00-09:00, 12:00-14:00, dan 17:00-20:00',
            },
            {
                icon: '🗺️',
                title: 'Area Strategis',
                tip: 'Posisikan diri di area perkantoran, mall, dan residential',
            },
            {
                icon: '📱',
                title: 'Multi Platform',
                tip: 'Gunakan 2-3 platform sekaligus untuk maksimalkan order',
            },
            {
                icon: '⛽',
                title: 'Hemat BBM',
                tip: 'Hindari perjalanan kosong, gunakan GPS untuk rute optimal',
            },
            {
                icon: '💰',
                title: 'Kelola Biaya',
                tip: 'Catat semua pengeluaran dan batasi biaya di bawah 30% pendapatan',
            },
            {
                icon: '📊',
                title: 'Analisis Data',
                tip: 'Review performa harian dan identifikasi pola terbaik',
            },
        ]
    }

    /**
     * Format currency helper
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID').format(Math.round(amount || 0))
    }
}

// Create singleton instance
export const optimizerService = new OptimizerService()
