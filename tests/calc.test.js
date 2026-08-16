import { describe, it, expect } from 'vitest'
import {
    createInitialAppData,
    calculateResults,
    recomputePlatform,
    recomputeFuel,
    recomputeAdditionalCosts,
    toNumber,
    formatCurrency,
    PLATFORMS,
    ADDITIONAL_COST_KEYS,
} from '../src/utils/calc.js'

describe('toNumber', () => {
    it('parses numeric strings', () => {
        expect(toNumber('123')).toBe(123)
        expect(toNumber('123.45')).toBe(123.45)
    })
    it('returns 0 for non-numeric input', () => {
        expect(toNumber('abc')).toBe(0)
        expect(toNumber(null)).toBe(0)
        expect(toNumber(undefined)).toBe(0)
        expect(toNumber(NaN)).toBe(0)
        expect(toNumber(Infinity)).toBe(0)
        expect(toNumber('')).toBe(0)
    })
    it('handles numbers', () => {
        expect(toNumber(42)).toBe(42)
        expect(toNumber(-3.5)).toBe(-3.5)
        expect(toNumber(0)).toBe(0)
    })
})

describe('createInitialAppData', () => {
    it('creates a complete state object with all four platforms', () => {
        const data = createInitialAppData()
        expect(PLATFORMS).toEqual(['grab', 'maxim', 'gojek', 'indrive'])
        for (const p of PLATFORMS) {
            expect(data.platforms[p]).toBeDefined()
            expect(data.platforms[p].topup).toBe(0)
            expect(data.platforms[p].kotor).toBe(0)
            expect(data.platforms[p].komisi).toBe(0)
        }
    })
    it('uses platform-specific default commission', () => {
        const data = createInitialAppData()
        expect(data.platforms.grab.komisiPercent).toBe(20)
        expect(data.platforms.indrive.komisiPercent).toBe(15)
    })
    it('starts in topup mode with sane fuel defaults', () => {
        const data = createInitialAppData()
        expect(data.paymentMode).toBe('topup')
        expect(data.fuel.konsumsi).toBe(14)
        expect(data.fuel.harga).toBe(10000)
    })
})

describe('recomputePlatform — topup mode', () => {
    it('computes kotor = topup - sisa', () => {
        const p = { topup: 500000, sisa: 135300, kotor: 0 }
        recomputePlatform(p, 'topup')
        expect(p.kotor).toBe(364700)
    })
    it('direct kotor input wins over topup-sisa', () => {
        const p = { topup: 500000, sisa: 135300, kotor: 400000 }
        recomputePlatform(p, 'topup')
        expect(p.kotor).toBe(400000)
    })
    it('treats missing fields as 0', () => {
        const p = { topup: 100, sisa: undefined, kotor: 0 }
        recomputePlatform(p, 'topup')
        expect(p.kotor).toBe(100)
    })
})

describe('recomputePlatform — direct mode', () => {
    it('computes komisi from percentage then kotor = cash+transfer-komisi', () => {
        const p = { cash: 200000, transfer: 255875, komisiPercent: 15, komisi: 0, kotor: 0 }
        recomputePlatform(p, 'direct')
        const totalBefore = 200000 + 255875
        const expectedKomisi = (totalBefore * 15) / 100
        expect(p.komisi).toBeCloseTo(expectedKomisi, 2)
        expect(p.kotor).toBeCloseTo(totalBefore - expectedKomisi, 2)
    })
    it('direct kotor input wins and back-calculates komisi', () => {
        const p = { cash: 200000, transfer: 255875, komisiPercent: 20, komisi: 0, kotor: 387494 }
        recomputePlatform(p, 'direct')
        expect(p.kotor).toBe(387494)
        expect(p.komisi).toBeCloseTo(455875 - 387494, 2)
    })
    it('handles 0% commission', () => {
        const p = { cash: 100, transfer: 50, komisiPercent: 0, komisi: 0, kotor: 0 }
        recomputePlatform(p, 'direct')
        expect(p.komisi).toBe(0)
        expect(p.kotor).toBe(150)
    })
})

describe('recomputeFuel', () => {
    it('computes liters and cost', () => {
        const fuel = { jarak: 120, konsumsi: 15, harga: 10000, literTerpakai: 0, biayaBBM: 0 }
        recomputeFuel(fuel)
        expect(fuel.literTerpakai).toBeCloseTo(8, 5)
        expect(fuel.biayaBBM).toBe(80000)
    })
    it('returns zeros when konsumsi is 0 (no division by zero)', () => {
        const fuel = { jarak: 100, konsumsi: 0, harga: 10000, literTerpakai: 99, biayaBBM: 99 }
        recomputeFuel(fuel)
        expect(fuel.literTerpakai).toBe(0)
        expect(fuel.biayaBBM).toBe(0)
    })
    it('returns zeros when jarak is 0', () => {
        const fuel = { jarak: 0, konsumsi: 15, harga: 10000, literTerpakai: 99, biayaBBM: 99 }
        recomputeFuel(fuel)
        expect(fuel.literTerpakai).toBe(0)
        expect(fuel.biayaBBM).toBe(0)
    })
    it('matches README example: 286.6 km / 13.5 km/L @ 10000 => 212296', () => {
        const fuel = { jarak: 286.6, konsumsi: 13.5, harga: 10000, literTerpakai: 0, biayaBBM: 0 }
        recomputeFuel(fuel)
        expect(fuel.literTerpakai).toBeCloseTo(21.2296, 3)
        expect(Math.round(fuel.biayaBBM)).toBe(212296)
    })
})

describe('recomputeAdditionalCosts', () => {
    it('sums all cost keys except total', () => {
        const costs = { parkir: 15000, makan: 25000, kuota: 0, tol: 0, lainnya: 0, total: 0 }
        recomputeAdditionalCosts(costs)
        expect(costs.total).toBe(40000)
    })
    it('ignores a stale total field', () => {
        const costs = { parkir: 10, makan: 0, kuota: 0, tol: 0, lainnya: 0, total: 999 }
        recomputeAdditionalCosts(costs)
        expect(costs.total).toBe(10)
        expect(ADDITIONAL_COST_KEYS).not.toContain('total')
    })
})

describe('calculateResults (full pipeline)', () => {
    it('matches the README topup example', () => {
        const data = createInitialAppData()
        data.paymentMode = 'topup'
        data.platforms.grab.topup = 500000
        data.platforms.grab.sisa = 135300
        data.fuel.jarak = 120
        data.fuel.konsumsi = 15
        data.fuel.harga = 10000
        data.additionalCosts.parkir = 15000
        data.additionalCosts.makan = 25000

        calculateResults(data)

        expect(data.results.totalKotor).toBe(364700)
        expect(data.results.biayaBBM).toBe(80000)
        expect(data.results.totalAdditionalCosts).toBe(40000)
        expect(data.results.pendapatanBersih).toBe(244700)
    })

    it('matches the README direct-mode example', () => {
        const data = createInitialAppData()
        data.paymentMode = 'direct'
        // Single platform: InDrive-style cash+transfer with 15% commission
        data.platforms.indrive.cash = 200000
        data.platforms.indrive.transfer = 255875
        data.platforms.indrive.komisiPercent = 15
        data.fuel.jarak = 120
        data.fuel.konsumsi = 15
        data.fuel.harga = 10000
        data.additionalCosts.parkir = 15000
        data.additionalCosts.makan = 25000

        calculateResults(data)

        const expectedKotor = 200000 + 255875 - ((200000 + 255875) * 15) / 100
        expect(data.platforms.indrive.kotor).toBeCloseTo(expectedKotor, 2)
        expect(data.results.totalKotor).toBeCloseTo(expectedKotor, 2)
        expect(data.results.biayaBBM).toBe(80000)
        expect(data.results.totalAdditionalCosts).toBe(40000)
        expect(data.results.pendapatanBersih).toBeCloseTo(expectedKotor - 80000 - 40000, 2)
    })

    it('matches the database sample row exactly', () => {
        // From database/schema.sql seed row.
        const data = createInitialAppData()
        data.platforms.grab.kotor = 333300
        data.platforms.maxim.kotor = 230600
        data.fuel.jarak = 286.6
        data.fuel.konsumsi = 13.5
        data.fuel.harga = 10000
        data.additionalCosts.makan = 50000
        data.additionalCosts.tol = 200000

        calculateResults(data)

        expect(data.results.totalKotor).toBe(563900)
        expect(data.results.biayaBBM).toBe(212296)
        expect(data.results.totalAdditionalCosts).toBe(250000)
        expect(data.results.pendapatanBersih).toBe(101604)
    })

    it('does not crash on empty/zero inputs', () => {
        const data = createInitialAppData()
        calculateResults(data)
        expect(data.results.totalKotor).toBe(0)
        expect(data.results.pendapatanBersih).toBe(0)
    })
})

describe('formatCurrency', () => {
    it('formats using id-ID grouping', () => {
        expect(formatCurrency(563900)).toBe('563.900')
        expect(formatCurrency(101604)).toBe('101.604')
        expect(formatCurrency(1000000)).toBe('1.000.000')
    })
    it('rounds before formatting', () => {
        expect(formatCurrency(123.4)).toBe('123')
        expect(formatCurrency(123.5)).toBe('124')
    })
    it('treats non-numbers as 0', () => {
        expect(formatCurrency(null)).toBe('0')
        expect(formatCurrency('abc')).toBe('0')
    })
})
