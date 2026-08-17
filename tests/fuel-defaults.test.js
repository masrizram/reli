/**
 * D1 tests: auto-fill fuel from the most recent valid record.
 *
 * resolveFuelDefault precedence:
 *   1. explicit current value (finite >0) wins
 *   2. most recent valid record value (finite >0) inherits
 *   3. engine default fallback
 *
 * "Valid" = finite numeric value > 0 in a record's fuel object.
 */
import { describe, it, expect } from 'vitest'
import { resolveFuelDefault, findLatestFuelValue } from '../src/utils/records.js'

describe('findLatestFuelValue', () => {
    it('returns the value from the newest dated record', () => {
        const stored = {
            '2025-01-01': { fuel: { konsumsi: 13 } },
            '2025-01-03': { fuel: { konsumsi: 15 } },
            '2025-01-02': { fuel: { konsumsi: 14 } },
        }
        expect(findLatestFuelValue(stored, 'konsumsi')).toBe(15)
    })

    it('skips records missing the fuel object', () => {
        const stored = {
            '2025-01-01': { results: {} }, // no fuel
            '2025-01-02': { fuel: { konsumsi: 14 } },
        }
        expect(findLatestFuelValue(stored, 'konsumsi')).toBe(14)
    })

    it('skips zero/negative values', () => {
        const stored = {
            '2025-01-02': { fuel: { konsumsi: 0 } }, // ignored
            '2025-01-01': { fuel: { konsumsi: 14 } },
        }
        // 01-02 is newest but konsumsi=0 is invalid; falls back to 01-01.
        expect(findLatestFuelValue(stored, 'konsumsi')).toBe(14)
    })

    it('skips non-finite values (NaN, Infinity)', () => {
        const stored = {
            '2025-01-02': { fuel: { konsumsi: NaN } },
            '2025-01-01': { fuel: { konsumsi: 14 } },
        }
        expect(findLatestFuelValue(stored, 'konsumsi')).toBe(14)
    })

    it('coerces numeric strings to numbers', () => {
        const stored = { '2025-01-01': { fuel: { konsumsi: '13.5' } } }
        expect(findLatestFuelValue(stored, 'konsumsi')).toBe(13.5)
    })

    it('returns null when no valid record exists', () => {
        expect(findLatestFuelValue({}, 'konsumsi')).toBeNull()
        expect(findLatestFuelValue(null, 'konsumsi')).toBeNull()
        expect(findLatestFuelValue(undefined, 'konsumsi')).toBeNull()
    })

    it('returns null for malformed JSON string', () => {
        expect(findLatestFuelValue('{bad', 'konsumsi')).toBeNull()
    })

    it('ignores non-date keys (e.g. _meta)', () => {
        const stored = {
            _meta: { fuel: { konsumsi: 99 } }, // not a date key
            '2025-01-01': { fuel: { konsumsi: 14 } },
        }
        expect(findLatestFuelValue(stored, 'konsumsi')).toBe(14)
    })

    it('works for the harga field', () => {
        const stored = {
            '2025-01-01': { fuel: { harga: 10000 } },
            '2025-01-02': { fuel: { harga: 12000 } },
        }
        expect(findLatestFuelValue(stored, 'harga')).toBe(12000)
    })
})

describe('resolveFuelDefault — precedence chain', () => {
    const storedWithHistory = {
        '2025-01-01': { fuel: { konsumsi: 13.5, harga: 10000 } },
    }

    it('explicit current value wins over history and engine default', () => {
        expect(
            resolveFuelDefault({
                stored: storedWithHistory,
                field: 'konsumsi',
                currentValue: 12,
                engineDefault: 14,
            })
        ).toBe(12)
    })

    it('inherits from history when current value is not a finite >0 number', () => {
        expect(
            resolveFuelDefault({
                stored: storedWithHistory,
                field: 'konsumsi',
                currentValue: 0, // not >0
                engineDefault: 14,
            })
        ).toBe(13.5)
    })

    it('inherits from history when current value is null/undefined', () => {
        expect(
            resolveFuelDefault({
                stored: storedWithHistory,
                field: 'konsumsi',
                currentValue: null,
                engineDefault: 14,
            })
        ).toBe(13.5)
        expect(
            resolveFuelDefault({
                stored: storedWithHistory,
                field: 'konsumsi',
                currentValue: undefined,
                engineDefault: 14,
            })
        ).toBe(13.5)
    })

    it('inherits from history when current value is NaN', () => {
        expect(
            resolveFuelDefault({
                stored: storedWithHistory,
                field: 'konsumsi',
                currentValue: NaN,
                engineDefault: 14,
            })
        ).toBe(13.5)
    })

    it('falls back to engine default when no history exists', () => {
        expect(
            resolveFuelDefault({
                stored: {},
                field: 'konsumsi',
                currentValue: 0,
                engineDefault: 14,
            })
        ).toBe(14)
    })

    it('falls back to engine default when history has no valid value', () => {
        const stored = { '2025-01-01': { fuel: { konsumsi: 0 } } }
        expect(
            resolveFuelDefault({
                stored,
                field: 'konsumsi',
                currentValue: 0,
                engineDefault: 14,
            })
        ).toBe(14)
    })

    it('does not modify the stored data', () => {
        const stored = { '2025-01-01': { fuel: { konsumsi: 13.5 } } }
        const before = JSON.stringify(stored)
        resolveFuelDefault({ stored, field: 'konsumsi', currentValue: 0, engineDefault: 14 })
        expect(JSON.stringify(stored)).toBe(before)
    })

    it('returns a finite number in all cases', () => {
        const cases = [
            { stored: {}, currentValue: 12, engineDefault: 14 },
            { stored: storedWithHistory, currentValue: 0, engineDefault: 14 },
            { stored: null, currentValue: null, engineDefault: 14 },
        ]
        for (const c of cases) {
            const r = resolveFuelDefault({ ...c, field: 'konsumsi' })
            expect(Number.isFinite(r)).toBe(true)
        }
    })
})
