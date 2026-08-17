/**
 * G2 tests: Input Validation Warnings — pure, non-blocking validation.
 *
 * Verifies that valid input produces no warnings, suspicious values produce
 * appropriate warnings, warnings never alter calculations, and multiple
 * warnings can coexist. The calculation engine (calc.js) is never modified.
 */
import { describe, it, expect } from 'vitest'
import { validateInputs } from '../src/utils/validation.js'
import { createInitialAppData, recomputePlatform, calculateResults } from '../src/utils/calc.js'

describe('validateInputs — valid input produces no warnings', () => {
    it('returns no warnings for default appData', () => {
        const data = createInitialAppData()
        // Default has konsumsi=14, harga=10000, jarak=0 -> no fuel warnings
        // (jarak=0 means fuel calc is skipped, not suspicious)
        const warnings = validateInputs(data)
        // No negative values, no anomalies
        const fuelWarnings = warnings.filter(w => w.field === 'fuel')
        const costWarnings = warnings.filter(w => w.field === 'costs')
        const platformWarnings = warnings.filter(w => w.field === 'platforms')
        expect(fuelWarnings.length).toBe(0)
        expect(costWarnings.length).toBe(0)
        expect(platformWarnings.length).toBe(0)
    })

    it('returns no warnings for a valid full record', () => {
        const data = createInitialAppData()
        data.platforms.grab.topup = 500000
        data.platforms.grab.sisa = 135300
        data.fuel.jarak = 120
        data.fuel.konsumsi = 15
        data.fuel.harga = 10000
        data.additionalCosts.makan = 25000
        const warnings = validateInputs(data)
        // No negative values, konsumsi >0, expense ratio low
        const hardWarnings = warnings.filter(w => w.severity === 'warning')
        expect(hardWarnings.length).toBe(0)
    })
})

describe('validateInputs — negative values produce warnings', () => {
    it('warns on negative konsumsi', () => {
        const data = createInitialAppData()
        data.fuel.jarak = 120
        data.fuel.konsumsi = -5
        const warnings = validateInputs(data)
        expect(warnings.some(w => w.id === 'fuel-negative-konsumsi')).toBe(true)
    })

    it('warns on negative harga', () => {
        const data = createInitialAppData()
        data.fuel.harga = -1000
        const warnings = validateInputs(data)
        expect(warnings.some(w => w.id === 'fuel-negative-harga')).toBe(true)
    })

    it('warns on negative jarak', () => {
        const data = createInitialAppData()
        data.fuel.jarak = -50
        const warnings = validateInputs(data)
        expect(warnings.some(w => w.id === 'fuel-negative-jarak')).toBe(true)
    })

    it('warns on negative kotor (sisa > topup)', () => {
        const data = createInitialAppData()
        data.platforms.grab.topup = 100000
        data.platforms.grab.sisa = 150000
        data.platforms.grab.kotor = 0 // force re-derive
        recomputePlatform(data.platforms.grab, data.paymentMode)
        // kotor is now -50000
        const warnings = validateInputs(data)
        expect(warnings.some(w => w.id === 'platform-negative-kotor-grab')).toBe(true)
    })

    it('warns on negative additional cost', () => {
        const data = createInitialAppData()
        data.additionalCosts.parkir = -5000
        const warnings = validateInputs(data)
        expect(warnings.some(w => w.id === 'cost-negative-parkir')).toBe(true)
    })

    it('warns on komisiPercent > 100 in direct mode', () => {
        const data = createInitialAppData()
        data.paymentMode = 'direct'
        data.platforms.grab.komisiPercent = 150
        const warnings = validateInputs(data)
        expect(warnings.some(w => w.id === 'platform-invalid-komisi-percent-grab')).toBe(true)
    })

    it('warns on komisiPercent < 0 in direct mode', () => {
        const data = createInitialAppData()
        data.paymentMode = 'direct'
        data.platforms.maxim.komisiPercent = -10
        const warnings = validateInputs(data)
        expect(warnings.some(w => w.id === 'platform-invalid-komisi-percent-maxim')).toBe(true)
    })
})

describe('validateInputs — zero values where suspicious', () => {
    it('warns when jarak > 0 but konsumsi is 0', () => {
        const data = createInitialAppData()
        data.fuel.jarak = 120
        data.fuel.konsumsi = 0
        const warnings = validateInputs(data)
        expect(warnings.some(w => w.id === 'fuel-zero-konsumsi')).toBe(true)
    })

    it('does NOT warn when jarak is 0 and konsumsi is 0 (no trip)', () => {
        const data = createInitialAppData()
        data.fuel.jarak = 0
        data.fuel.konsumsi = 0
        const warnings = validateInputs(data)
        expect(warnings.some(w => w.id === 'fuel-zero-konsumsi')).toBe(false)
    })
})

describe('validateInputs — expense ratio anomaly', () => {
    it('warns when expenses > 60% of totalKotor', () => {
        const data = createInitialAppData()
        data.platforms.grab.kotor = 100000
        data.fuel.jarak = 100
        data.fuel.konsumsi = 10
        data.fuel.harga = 10000 // biayaBBM = 100000
        data.additionalCosts.makan = 50000 // totalCosts = 50000
        calculateResults(data)
        // totalKotor=100000, expenses=150000, ratio=1.5 > 0.6
        const warnings = validateInputs(data)
        expect(warnings.some(w => w.id === 'expense-ratio-high')).toBe(true)
    })

    it('does NOT warn when expense ratio is normal', () => {
        const data = createInitialAppData()
        data.platforms.grab.kotor = 500000
        data.fuel.jarak = 120
        data.fuel.konsumsi = 15
        data.fuel.harga = 10000 // biayaBBM = 80000
        data.additionalCosts.makan = 20000 // totalCosts = 20000
        // ratio = 100000/500000 = 0.2 < 0.6
        const warnings = validateInputs(data)
        expect(warnings.some(w => w.id === 'expense-ratio-high')).toBe(false)
    })
})

describe('validateInputs — non-blocking behavior', () => {
    it('does not modify appData', () => {
        const data = createInitialAppData()
        data.fuel.konsumsi = -5
        const before = JSON.stringify(data)
        validateInputs(data)
        expect(JSON.stringify(data)).toBe(before)
    })

    it('multiple warnings can coexist', () => {
        const data = createInitialAppData()
        data.fuel.konsumsi = -5
        data.fuel.harga = -100
        data.additionalCosts.parkir = -1000
        const warnings = validateInputs(data)
        expect(warnings.length).toBeGreaterThanOrEqual(3)
    })

    it('handles null/undefined appData safely', () => {
        expect(validateInputs(null)).toEqual([])
        expect(validateInputs(undefined)).toEqual([])
        expect(validateInputs('string')).toEqual([])
    })

    it('handles missing nested objects safely', () => {
        expect(validateInputs({})).toEqual([])
        expect(validateInputs({ fuel: null })).toEqual([])
    })
})
