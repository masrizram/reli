/**
 * A1: Vehicle Profile & Fuel Defaults — persistent user-configurable profile.
 *
 * Extends D1's history-based fuel defaults with a persistent user profile
 * stored in localStorage under `reli-settings`. The profile holds vehicle
 * fuel efficiency (konsumsi) and default fuel price (harga).
 *
 * Updated precedence (A1):
 *   1. explicit current value (finite >0)        — wins
 *   2. persistent user profile value (finite >0)  — A1 addition
 *   3. latest valid historical record value        — D1 (existing)
 *   4. engine default                              — calc.js fallback
 *
 * This module is pure: all functions take/return data, with localStorage
 * passed explicitly where needed, so they are unit-testable with jsdom.
 */

import { findLatestFuelValue } from './records.js'

// The localStorage key used for the persistent profile.
// Follows the existing `reli-*` naming convention (reli-data, reli-auto-save).
export const SETTINGS_KEY = 'reli-settings'

/**
 * The default empty profile (no persistent values set).
 * @returns {Object} a fresh profile object.
 */
export function createDefaultProfile() {
    return {
        vehicleFuelEfficiency: null, // km/liter (konsumsi)
        defaultFuelPrice: null, // Rp/liter (harga)
    }
}

/**
 * Read and parse the settings profile from localStorage.
 * Malformed/unreadable storage falls back to the default (empty) profile.
 *
 * @param {Storage} storage - localStorage (or a compatible shim).
 * @returns {Object} the parsed profile, or the default if invalid/absent.
 */
export function getSettings(storage) {
    try {
        const raw = storage.getItem(SETTINGS_KEY)
        if (!raw) return createDefaultProfile()
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object') return createDefaultProfile()
        return {
            vehicleFuelEfficiency: extractFiniteOrNull(parsed.vehicleFuelEfficiency),
            defaultFuelPrice: extractFiniteOrNull(parsed.defaultFuelPrice),
        }
    } catch {
        return createDefaultProfile()
    }
}

/**
 * Save the settings profile to localStorage. Only finite >0 values are
 * persisted; null/invalid values are stored as null.
 *
 * @param {Storage} storage - localStorage (or a compatible shim).
 * @param {Object} profile - { vehicleFuelEfficiency, defaultFuelPrice }.
 * @returns {boolean} true on success, false on failure.
 */
export function saveSettings(storage, profile) {
    try {
        const normalized = {
            vehicleFuelEfficiency: extractFiniteOrNull(profile?.vehicleFuelEfficiency),
            defaultFuelPrice: extractFiniteOrNull(profile?.defaultFuelPrice),
        }
        storage.setItem(SETTINGS_KEY, JSON.stringify(normalized))
        return true
    } catch {
        return false
    }
}

/**
 * Clear the settings profile from localStorage.
 * @param {Storage} storage - localStorage (or a compatible shim).
 * @returns {boolean} true on success.
 */
export function clearSettings(storage) {
    try {
        storage.removeItem(SETTINGS_KEY)
        return true
    } catch {
        return false
    }
}

/**
 * Resolve a fuel default with the A1 precedence chain:
 *   1. explicit current value (finite >0)
 *   2. persistent user profile value (finite >0)
 *   3. latest valid historical record value (finite >0)
 *   4. engine default
 *
 * @param {Object} opts - { stored, field, currentValue, profileValue, engineDefault }
 *   - stored: the reli-data payload (string or object) for history lookup.
 *   - field: 'konsumsi' or 'harga'.
 *   - currentValue: the current appData fuel value.
 *   - profileValue: the persistent profile value for this field (or null).
 *   - engineDefault: the calc.js fallback constant.
 * @returns {number} a finite resolved value.
 */
export function resolveFuelDefaultWithProfile({ stored, field, currentValue, profileValue, engineDefault }) {
    // 1. Explicit current value wins.
    const cur = typeof currentValue === 'number' ? currentValue : parseFloat(currentValue)
    if (Number.isFinite(cur) && cur > 0) {
        return cur
    }
    // 2. Persistent user profile.
    const profile = extractFiniteOrNull(profileValue)
    if (profile !== null) {
        return profile
    }
    // 3. Latest valid historical record (D1).
    const inherited = findLatestFuelValue(stored, field)
    if (inherited !== null) {
        return inherited
    }
    // 4. Engine default fallback.
    return engineDefault
}

// Internal: coerce a value to a finite >0 number, or null if invalid.
function extractFiniteOrNull(value) {
    const n = typeof value === 'number' ? value : parseFloat(value)
    if (Number.isFinite(n) && n > 0) {
        return n
    }
    return null
}
