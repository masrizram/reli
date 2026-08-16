/**
 * Additional critical-path tests for the RELI calculation engine.
 *
 * These exercise boundary conditions, mode-switching consistency, and
 * behaviors that previous tests did not assert and could silently regress.
 */
import { describe, it, expect } from 'vitest'
import {
    createInitialAppData,
    calculateResults,
    recomputePlatform,
    recomputeFuel,
    toNumber,
    PLATFORMS,
} from '../src/utils/calc.js'

describe('recomputePlatform — mode-switching consistency', () => {
    it('clears stale komisi when switching to topup mode WITHOUT direct kotor', () => {
        // Simulate a platform that previously had a komisi computed in direct mode.
        const p = { topup: 500000, sisa: 135300, kotor: 0, komisi: 68231, komisiPercent: 20 }
        recomputePlatform(p, 'topup')
        expect(p.kotor).toBe(364700)
        expect(p.komisi).toBe(0)
    })

    it('keeps komisi at 0 in topup mode even when direct kotor is provided', () => {
        // Fixed behavior (F-05): TOPUP mode never retains a DIRECT-mode
        // commission value. Even when the user enters a direct kotor, komisi
        // must be reset to 0 so a stale value cannot leak into totals or UI.
        const p = { topup: 500000, sisa: 135300, kotor: 400000, komisi: 68231, komisiPercent: 20 }
        recomputePlatform(p, 'topup')
        expect(p.kotor).toBe(400000)
        expect(p.komisi).toBe(0)
    })

    it('does not let a stale komisi from direct mode leak into topup totals', () => {
        const data = createInitialAppData()
        data.paymentMode = 'direct'
        data.platforms.grab.cash = 200000
        data.platforms.grab.transfer = 100000
        data.platforms.grab.komisiPercent = 20
        calculateResults(data)
        const komisiDirect = data.platforms.grab.komisi
        expect(komisiDirect).toBeCloseTo(60000, 2)

        // Now switch to topup mode and re-run; komisi should no longer be
        // included in any derived figure.
        data.paymentMode = 'topup'
        data.platforms.grab.topup = 500000
        data.platforms.grab.sisa = 135300
        data.platforms.grab.kotor = 0 // force re-derive from topup-sisa
        calculateResults(data)
        expect(data.platforms.grab.komisi).toBe(0)
        expect(data.platforms.grab.kotor).toBe(364700)
        expect(data.results.totalKotor).toBe(364700)
    })
})

describe('recomputePlatform — negative / boundary inputs', () => {
    it('produces negative kotor when sisa exceeds topup', () => {
        const p = { topup: 100000, sisa: 150000, kotor: 0, komisi: 0, komisiPercent: 20 }
        recomputePlatform(p, 'topup')
        expect(p.kotor).toBe(-50000)
    })

    it('direct mode clamps komisi to 0 when direct kotor exceeds cash+transfer', () => {
        const p = { cash: 100, transfer: 50, komisiPercent: 20, komisi: 999, kotor: 200 }
        recomputePlatform(p, 'direct')
        expect(p.kotor).toBe(200)
        expect(p.komisi).toBe(0) // max(0, 150 - 200) === 0
    })

    it('treats komisiPercent of 100 as full commission', () => {
        const p = { cash: 300, transfer: 200, komisiPercent: 100, komisi: 0, kotor: 0 }
        recomputePlatform(p, 'direct')
        expect(p.komisi).toBe(500)
        expect(p.kotor).toBe(0)
    })

    it('ignores non-numeric komisiPercent', () => {
        const p = { cash: 300, transfer: 200, komisiPercent: 'abc', komisi: 0, kotor: 0 }
        recomputePlatform(p, 'direct')
        expect(p.komisi).toBe(0)
        expect(p.kotor).toBe(500)
    })
})

describe('recomputeFuel — boundary inputs', () => {
    it('returns zeros for negative jarak (treated as >0 path? no: jarak>0 guard)', () => {
        const fuel = { jarak: -100, konsumsi: 15, harga: 10000, literTerpakai: 5, biayaBBM: 5 }
        recomputeFuel(fuel)
        expect(fuel.literTerpakai).toBe(0)
        expect(fuel.biayaBBM).toBe(0)
    })

    it('handles very large harga without precision loss in rounding', () => {
        const fuel = { jarak: 100, konsumsi: 10, harga: 18500, literTerpakai: 0, biayaBBM: 0 }
        recomputeFuel(fuel)
        expect(fuel.literTerpakai).toBeCloseTo(10, 5)
        expect(fuel.biayaBBM).toBeCloseTo(185000, 1)
    })
})

describe('calculateResults — aggregate correctness', () => {
    it('sums kotor across all four platforms in topup mode', () => {
        const data = createInitialAppData()
        data.paymentMode = 'topup'
        data.platforms.grab.topup = 500000
        data.platforms.grab.sisa = 100000
        data.platforms.maxim.topup = 300000
        data.platforms.maxim.sisa = 50000
        data.platforms.gojek.topup = 200000
        data.platforms.gojek.sisa = 0
        data.platforms.indrive.topup = 150000
        data.platforms.indrive.sisa = 75000
        calculateResults(data)
        expect(data.results.totalKotor).toBe(500000 - 100000 + (300000 - 50000) + (200000 - 0) + (150000 - 75000))
    })

    it('rounds biayaBBM to integer rupiah in results', () => {
        const data = createInitialAppData()
        data.fuel.jarak = 286.6
        data.fuel.konsumsi = 13.5
        data.fuel.harga = 10000
        calculateResults(data)
        // 286.6/13.5 * 10000 = 212296.296...
        expect(data.results.biayaBBM).toBe(212296)
        expect(Number.isInteger(data.results.biayaBBM)).toBe(true)
    })

    it('pendapatanBersih can go negative when costs exceed earnings', () => {
        const data = createInitialAppData()
        data.platforms.grab.kotor = 100000
        data.fuel.jarak = 200
        data.fuel.konsumsi = 10
        data.fuel.harga = 10000 // biayaBBM = 200000
        data.additionalCosts.makan = 100000
        calculateResults(data)
        expect(data.results.totalKotor).toBe(100000)
        expect(data.results.biayaBBM).toBe(200000)
        expect(data.results.totalAdditionalCosts).toBe(100000)
        expect(data.results.pendapatanBersih).toBe(-200000)
    })

    it('ignores an unknown platform key not in PLATFORMS', () => {
        const data = createInitialAppData()
        data.platforms.unknown = { topup: 999999, sisa: 0, kotor: 999999 }
        calculateResults(data)
        expect(data.results.totalKotor).toBe(0)
    })

    it('is idempotent — calling twice yields identical results', () => {
        const data = createInitialAppData()
        data.paymentMode = 'direct'
        data.platforms.grab.cash = 200000
        data.platforms.grab.transfer = 100000
        data.platforms.grab.komisiPercent = 20
        data.fuel.jarak = 120
        data.fuel.konsumsi = 15
        data.fuel.harga = 10000
        data.additionalCosts.parkir = 15000
        calculateResults(data)
        const r1 = { ...data.results }
        calculateResults(data)
        expect(data.results).toEqual(r1)
    })
})

describe('toNumber — defensive coercion (documented behavior)', () => {
    it('coerces numeric strings with whitespace', () => {
        expect(toNumber('  42  ')).toBe(42)
    })
    it('returns 0 for plain objects', () => {
        expect(toNumber({})).toBe(0)
        expect(toNumber({ valueOf: () => 5 })).toBe(0)
    })
    // F-08 hardening: arrays are no longer silently coerced via string
    // conversion. parseFloat([1,2]) used to yield 1; now rejected as 0.
    it('returns 0 for arrays (hardened, no silent coercion)', () => {
        expect(toNumber([1, 2])).toBe(0)
        expect(toNumber([42])).toBe(0)
    })
    it('returns 0 for an empty array', () => {
        expect(toNumber([])).toBe(0)
    })
    it('returns 0 for functions', () => {
        expect(toNumber(() => 5)).toBe(0)
    })
    it('returns 0 for booleans', () => {
        expect(toNumber(true)).toBe(0)
        expect(toNumber(false)).toBe(0)
    })
    it('returns 0 for malformed numeric strings with trailing garbage', () => {
        expect(toNumber('12abc')).toBe(0)
        expect(toNumber('1.2.3')).toBe(0)
    })
    it('accepts scientific notation strings', () => {
        expect(toNumber('1e3')).toBe(1000)
        expect(toNumber('1.5e-2')).toBeCloseTo(0.015, 5)
    })
})
