/**
 * A2 tests: Copy Previous Day / Daily Template.
 *
 * Verifies that source records are copied safely (read-only), only input
 * fields are copied (not results/derived), destination date is preserved,
 * invalid sources are skipped, and recalculation integrates correctly.
 */
import { describe, it, expect } from 'vitest'
import {
    isValidSourceRecord,
    listSourceDates,
    extractInputFields,
    copyRecordInputs,
} from '../src/utils/copy-template.js'
import { createInitialAppData, calculateResults } from '../src/utils/calc.js'

function validSourceRecord(overrides = {}) {
    return {
        paymentMode: 'topup',
        platforms: {
            grab: { topup: 500000, sisa: 135300, kotor: 364700, cash: 0, transfer: 0, komisi: 0, komisiPercent: 20 },
            maxim: { topup: 300000, sisa: 70000, kotor: 230600, cash: 0, transfer: 0, komisi: 0, komisiPercent: 20 },
            gojek: { topup: 0, sisa: 0, kotor: 0, cash: 0, transfer: 0, komisi: 0, komisiPercent: 20 },
            indrive: { topup: 0, sisa: 0, kotor: 0, cash: 0, transfer: 0, komisi: 0, komisiPercent: 15 },
        },
        fuel: { jarak: 286.6, konsumsi: 13.5, harga: 10000, literTerpakai: 21.23, biayaBBM: 212296 },
        additionalCosts: { parkir: 0, makan: 50000, kuota: 0, tol: 200000, lainnya: 0, total: 250000 },
        results: { totalKotor: 595300, biayaBBM: 212296, totalAdditionalCosts: 250000, pendapatanBersih: 133004 },
        timestamp: '2025-01-05T10:00:00.000Z',
        ...overrides,
    }
}

describe('isValidSourceRecord', () => {
    it('returns true for a record with platforms and fuel', () => {
        expect(isValidSourceRecord(validSourceRecord())).toBe(true)
    })
    it('returns true for a record with only platforms', () => {
        expect(isValidSourceRecord({ platforms: {} })).toBe(true)
    })
    it('returns true for a record with only fuel', () => {
        expect(isValidSourceRecord({ fuel: {} })).toBe(true)
    })
    it('returns false for null/undefined/non-object', () => {
        expect(isValidSourceRecord(null)).toBe(false)
        expect(isValidSourceRecord(undefined)).toBe(false)
        expect(isValidSourceRecord(42)).toBe(false)
        expect(isValidSourceRecord('string')).toBe(false)
    })
    it('returns false for a record with only results (no inputs)', () => {
        expect(isValidSourceRecord({ results: {} })).toBe(false)
    })
})

describe('listSourceDates', () => {
    it('returns valid dates sorted descending, excluding the target', () => {
        const stored = {
            '2025-01-01': validSourceRecord(),
            '2025-01-03': validSourceRecord(),
            '2025-01-02': validSourceRecord(),
            _meta: { version: '2.0' },
        }
        expect(listSourceDates(stored, '2025-01-03')).toEqual(['2025-01-02', '2025-01-01'])
    })
    it('excludes invalid records', () => {
        const stored = {
            '2025-01-01': validSourceRecord(),
            '2025-01-02': { results: {} }, // no inputs -> invalid
        }
        expect(listSourceDates(stored)).toEqual(['2025-01-01'])
    })
    it('returns empty array for malformed JSON string', () => {
        expect(listSourceDates('{bad')).toEqual([])
    })
    it('returns empty array when no valid records exist', () => {
        expect(listSourceDates({})).toEqual([])
        expect(listSourceDates(null)).toEqual([])
    })
})

describe('extractInputFields', () => {
    it('extracts platform input fields for all four platforms', () => {
        const extracted = extractInputFields(validSourceRecord())
        expect(extracted.platforms.grab.topup).toBe(500000)
        expect(extracted.platforms.grab.sisa).toBe(135300)
        expect(extracted.platforms.maxim.kotor).toBe(230600)
        expect(extracted.platforms.indrive.komisiPercent).toBe(15)
    })
    it('extracts fuel input fields (NOT derived literTerpakai/biayaBBM)', () => {
        const extracted = extractInputFields(validSourceRecord())
        expect(extracted.fuel.jarak).toBe(286.6)
        expect(extracted.fuel.konsumsi).toBe(13.5)
        expect(extracted.fuel.harga).toBe(10000)
        // Derived fields must NOT be present in the extracted result.
        expect(extracted.fuel.literTerpakai).toBeUndefined()
        expect(extracted.fuel.biayaBBM).toBeUndefined()
    })
    it('extracts additional cost components (NOT derived total)', () => {
        const extracted = extractInputFields(validSourceRecord())
        expect(extracted.additionalCosts.makan).toBe(50000)
        expect(extracted.additionalCosts.tol).toBe(200000)
        expect(extracted.additionalCosts.total).toBeUndefined()
    })
    it('does NOT copy results', () => {
        const extracted = extractInputFields(validSourceRecord())
        expect(extracted.results).toBeUndefined()
    })
    it('does NOT copy timestamp or metadata', () => {
        const extracted = extractInputFields(validSourceRecord())
        expect(extracted.timestamp).toBeUndefined()
    })
    it('preserves paymentMode', () => {
        expect(extractInputFields(validSourceRecord({ paymentMode: 'direct' })).paymentMode).toBe('direct')
        expect(extractInputFields(validSourceRecord({ paymentMode: 'topup' })).paymentMode).toBe('topup')
        // unknown mode defaults to topup
        expect(extractInputFields(validSourceRecord({ paymentMode: 'invalid' })).paymentMode).toBe('topup')
    })
    it('defaults missing platforms to 0 (not undefined)', () => {
        const source = validSourceRecord({ platforms: {} })
        const extracted = extractInputFields(source)
        for (const p of ['grab', 'maxim', 'gojek', 'indrive']) {
            expect(extracted.platforms[p].topup).toBe(0)
            expect(extracted.platforms[p].kotor).toBe(0)
        }
    })
})

describe('copyRecordInputs — data safety', () => {
    it('does NOT mutate the source record', () => {
        const source = validSourceRecord()
        const sourceSnapshot = JSON.parse(JSON.stringify(source))
        const dest = createInitialAppData()
        copyRecordInputs(dest, source)
        expect(source).toEqual(sourceSnapshot)
    })
    it('copies input fields into the destination', () => {
        const dest = createInitialAppData()
        copyRecordInputs(dest, validSourceRecord())
        expect(dest.platforms.grab.topup).toBe(500000)
        expect(dest.fuel.jarak).toBe(286.6)
        expect(dest.fuel.konsumsi).toBe(13.5)
        expect(dest.additionalCosts.makan).toBe(50000)
    })
    it('does NOT copy results into the destination', () => {
        const dest = createInitialAppData()
        // Set a distinct results value to confirm it is NOT overwritten by copy.
        dest.results.totalKotor = 999
        copyRecordInputs(dest, validSourceRecord())
        expect(dest.results.totalKotor).toBe(999) // unchanged by copy
    })
    it('does NOT copy derived fuel fields (literTerpakai, biayaBBM)', () => {
        const dest = createInitialAppData()
        copyRecordInputs(dest, validSourceRecord())
        // Derived fields are NOT set by copy; they're recomputed by calculateResults.
        expect(dest.fuel.literTerpakai).toBe(0) // initial value, not copied
        expect(dest.fuel.biayaBBM).toBe(0) // initial value, not copied
    })
    it('does NOT copy additionalCosts.total (derived)', () => {
        const dest = createInitialAppData()
        copyRecordInputs(dest, validSourceRecord())
        expect(dest.additionalCosts.total).toBe(0) // initial, recomputed later
    })
    it('is a no-op for an invalid source (destination unchanged)', () => {
        const dest = createInitialAppData()
        const destSnapshot = JSON.parse(JSON.stringify(dest))
        copyRecordInputs(dest, null)
        expect(dest).toEqual(destSnapshot)
        copyRecordInputs(dest, { results: {} })
        expect(dest).toEqual(destSnapshot)
    })
    it('throws if destination is not an object', () => {
        expect(() => copyRecordInputs(null, validSourceRecord())).toThrow()
    })
})

describe('copyRecordInputs — recalculation integration', () => {
    it('after copy + calculateResults, results reflect copied inputs', () => {
        const dest = createInitialAppData()
        copyRecordInputs(dest, validSourceRecord())
        calculateResults(dest)
        // totalKotor = sum of platform.kotor from source
        expect(dest.results.totalKotor).toBe(364700 + 230600 + 0 + 0)
        // biayaBBM = round(286.6 / 13.5 * 10000) = 212296
        expect(dest.results.biayaBBM).toBe(212296)
        // totalAdditionalCosts = 50000 + 200000 = 250000
        expect(dest.results.totalAdditionalCosts).toBe(250000)
        // pendapatanBersih = totalKotor - biayaBBM - totalAdditionalCosts
        expect(dest.results.pendapatanBersih).toBe(364700 + 230600 - 212296 - 250000)
    })
    it('after copy, derived fuel fields are recomputed correctly', () => {
        const dest = createInitialAppData()
        copyRecordInputs(dest, validSourceRecord())
        calculateResults(dest)
        expect(dest.fuel.literTerpakai).toBeCloseTo(286.6 / 13.5, 3)
        expect(dest.fuel.biayaBBM).toBeCloseTo((286.6 / 13.5) * 10000, 0)
    })
})
