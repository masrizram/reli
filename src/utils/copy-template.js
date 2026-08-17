/**
 * A2: Copy Previous Day / Daily Template — pure utilities.
 *
 * Copies RAW INPUT fields from a source daily record into a destination
 * appData object, WITHOUT copying calculated results, timestamps, or
 * metadata. The source record is treated as READ-ONLY (never mutated).
 *
 * Field scope copied:
 *   - paymentMode
 *   - platforms[*].{topup, sisa, kotor, cash, transfer, komisi, komisiPercent}
 *   - fuel.{jarak, konsumsi, harga}
 *   - additionalCosts.{parkir, makan, kuota, tol, lainnya}
 *
 * Fields NOT copied (belong to the source date / are derived):
 *   - results.*            (recomputed from inputs via calculateResults)
 *   - fuel.literTerpakai   (derived from jarak/konsumsi)
 *   - fuel.biayaBBM        (derived from literTerpakai * harga)
 *   - additionalCosts.total (derived from component fields)
 *   - timestamp / id / version / created_at / updated_at
 */

import { PLATFORMS, ADDITIONAL_COST_KEYS, toNumber } from './calc.js'

// Platform raw-input fields eligible for copying.
const PLATFORM_INPUT_FIELDS = ['topup', 'sisa', 'kotor', 'cash', 'transfer', 'komisi', 'komisiPercent']

// Fuel raw-input fields eligible for copying (derived fields excluded).
const FUEL_INPUT_FIELDS = ['jarak', 'konsumsi', 'harga']

/**
 * Determine whether a stored record is "valid" for copying: it must be a
 * non-null object with either a `platforms` or `fuel` object. Records with
 * only `results` (no inputs) are not useful as a template.
 *
 * @param {*} entry - a stored daily record value.
 * @returns {boolean}
 */
export function isValidSourceRecord(entry) {
    if (!entry || typeof entry !== 'object') return false
    const hasPlatforms = Boolean(entry.platforms && typeof entry.platforms === 'object')
    const hasFuel = Boolean(entry.fuel && typeof entry.fuel === 'object')
    return hasPlatforms || hasFuel
}

/**
 * List valid source dates from a records map (excluding a target date).
 * Dates are returned sorted descending (newest first).
 *
 * @param {Object|string} stored - parsed reli-data or raw JSON string.
 * @param {string} [excludeDate] - the current target date to exclude.
 * @returns {string[]} valid date keys that can serve as copy sources.
 */
export function listSourceDates(stored, excludeDate = null) {
    let data = stored
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data)
        } catch {
            return []
        }
    }
    if (!data || typeof data !== 'object') return []

    return Object.keys(data)
        .filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k) && k !== excludeDate)
        .filter(k => isValidSourceRecord(data[k]))
        .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
}

/**
 * Deep-clone the raw-input fields from a source record into a new plain
 * object suitable for merging into appData. Derived fields (results,
 * literTerpakai, biayaBBM, additionalCosts.total) are NOT copied.
 *
 * @param {Object} source - a valid source daily record.
 * @returns {Object} a partial appData-shaped object with only input fields.
 */
export function extractInputFields(source) {
    const result = {
        paymentMode: source.paymentMode === 'direct' ? 'direct' : 'topup',
        platforms: {},
        fuel: {},
        additionalCosts: {},
    }

    // Copy platform input fields for each known platform.
    for (const p of PLATFORMS) {
        const src = source.platforms?.[p]
        result.platforms[p] = {}
        for (const f of PLATFORM_INPUT_FIELDS) {
            result.platforms[p][f] = src ? toNumber(src[f]) : 0
        }
    }

    // Copy fuel input fields only (not derived literTerpakai/biayaBBM).
    for (const f of FUEL_INPUT_FIELDS) {
        result.fuel[f] = source.fuel ? toNumber(source.fuel[f]) : 0
    }

    // Copy additional cost component fields only (not derived total).
    for (const f of ADDITIONAL_COST_KEYS) {
        result.additionalCosts[f] = source.additionalCosts ? toNumber(source.additionalCosts[f]) : 0
    }

    return result
}

/**
 * Copy raw-input fields from a source record into a destination appData
 * object (mutating it in place, consistent with the existing appData pattern).
 *
 * Safety guarantees:
 *   - The source record is NEVER mutated (read-only).
 *   - Only input fields are copied; results/derived fields are NOT copied.
 *   - The destination keeps its existing `results` until recalculation.
 *   - Invalid/missing platforms in the source default to 0, not undefined.
 *
 * @param {Object} destination - the appData object to receive copied values.
 * @param {Object} source - the source daily record (read-only).
 * @returns {Object} the destination (mutated), for convenience.
 */
export function copyRecordInputs(destination, source) {
    if (!destination || typeof destination !== 'object') {
        throw new Error('copyRecordInputs: destination must be an object')
    }
    if (!isValidSourceRecord(source)) {
        return destination // no-op for invalid source
    }

    const extracted = extractInputFields(source)

    destination.paymentMode = extracted.paymentMode

    for (const p of PLATFORMS) {
        if (!destination.platforms[p]) destination.platforms[p] = {}
        for (const f of PLATFORM_INPUT_FIELDS) {
            destination.platforms[p][f] = extracted.platforms[p][f]
        }
    }

    if (!destination.fuel) destination.fuel = {}
    for (const f of FUEL_INPUT_FIELDS) {
        destination.fuel[f] = extracted.fuel[f]
    }

    if (!destination.additionalCosts) destination.additionalCosts = {}
    for (const f of ADDITIONAL_COST_KEYS) {
        destination.additionalCosts[f] = extracted.additionalCosts[f]
    }

    return destination
}
