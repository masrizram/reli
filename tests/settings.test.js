/**
 * A1 tests: Vehicle Profile & Fuel Defaults — persistent settings.
 *
 * Verifies get/save/clear persistence, malformed-settings resilience,
 * and the full A1 precedence chain:
 *   explicit current > profile > history > engine default.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
    SETTINGS_KEY,
    createDefaultProfile,
    getSettings,
    saveSettings,
    clearSettings,
    resolveFuelDefaultWithProfile,
} from '../src/utils/settings.js'

describe('createDefaultProfile', () => {
    it('returns a profile with null fuel values', () => {
        const p = createDefaultProfile()
        expect(p.vehicleFuelEfficiency).toBeNull()
        expect(p.defaultFuelPrice).toBeNull()
    })
})

describe('getSettings — persistence', () => {
    beforeEach(() => localStorage.clear())
    afterEach(() => localStorage.clear())

    it('returns default profile when storage is empty', () => {
        expect(getSettings(localStorage)).toEqual(createDefaultProfile())
    })

    it('reads a saved profile', () => {
        saveSettings(localStorage, { vehicleFuelEfficiency: 13.5, defaultFuelPrice: 10000 })
        const p = getSettings(localStorage)
        expect(p.vehicleFuelEfficiency).toBe(13.5)
        expect(p.defaultFuelPrice).toBe(10000)
    })

    it('falls back to default for malformed JSON', () => {
        localStorage.setItem(SETTINGS_KEY, '{corrupt')
        expect(getSettings(localStorage)).toEqual(createDefaultProfile())
    })

    it('falls back to default for null', () => {
        localStorage.setItem(SETTINGS_KEY, 'null')
        expect(getSettings(localStorage)).toEqual(createDefaultProfile())
    })

    it('normalizes invalid values to null on read', () => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ vehicleFuelEfficiency: 0, defaultFuelPrice: -5 }))
        const p = getSettings(localStorage)
        expect(p.vehicleFuelEfficiency).toBeNull()
        expect(p.defaultFuelPrice).toBeNull()
    })

    it('falls back to default for non-object stored', () => {
        localStorage.setItem(SETTINGS_KEY, '"string"')
        expect(getSettings(localStorage)).toEqual(createDefaultProfile())
    })
})

describe('saveSettings — normalization', () => {
    beforeEach(() => localStorage.clear())
    afterEach(() => localStorage.clear())

    it('persists valid values', () => {
        saveSettings(localStorage, { vehicleFuelEfficiency: 13.5, defaultFuelPrice: 10000 })
        expect(localStorage.getItem(SETTINGS_KEY)).toContain('13.5')
        expect(localStorage.getItem(SETTINGS_KEY)).toContain('10000')
    })

    it('stores invalid values as null', () => {
        saveSettings(localStorage, { vehicleFuelEfficiency: 0, defaultFuelPrice: NaN })
        const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY))
        expect(stored.vehicleFuelEfficiency).toBeNull()
        expect(stored.defaultFuelPrice).toBeNull()
    })

    it('handles null/undefined profile gracefully', () => {
        saveSettings(localStorage, null)
        saveSettings(localStorage, undefined)
        const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY))
        expect(stored.vehicleFuelEfficiency).toBeNull()
        expect(stored.defaultFuelPrice).toBeNull()
    })

    it('returns true on success', () => {
        expect(saveSettings(localStorage, { vehicleFuelEfficiency: 15 })).toBe(true)
    })
})

describe('clearSettings', () => {
    beforeEach(() => localStorage.clear())
    afterEach(() => localStorage.clear())

    it('removes the settings key', () => {
        saveSettings(localStorage, { vehicleFuelEfficiency: 13.5 })
        clearSettings(localStorage)
        expect(localStorage.getItem(SETTINGS_KEY)).toBeNull()
    })

    it('returns true even if key did not exist', () => {
        expect(clearSettings(localStorage)).toBe(true)
    })
})

describe('resolveFuelDefaultWithProfile — precedence chain', () => {
    const historyWithKonsumsi = { '2025-01-01': { fuel: { konsumsi: 11, harga: 9000 } } }

    it('1. explicit current value wins over profile, history, default', () => {
        expect(
            resolveFuelDefaultWithProfile({
                stored: historyWithKonsumsi,
                field: 'konsumsi',
                currentValue: 12,
                profileValue: 10,
                engineDefault: 14,
            })
        ).toBe(12)
    })

    it('2. profile wins over history and default (when current invalid)', () => {
        expect(
            resolveFuelDefaultWithProfile({
                stored: historyWithKonsumsi,
                field: 'konsumsi',
                currentValue: 0, // invalid
                profileValue: 10,
                engineDefault: 14,
            })
        ).toBe(10)
    })

    it('3. history wins over default (when current and profile invalid)', () => {
        expect(
            resolveFuelDefaultWithProfile({
                stored: historyWithKonsumsi,
                field: 'konsumsi',
                currentValue: 0,
                profileValue: null,
                engineDefault: 14,
            })
        ).toBe(11)
    })

    it('4. engine default is the final fallback', () => {
        expect(
            resolveFuelDefaultWithProfile({
                stored: {},
                field: 'konsumsi',
                currentValue: 0,
                profileValue: null,
                engineDefault: 14,
            })
        ).toBe(14)
    })

    it('invalid profile (zero) falls through to history', () => {
        expect(
            resolveFuelDefaultWithProfile({
                stored: historyWithKonsumsi,
                field: 'konsumsi',
                currentValue: 0,
                profileValue: 0, // invalid -> skip
                engineDefault: 14,
            })
        ).toBe(11) // history
    })

    it('invalid profile (NaN) falls through to history', () => {
        expect(
            resolveFuelDefaultWithProfile({
                stored: historyWithKonsumsi,
                field: 'konsumsi',
                currentValue: 0,
                profileValue: NaN,
                engineDefault: 14,
            })
        ).toBe(11)
    })

    it('invalid profile (negative) falls through to history', () => {
        expect(
            resolveFuelDefaultWithProfile({
                stored: historyWithKonsumsi,
                field: 'konsumsi',
                currentValue: 0,
                profileValue: -3,
                engineDefault: 14,
            })
        ).toBe(11)
    })

    it('invalid profile + invalid history -> engine default', () => {
        const badHistory = { '2025-01-01': { fuel: { konsumsi: 0 } } }
        expect(
            resolveFuelDefaultWithProfile({
                stored: badHistory,
                field: 'konsumsi',
                currentValue: 0,
                profileValue: null,
                engineDefault: 14,
            })
        ).toBe(14)
    })

    it('current value = NaN is treated as invalid (falls to profile)', () => {
        expect(
            resolveFuelDefaultWithProfile({
                stored: {},
                field: 'konsumsi',
                currentValue: NaN,
                profileValue: 13.5,
                engineDefault: 14,
            })
        ).toBe(13.5)
    })

    it('current value = negative is treated as invalid (falls to profile)', () => {
        expect(
            resolveFuelDefaultWithProfile({
                stored: {},
                field: 'konsumsi',
                currentValue: -5,
                profileValue: 13.5,
                engineDefault: 14,
            })
        ).toBe(13.5)
    })

    it('works for the harga field too', () => {
        expect(
            resolveFuelDefaultWithProfile({
                stored: historyWithKonsumsi,
                field: 'harga',
                currentValue: 0,
                profileValue: 12000,
                engineDefault: 10000,
            })
        ).toBe(12000)
    })

    it('returns a finite number in all cases', () => {
        const cases = [
            { stored: {}, currentValue: 0, profileValue: null, engineDefault: 14 },
            { stored: historyWithKonsumsi, currentValue: 0, profileValue: null, engineDefault: 14 },
            { stored: {}, currentValue: 12, profileValue: 10, engineDefault: 14 },
        ]
        for (const c of cases) {
            const r = resolveFuelDefaultWithProfile({ ...c, field: 'konsumsi' })
            expect(Number.isFinite(r)).toBe(true)
        }
    })
})
