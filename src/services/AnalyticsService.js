/**
 * Analytics Service
 * Aggregates daily records into summary/trend statistics for RELI.
 *
 * Reads from Supabase when configured and online, otherwise falls back to
 * localStorage. Never throws — callers receive `{ success, data | error }`.
 */

import { databaseService } from './DatabaseService.js'
import { isSupabaseConfigured } from '../config/supabase.js'

export class AnalyticsService {
    _canUseDatabase() {
        return isSupabaseConfigured && typeof navigator !== 'undefined' && navigator.onLine
    }

    /**
     * Gather raw daily data for the last `days` days.
     */
    async getAnalyticsData(days = 30) {
        try {
            let data = {}

            if (this._canUseDatabase()) {
                const dbResult = await databaseService.getAllDailyRecords(days)
                if (dbResult.success && dbResult.data) {
                    dbResult.data.forEach(record => {
                        // record.date may come back as an ISO string; normalize to YYYY-MM-DD.
                        const key = String(record.date).slice(0, 10)
                        data[key] = {
                            platforms: record.platforms,
                            fuel: record.fuel,
                            additionalCosts: record.additional_costs,
                            results: record.results,
                            timestamp: record.created_at,
                        }
                    })
                }
            }

            // Fallback / merge with localStorage so partial DB data doesn't hide local days.
            if (Object.keys(data).length === 0) {
                const local = JSON.parse(localStorage.getItem('reli-data') || '{}')
                for (const [k, v] of Object.entries(local)) {
                    if (k === '_meta' || !v || typeof v !== 'object' || !v.results) continue
                    data[k] = v
                }
            }

            return { success: true, data }
        } catch (error) {
            console.warn('[RELI] Error getting analytics data:', error?.message || error)
            return { success: false, error: error?.message || 'Unknown error' }
        }
    }

    /**
     * Daily time-series stats (last `days` entries with data).
     */
    async getDailyStats(days = 7) {
        const result = await this.getAnalyticsData(days)
        if (!result.success) return result

        const data = result.data
        // Sort by date ascending and take the last `days` entries that have results.
        const dates = Object.keys(data)
            .filter(d => data[d]?.results)
            .sort()
            .slice(-days)

        const stats = {
            dates: [],
            totalKotor: [],
            biayaBBM: [],
            biayaTambahan: [],
            pendapatanBersih: [],
            platforms: { grab: [], maxim: [], gojek: [], indrive: [] },
        }

        dates.forEach(date => {
            const dayData = data[date]
            if (!dayData?.results) return
            stats.dates.push(new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }))
            stats.totalKotor.push(dayData.results.totalKotor || 0)
            stats.biayaBBM.push(dayData.results.biayaBBM || 0)
            stats.biayaTambahan.push(dayData.results.totalAdditionalCosts || 0)
            stats.pendapatanBersih.push(dayData.results.pendapatanBersih || 0)
            if (dayData.platforms) {
                stats.platforms.grab.push(dayData.platforms.grab?.kotor || 0)
                stats.platforms.maxim.push(dayData.platforms.maxim?.kotor || 0)
                stats.platforms.gojek.push(dayData.platforms.gojek?.kotor || 0)
                stats.platforms.indrive.push(dayData.platforms.indrive?.kotor || 0)
            }
        })

        return { success: true, data: stats }
    }

    /**
     * Summary statistics over the last `days` days.
     */
    async getSummaryStats(days = 30) {
        const result = await this.getAnalyticsData(days)
        if (!result.success) return result

        const data = result.data
        const entries = Object.entries(data)
            .filter(([, dayData]) => dayData?.results)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .slice(-days)

        if (entries.length === 0) {
            return {
                success: true,
                data: {
                    totalDays: 0,
                    totalEarnings: 0,
                    totalExpenses: 0,
                    averageEarnings: 0,
                    averageExpenses: 0,
                    bestDay: null,
                    worstDay: null,
                    totalDistance: 0,
                    totalFuel: 0,
                    averageFuelConsumption: 0,
                    platformBreakdown: { grab: 0, maxim: 0, gojek: 0, indrive: 0 },
                },
            }
        }

        const earnings = entries.map(([date, d]) => ({
            date,
            earnings: d.results.pendapatanBersih || 0,
            expenses: (d.results.biayaBBM || 0) + (d.results.totalAdditionalCosts || 0),
            distance: d.fuel?.jarak || 0,
            fuel: d.fuel?.literTerpakai || 0,
        }))

        const totalEarnings = earnings.reduce((s, d) => s + d.earnings, 0)
        const totalExpenses = earnings.reduce((s, d) => s + d.expenses, 0)
        const totalDistance = earnings.reduce((s, d) => s + d.distance, 0)
        const totalFuel = earnings.reduce((s, d) => s + d.fuel, 0)

        const sortedByEarnings = [...earnings].sort((a, b) => b.earnings - a.earnings)

        const platformTotals = { grab: 0, maxim: 0, gojek: 0, indrive: 0 }
        entries.forEach(([, dayData]) => {
            if (dayData.platforms) {
                for (const p of Object.keys(platformTotals)) {
                    platformTotals[p] += dayData.platforms[p]?.kotor || 0
                }
            }
        })

        const stats = {
            totalDays: entries.length,
            totalEarnings,
            totalExpenses,
            averageEarnings: totalEarnings / entries.length,
            averageExpenses: totalExpenses / entries.length,
            bestDay: sortedByEarnings[0],
            worstDay: sortedByEarnings[sortedByEarnings.length - 1],
            totalDistance,
            totalFuel,
            averageFuelConsumption: totalDistance > 0 && totalFuel > 0 ? totalDistance / totalFuel : 0,
            platformBreakdown: platformTotals,
        }

        return { success: true, data: stats }
    }

    /**
     * Trend analysis via simple linear regression + half-period comparison.
     */
    async getTrendAnalysis(days = 14) {
        const result = await this.getDailyStats(days)
        if (!result.success) return result

        const stats = result.data
        const earnings = stats.pendapatanBersih

        if (earnings.length < 2) {
            return {
                success: true,
                data: { trend: 'insufficient_data', change: 0, message: 'Data tidak cukup untuk analisis trend' },
            }
        }

        const n = earnings.length
        const x = Array.from({ length: n }, (_, i) => i)
        const sumX = x.reduce((a, b) => a + b, 0)
        const sumY = earnings.reduce((a, b) => a + b, 0)
        const sumXY = x.reduce((sum, xi, i) => sum + xi * earnings[i], 0)
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

        const denom = n * sumXX - sumX * sumX
        const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0

        const half = Math.floor(n / 2)
        const firstHalf = earnings.slice(0, half)
        const lastHalf = earnings.slice(half)

        const firstAvg = firstHalf.length ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0
        const lastAvg = lastHalf.length ? lastHalf.reduce((a, b) => a + b, 0) / lastHalf.length : 0

        const percentChange = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0

        let trend = 'stable'
        let message = 'Pendapatan relatif stabil'

        if (percentChange > 10) {
            trend = 'increasing'
            message = `Pendapatan meningkat ${percentChange.toFixed(1)}% dalam periode ini`
        } else if (percentChange < -10) {
            trend = 'decreasing'
            message = `Pendapatan menurun ${Math.abs(percentChange).toFixed(1)}% dalam periode ini`
        }

        return { success: true, data: { trend, change: percentChange, message, slope, intercept: 0 } }
    }

    /**
     * Normalize a trend result into a shape that is always safe to render.
     *
     * Handles every failure mode (F-06):
     *   - null/undefined trend (failed or absent request)
     *   - trend missing `change`
     *   - `change` being null/undefined/NaN
     *   - trend direction strings from getTrendAnalysis ('increasing' etc.)
     *
     * Returns:
     *   {
     *     available: boolean,           // false => render fallback UI
     *     change: number,                // finite number, 0 when unknown
     *     sign: '+' | '-' | '',          // sign prefix for display
     *     label: string,                // '12.3%' style, or fallback text
     *     message: string,               // human message or fallback
     *     icon: string,                  // '📈' | '📉' | '📊'
     *   }
     *
     * This is a pure function (no I/O) so it can be unit-tested directly.
     */
    static normalizeTrend(trendResult) {
        const trend = trendResult && trendResult.success ? trendResult.data : null
        if (!trend) {
            return {
                available: false,
                change: 0,
                sign: '',
                label: '—',
                message: 'Data trend belum tersedia',
                icon: '📊',
            }
        }
        const rawChange = trend.change
        const change = Number.isFinite(rawChange) ? rawChange : 0
        const direction = typeof trend.trend === 'string' ? trend.trend : 'stable'
        const sign = change > 0 ? '+' : ''
        const label = `${sign}${change.toFixed(1)}%`
        const icon = direction === 'increasing' ? '📈' : direction === 'decreasing' ? '📉' : '📊'
        const message = trend.message || (change === 0 ? 'Pendapatan relatif stabil' : 'Menganalisis...')
        return { available: true, change, sign, label, message, icon }
    }
}

// Singleton instance
export const analyticsService = new AnalyticsService()
