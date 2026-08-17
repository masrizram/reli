/**
 * B1 tests: Per-platform time-series chart data.
 *
 * Verifies that getDailyStats already provides per-platform arrays that
 * are correctly populated, aligned by date, and safe when data is missing.
 * The chart rendering is DOM-coupled in main.js, so these tests validate
 * the data preparation layer that feeds the chart datasets.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { analyticsService } from '../src/services/AnalyticsService.js'

function seedLocalStorage(records) {
    localStorage.clear()
    localStorage.setItem('reli-data', JSON.stringify(records))
}

describe('B1: getDailyStats platform arrays', () => {
    beforeEach(() => localStorage.clear())
    afterEach(() => localStorage.clear())

    it('populates per-platform arrays when data exists', async () => {
        seedLocalStorage({
            '2025-01-01': {
                platforms: {
                    grab: { kotor: 100000 },
                    maxim: { kotor: 50000 },
                    gojek: { kotor: 30000 },
                    indrive: { kotor: 20000 },
                },
                results: { pendapatanBersih: 50000 },
            },
            '2025-01-02': {
                platforms: {
                    grab: { kotor: 200000 },
                    maxim: { kotor: 75000 },
                    gojek: { kotor: 40000 },
                    indrive: { kotor: 25000 },
                },
                results: { pendapatanBersih: 100000 },
            },
        })
        const result = await analyticsService.getDailyStats(14)
        expect(result.success).toBe(true)
        const stats = result.data
        expect(stats.platforms.grab).toEqual([100000, 200000])
        expect(stats.platforms.maxim).toEqual([50000, 75000])
        expect(stats.platforms.gojek).toEqual([30000, 40000])
        expect(stats.platforms.indrive).toEqual([20000, 25000])
    })

    it('platform arrays align with the dates array', async () => {
        seedLocalStorage({
            '2025-01-01': {
                platforms: { grab: { kotor: 100 } },
                results: { pendapatanBersih: 50 },
            },
            '2025-01-02': {
                platforms: { grab: { kotor: 200 } },
                results: { pendapatanBersih: 100 },
            },
        })
        const result = await analyticsService.getDailyStats(14)
        const stats = result.data
        expect(stats.dates.length).toBe(stats.platforms.grab.length)
    })

    it('defaults missing platform kotor to 0', async () => {
        seedLocalStorage({
            '2025-01-01': {
                platforms: { grab: { kotor: 100 } },
                // maxim, gojek, indrive absent
                results: { pendapatanBersih: 50 },
            },
        })
        const result = await analyticsService.getDailyStats(14)
        const stats = result.data
        expect(stats.platforms.grab).toEqual([100])
        expect(stats.platforms.maxim).toEqual([0])
        expect(stats.platforms.gojek).toEqual([0])
        expect(stats.platforms.indrive).toEqual([0])
    })

    it('is safe with empty data', async () => {
        seedLocalStorage({})
        const result = await analyticsService.getDailyStats(14)
        expect(result.success).toBe(true)
        expect(result.data.platforms.grab).toEqual([])
        expect(result.data.platforms.maxim).toEqual([])
    })

    it('aggregate values remain unchanged', async () => {
        seedLocalStorage({
            '2025-01-01': {
                platforms: {
                    grab: { kotor: 100000 },
                    maxim: { kotor: 50000 },
                },
                results: { totalKotor: 150000, pendapatanBersih: 100000, biayaBBM: 30000 },
            },
        })
        const result = await analyticsService.getDailyStats(14)
        const stats = result.data
        // Aggregate totalKotor must equal the results, not the sum of platforms
        expect(stats.totalKotor).toEqual([150000])
        expect(stats.pendapatanBersih).toEqual([100000])
        expect(stats.biayaBBM).toEqual([30000])
    })

    it('chart datasets can be constructed from platform arrays without error', () => {
        // Simulates the chart dataset construction logic from initializeCharts.
        const stats = {
            dates: ['Jan 1', 'Jan 2'],
            platforms: {
                grab: [100000, 200000],
                maxim: [50000, 75000],
                gojek: [0, 0],
                indrive: [0, 25000],
            },
        }
        const platformColors = {
            grab: 'rgb(34, 197, 94)',
            maxim: 'rgb(251, 146, 60)',
            gojek: 'rgb(59, 130, 246)',
            indrive: 'rgb(147, 51, 234)',
        }
        const datasets = ['grab', 'maxim', 'gojek', 'indrive'].map(p => ({
            label: `${p.charAt(0).toUpperCase() + p.slice(1)} Kotor`,
            data: stats.platforms[p] || [],
            borderColor: platformColors[p],
        }))
        expect(datasets).toHaveLength(4)
        expect(datasets[0].data).toEqual([100000, 200000])
        expect(datasets[1].data).toEqual([50000, 75000])
        expect(datasets[2].data).toEqual([0, 0])
        expect(datasets[3].data).toEqual([0, 25000])
        // Each dataset has a non-empty label and a color
        for (const d of datasets) {
            expect(d.label).toBeTruthy()
            expect(d.borderColor).toBeTruthy()
        }
    })
})
