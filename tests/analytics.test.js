/**
 * Tests for AnalyticsService aggregation logic.
 *
 * Supabase is not configured in the test environment, so the service falls
 * back to localStorage (via jsdom). These tests verify the summary/trend math
 * against known inputs — they would fail if the aggregation regressed.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { analyticsService } from '../src/services/AnalyticsService.js'

function seedLocalStorage(records) {
    const data = {}
    for (const [date, r] of Object.entries(records)) {
        data[date] = {
            platforms: r.platforms || {},
            fuel: r.fuel || {},
            additionalCosts: r.additionalCosts || {},
            results: r.results,
        }
    }
    localStorage.setItem('reli-data', JSON.stringify(data))
}

describe('AnalyticsService.getSummaryStats', () => {
    beforeEach(() => localStorage.clear())
    afterEach(() => localStorage.clear())

    it('returns zeroed summary when there is no data', async () => {
        const res = await analyticsService.getSummaryStats(30)
        expect(res.success).toBe(true)
        expect(res.data.totalDays).toBe(0)
        expect(res.data.totalEarnings).toBe(0)
        expect(res.data.bestDay).toBeNull()
        expect(res.data.worstDay).toBeNull()
        expect(res.data.platformBreakdown).toEqual({ grab: 0, maxim: 0, gojek: 0, indrive: 0 })
    })

    it('aggregates earnings, expenses, distance, and platform breakdown', async () => {
        seedLocalStorage({
            '2025-01-01': {
                results: { totalKotor: 500000, biayaBBM: 80000, totalAdditionalCosts: 20000, pendapatanBersih: 400000 },
                fuel: { jarak: 120, literTerpakai: 8 },
                platforms: { grab: { kotor: 300000 }, maxim: { kotor: 200000 } },
            },
            '2025-01-02': {
                results: { totalKotor: 300000, biayaBBM: 50000, totalAdditionalCosts: 10000, pendapatanBersih: 240000 },
                fuel: { jarak: 80, literTerpakai: 5 },
                platforms: { grab: { kotor: 300000 } },
            },
        })

        const res = await analyticsService.getSummaryStats(30)
        expect(res.success).toBe(true)
        expect(res.data.totalDays).toBe(2)
        expect(res.data.totalEarnings).toBe(640000)
        expect(res.data.totalExpenses).toBe(160000)
        expect(res.data.totalDistance).toBe(200)
        expect(res.data.totalFuel).toBe(13)
        expect(res.data.averageEarnings).toBe(320000)
        expect(res.data.platformBreakdown.grab).toBe(600000)
        expect(res.data.platformBreakdown.maxim).toBe(200000)
    })

    it('identifies best and worst day by pendapatanBersih', async () => {
        seedLocalStorage({
            '2025-01-01': { results: { pendapatanBersih: 100000 } },
            '2025-01-02': { results: { pendapatanBersih: 500000 } },
            '2025-01-03': { results: { pendapatanBersih: 300000 } },
        })
        const res = await analyticsService.getSummaryStats(30)
        expect(res.data.bestDay.date).toBe('2025-01-02')
        expect(res.data.bestDay.earnings).toBe(500000)
        expect(res.data.worstDay.date).toBe('2025-01-01')
        expect(res.data.worstDay.earnings).toBe(100000)
    })

    it('computes average fuel consumption = totalDistance / totalFuel', async () => {
        seedLocalStorage({
            '2025-01-01': { results: { pendapatanBersih: 1 }, fuel: { jarak: 150, literTerpakai: 10 } },
            '2025-01-02': { results: { pendapatanBersih: 1 }, fuel: { jarak: 150, literTerpakai: 15 } },
        })
        const res = await analyticsService.getSummaryStats(30)
        expect(res.data.totalDistance).toBe(300)
        expect(res.data.totalFuel).toBe(25)
        expect(res.data.averageFuelConsumption).toBeCloseTo(12, 5)
    })

    it('averageFuelConsumption is 0 when totalFuel is 0 (no divide by zero)', async () => {
        seedLocalStorage({
            '2025-01-01': { results: { pendapatanBersih: 1 }, fuel: { jarak: 150, literTerpakai: 0 } },
        })
        const res = await analyticsService.getSummaryStats(30)
        expect(res.data.averageFuelConsumption).toBe(0)
    })
})

describe('AnalyticsService.getDailyStats', () => {
    beforeEach(() => localStorage.clear())
    afterEach(() => localStorage.clear())

    it('returns time-series arrays sorted ascending and capped to `days`', async () => {
        const records = {}
        for (let i = 1; i <= 20; i++) {
            const d = `2025-01-${String(i).padStart(2, '0')}`
            records[d] = {
                results: { pendapatanBersih: i * 1000, totalKotor: i * 1000, biayaBBM: 0, totalAdditionalCosts: 0 },
            }
        }
        seedLocalStorage(records)

        const res = await analyticsService.getDailyStats(5)
        expect(res.success).toBe(true)
        expect(res.data.dates.length).toBe(5)
        expect(res.data.pendapatanBersih).toEqual([16000, 17000, 18000, 19000, 20000])
    })

    it('skips entries that lack a results object', async () => {
        seedLocalStorage({
            '2025-01-01': { results: { pendapatanBersih: 100 } },
            '2025-01-02': {}, // no results — must be skipped, not crash
        })
        const res = await analyticsService.getDailyStats(30)
        expect(res.data.dates.length).toBe(1)
        expect(res.data.pendapatanBersih).toEqual([100])
    })
})

describe('AnalyticsService.getTrendAnalysis', () => {
    beforeEach(() => localStorage.clear())
    afterEach(() => localStorage.clear())

    it('reports insufficient_data for fewer than 2 points', async () => {
        seedLocalStorage({ '2025-01-01': { results: { pendapatanBersih: 100 } } })
        const res = await analyticsService.getTrendAnalysis(14)
        expect(res.success).toBe(true)
        expect(res.data.trend).toBe('insufficient_data')
        expect(res.data.change).toBe(0)
    })

    it('detects an increasing trend when last half > first half by >10%', async () => {
        // 4 days: first half avg 100k, last half avg 150k => +50%
        seedLocalStorage({
            '2025-01-01': { results: { pendapatanBersih: 100000 } },
            '2025-01-02': { results: { pendapatanBersih: 100000 } },
            '2025-01-03': { results: { pendapatanBersih: 150000 } },
            '2025-01-04': { results: { pendapatanBersih: 150000 } },
        })
        const res = await analyticsService.getTrendAnalysis(14)
        expect(res.data.trend).toBe('increasing')
        expect(res.data.change).toBeGreaterThan(10)
    })

    it('detects a decreasing trend when last half < first half by >10%', async () => {
        seedLocalStorage({
            '2025-01-01': { results: { pendapatanBersih: 200000 } },
            '2025-01-02': { results: { pendapatanBersih: 200000 } },
            '2025-01-03': { results: { pendapatanBersih: 100000 } },
            '2025-01-04': { results: { pendapatanBersih: 100000 } },
        })
        const res = await analyticsService.getTrendAnalysis(14)
        expect(res.data.trend).toBe('decreasing')
        expect(res.data.change).toBeLessThan(-10)
    })

    it('reports stable when change is within ±10%', async () => {
        seedLocalStorage({
            '2025-01-01': { results: { pendapatanBersih: 100000 } },
            '2025-01-02': { results: { pendapatanBersih: 100000 } },
            '2025-01-03': { results: { pendapatanBersih: 105000 } },
            '2025-01-04': { results: { pendapatanBersih: 105000 } },
        })
        const res = await analyticsService.getTrendAnalysis(14)
        expect(res.data.trend).toBe('stable')
    })

    it('percentChange is 0 when first-half average is 0 (no divide by zero)', async () => {
        seedLocalStorage({
            '2025-01-01': { results: { pendapatanBersih: 0 } },
            '2025-01-02': { results: { pendapatanBersih: 0 } },
            '2025-01-03': { results: { pendapatanBersih: 100 } },
            '2025-01-04': { results: { pendapatanBersih: 100 } },
        })
        const res = await analyticsService.getTrendAnalysis(14)
        expect(res.data.change).toBe(0)
    })
})
