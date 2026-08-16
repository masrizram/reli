/**
 * F-05 regression: payment-mode transition matrix.
 *
 * Invariant: TOPUP mode must never retain stale DIRECT-mode commission state,
 * and the four canonical transitions must keep commission, gross income
 * (kotor), total gross income (totalKotor), and net income (pendapatanBersih)
 * consistent.
 *
 * Transitions exercised: DIRECT->TOPUP, TOPUP->DIRECT, DIRECT->DIRECT,
 * TOPUP->TOPUP.
 */
import { describe, it, expect } from 'vitest'
import { createInitialAppData, calculateResults } from '../src/utils/calc.js'

function snapshot(data, platform) {
    const p = data.platforms[platform]
    return {
        paymentMode: data.paymentMode,
        komisi: p.komisi,
        kotor: p.kotor,
        totalKotor: data.results.totalKotor,
        biayaBBM: data.results.biayaBBM,
        totalAdditionalCosts: data.results.totalAdditionalCosts,
        pendapatanBersih: data.results.pendapatanBersih,
    }
}

describe('F-05: payment-mode transition consistency', () => {
    it('DIRECT -> TOPUP clears stale commission (kotor overridden by topup-sisa)', () => {
        const data = createInitialAppData()
        data.paymentMode = 'direct'
        data.platforms.grab.cash = 200000
        data.platforms.grab.transfer = 100000
        data.platforms.grab.komisiPercent = 20
        calculateResults(data)
        expect(data.platforms.grab.komisi).toBeCloseTo(60000, 2)
        expect(data.results.totalKotor).toBeCloseTo(240000, 2)

        // Transition to topup mode.
        data.paymentMode = 'topup'
        data.platforms.grab.topup = 500000
        data.platforms.grab.sisa = 135300
        data.platforms.grab.kotor = 0
        data.platforms.grab.cash = 0
        data.platforms.grab.transfer = 0
        calculateResults(data)

        const snap = snapshot(data, 'grab')
        expect(snap.komisi).toBe(0) // stale direct komisi cleared
        expect(snap.kotor).toBe(364700)
        expect(snap.totalKotor).toBe(364700)
        expect(snap.pendapatanBersih).toBe(snap.totalKotor - snap.biayaBBM - snap.totalAdditionalCosts)
    })

    it('DIRECT -> TOPUP clears stale commission even when direct kotor is kept', () => {
        const data = createInitialAppData()
        data.paymentMode = 'direct'
        data.platforms.grab.cash = 300000
        data.platforms.grab.transfer = 200000
        data.platforms.grab.komisiPercent = 20
        calculateResults(data)
        expect(data.platforms.grab.komisi).toBeCloseTo(100000, 2)

        // Switch to topup but keep a direct kotor value present (the F-05
        // edge case). komisi must still be reset to 0.
        data.paymentMode = 'topup'
        data.platforms.grab.kotor = 400000 // direct kotor wins
        calculateResults(data)
        expect(data.platforms.grab.komisi).toBe(0)
        expect(data.platforms.grab.kotor).toBe(400000)
        expect(data.results.totalKotor).toBe(400000)
    })

    it('TOPUP -> DIRECT recomputes commission from cash/transfer', () => {
        const data = createInitialAppData()
        data.paymentMode = 'topup'
        data.platforms.grab.topup = 500000
        data.platforms.grab.sisa = 135300
        calculateResults(data)
        expect(data.platforms.grab.komisi).toBe(0)
        expect(data.results.totalKotor).toBe(364700)

        // Transition to direct mode.
        data.paymentMode = 'direct'
        data.platforms.grab.cash = 200000
        data.platforms.grab.transfer = 255875
        data.platforms.grab.komisiPercent = 15
        data.platforms.grab.kotor = 0
        data.platforms.grab.topup = 0
        data.platforms.grab.sisa = 0
        calculateResults(data)

        const totalBefore = 200000 + 255875
        const expectedKomisi = (totalBefore * 15) / 100
        expect(data.platforms.grab.komisi).toBeCloseTo(expectedKomisi, 2)
        expect(data.platforms.grab.kotor).toBeCloseTo(totalBefore - expectedKomisi, 2)
        expect(data.results.totalKotor).toBeCloseTo(totalBefore - expectedKomisi, 2)
        expect(data.results.pendapatanBersih).toBe(
            data.results.totalKotor - data.results.biayaBBM - data.results.totalAdditionalCosts
        )
    })

    it('DIRECT -> DIRECT stays consistent (idempotent)', () => {
        const data = createInitialAppData()
        data.paymentMode = 'direct'
        data.platforms.grab.cash = 200000
        data.platforms.grab.transfer = 100000
        data.platforms.grab.komisiPercent = 20
        calculateResults(data)
        const snap1 = snapshot(data, 'grab')

        // Re-run without changing inputs.
        calculateResults(data)
        const snap2 = snapshot(data, 'grab')
        expect(snap2).toEqual(snap1)
    })

    it('TOPUP -> TOPUP stays consistent (idempotent)', () => {
        const data = createInitialAppData()
        data.paymentMode = 'topup'
        data.platforms.grab.topup = 500000
        data.platforms.grab.sisa = 135300
        calculateResults(data)
        const snap1 = snapshot(data, 'grab')

        calculateResults(data)
        const snap2 = snapshot(data, 'grab')
        expect(snap2).toEqual(snap1)
    })

    it('rapid mode switching DIRECT->TOPUP->DIRECT->TOPUP never leaves stale komisi', () => {
        const data = createInitialAppData()
        data.fuel.jarak = 0 // isolate commission logic from fuel rounding

        // DIRECT
        data.paymentMode = 'direct'
        data.platforms.grab.cash = 300000
        data.platforms.grab.transfer = 200000
        data.platforms.grab.komisiPercent = 20
        calculateResults(data)
        expect(data.platforms.grab.komisi).toBeCloseTo(100000, 2)

        // -> TOPUP
        data.paymentMode = 'topup'
        data.platforms.grab.topup = 500000
        data.platforms.grab.sisa = 100000
        data.platforms.grab.kotor = 0
        calculateResults(data)
        expect(data.platforms.grab.komisi).toBe(0)
        expect(data.platforms.grab.kotor).toBe(400000)

        // -> DIRECT again
        data.paymentMode = 'direct'
        data.platforms.grab.cash = 100000
        data.platforms.grab.transfer = 100000
        data.platforms.grab.komisiPercent = 10
        data.platforms.grab.kotor = 0
        calculateResults(data)
        expect(data.platforms.grab.komisi).toBeCloseTo(20000, 2)
        expect(data.platforms.grab.kotor).toBeCloseTo(180000, 2)

        // -> TOPUP again: komisi MUST reset to 0
        data.paymentMode = 'topup'
        data.platforms.grab.topup = 200000
        data.platforms.grab.sisa = 50000
        data.platforms.grab.kotor = 0
        calculateResults(data)
        expect(data.platforms.grab.komisi).toBe(0)
        expect(data.platforms.grab.kotor).toBe(150000)
        expect(data.results.totalKotor).toBe(150000)
    })

    it('commission is never included in totalKotor in TOPUP mode', () => {
        // totalKotor = sum of platform.kotor. In topup mode komisi must not
        // subtract from totalKotor even if a stale komisi value lingers in
        // the raw platform object before recompute.
        const data = createInitialAppData()
        data.paymentMode = 'topup'
        data.platforms.grab.topup = 500000
        data.platforms.grab.sisa = 135300
        data.platforms.grab.kotor = 0
        data.platforms.grab.komisi = 999999 // stale value that must be ignored
        calculateResults(data)
        expect(data.platforms.grab.komisi).toBe(0)
        expect(data.results.totalKotor).toBe(364700)
    })
})
