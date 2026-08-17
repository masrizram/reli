/**
 * G1 tests: first-launch onboarding detection.
 *
 * Verifies that hasSavedRecords / countValidRecords correctly detect the
 * presence of valid daily records so the dashboard can show an onboarding
 * empty state instead of misleading zero statistics.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { hasSavedRecords, countValidRecords } from '../src/utils/records.js'

describe('countValidRecords', () => {
    it('returns 0 for null/undefined/empty', () => {
        expect(countValidRecords(null)).toBe(0)
        expect(countValidRecords(undefined)).toBe(0)
        expect(countValidRecords({})).toBe(0)
    })

    it('returns 0 for malformed JSON string', () => {
        expect(countValidRecords('{not json')).toBe(0)
    })

    it('counts records that have a results object', () => {
        const data = {
            '2025-01-01': { results: { pendapatanBersih: 100 } },
            '2025-01-02': { results: { pendapatanBersih: 200 } },
        }
        expect(countValidRecords(data)).toBe(2)
    })

    it('skips entries without a results object', () => {
        const data = {
            '2025-01-01': { results: { pendapatanBersih: 100 } },
            '2025-01-02': {}, // no results
            '2025-01-03': null, // null entry
        }
        expect(countValidRecords(data)).toBe(1)
    })

    it('skips the legacy _meta key', () => {
        const data = {
            _meta: { version: '2.0' },
            '2025-01-01': { results: { pendapatanBersih: 100 } },
        }
        expect(countValidRecords(data)).toBe(1)
    })

    it('accepts a raw JSON string and parses it', () => {
        const json = JSON.stringify({ '2025-01-01': { results: { pendapatanBersih: 100 } } })
        expect(countValidRecords(json)).toBe(1)
    })

    it('treats a results value that is not an object as invalid', () => {
        const data = {
            '2025-01-01': { results: 'not-an-object' },
        }
        expect(countValidRecords(data)).toBe(0)
    })

    it('does not throw on a non-object input', () => {
        expect(() => countValidRecords(42)).not.toThrow()
        expect(countValidRecords(42)).toBe(0)
    })
})

describe('hasSavedRecords — localStorage integration', () => {
    beforeEach(() => localStorage.clear())
    afterEach(() => localStorage.clear())

    it('returns false when storage is empty (first launch)', () => {
        expect(hasSavedRecords(localStorage)).toBe(false)
    })

    it('returns false when reli-data key is absent', () => {
        localStorage.setItem('other-key', 'whatever')
        expect(hasSavedRecords(localStorage)).toBe(false)
    })

    it('returns true when at least one valid record exists', () => {
        const data = { '2025-01-01': { results: { pendapatanBersih: 100 } } }
        localStorage.setItem('reli-data', JSON.stringify(data))
        expect(hasSavedRecords(localStorage)).toBe(true)
    })

    it('returns false when only malformed data exists', () => {
        localStorage.setItem('reli-data', '{corrupt')
        expect(hasSavedRecords(localStorage)).toBe(false)
    })

    it('returns false when records exist but none have a results object', () => {
        const data = { '2025-01-01': { platforms: {} } }
        localStorage.setItem('reli-data', JSON.stringify(data))
        expect(hasSavedRecords(localStorage)).toBe(false)
    })

    it('returns false when only _meta is present', () => {
        const data = { _meta: { version: '2.0' } }
        localStorage.setItem('reli-data', JSON.stringify(data))
        expect(hasSavedRecords(localStorage)).toBe(false)
    })
})
