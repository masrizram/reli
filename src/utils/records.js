/**
 * G1: first-launch detection — determine whether the user has any valid saved
 * daily records so the dashboard can show an onboarding empty state instead
 * of misleading zero statistics.
 *
 * A record is considered "valid" for onboarding purposes when it has a
 * non-empty `results` object (the canonical shape persisted by saveToStorage).
 * Malformed entries (non-objects, missing results) are treated as absent.
 *
 * Pure functions: no I/O beyond the localStorage argument passed in, so they
 * are unit-testable with jsdom's localStorage.
 */

/**
 * Count valid daily records in a localStorage `reli-data` payload.
 *
 * @param {Object|string} stored - the parsed `reli-data` object, or a raw
 *   JSON string (parsed safely). May be null/undefined/malformed.
 * @returns {number} count of date-keyed entries that look like real records.
 */
export function countValidRecords(stored) {
    let data = stored
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data)
        } catch {
            return 0
        }
    }
    if (!data || typeof data !== 'object') return 0

    let count = 0
    for (const key of Object.keys(data)) {
        // Skip internal metadata keys (legacy _meta, etc.).
        if (key === '_meta') continue
        const entry = data[key]
        if (!entry || typeof entry !== 'object') continue
        // A real daily record carries a results object.
        if (entry.results && typeof entry.results === 'object') {
            count++
        }
    }
    return count
}

/**
 * Read the canonical `reli-data` from localStorage and report whether any
 * valid daily record exists. Used by the dashboard to decide between the
 * onboarding empty state and the normal stats view.
 *
 * Falls back to "has records = false" when storage is unreadable, so a
 * first-launch / corrupted state shows the onboarding CTA (safe default).
 *
 * @param {Storage} storage - localStorage (or a compatible shim).
 * @returns {boolean} true when at least one valid record is present.
 */
export function hasSavedRecords(storage) {
    try {
        const raw = storage.getItem('reli-data')
        if (!raw) return false
        return countValidRecords(raw) > 0
    } catch {
        return false
    }
}

// ---------------------------------------------------------------------------
// D1: auto-fill fuel values from the most recent valid record.
//
// "Valid" fuel value: a finite number greater than zero, read from a record's
// `fuel.<field>`. A record is eligible when it has a `fuel` object. Records
// are inspected newest-date-first; the first finite >0 value for each field
// wins. Malformed records are skipped.
// ---------------------------------------------------------------------------

/**
 * Parse a stored `reli-data` payload into a stable object (from string or
 * object). Returns null when unparseable.
 */
function parseRecords(stored) {
    let data = stored
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data)
        } catch {
            return null
        }
    }
    if (!data || typeof data !== 'object') return null
    return data
}

/**
 * Find the most recent valid value for a fuel field across saved records.
 *
 * @param {Object|string} stored - parsed reli-data or raw JSON string.
 * @param {string} field - fuel field name ('konsumsi' or 'harga').
 * @returns {number|null} the newest finite >0 value, or null when none found.
 */
export function findLatestFuelValue(stored, field) {
    const data = parseRecords(stored)
    if (!data) return null

    // Collect date keys that look like YYYY-MM-DD, sort descending (newest first).
    const dates = Object.keys(data)
        .filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k))
        .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))

    for (const date of dates) {
        const entry = data[date]
        if (!entry || typeof entry !== 'object') continue
        const fuel = entry.fuel
        if (!fuel || typeof fuel !== 'object') continue
        const v = fuel[field]
        const n = typeof v === 'number' ? v : parseFloat(v)
        if (Number.isFinite(n) && n > 0) {
            return n
        }
    }
    return null
}

/**
 * Resolve fuel defaults for a new record using the most recent valid record.
 *
 * Precedence for each field (konsumsi / harga):
 *   1. currentValue — if it's a finite >0 number, it wins (explicit entry).
 *   2. most recent valid record value — inherited from history (D1).
 *   3. engineDefault — the existing calc.js fallback (unchanged).
 *
 * Does NOT modify calc.js constants; the engine default is passed in by the
 * caller so this utility stays pure and does not import calc.
 *
 * @param {Object} opts - { stored, field, currentValue, engineDefault }
 * @returns {number} the resolved value (always a finite number).
 */
export function resolveFuelDefault({ stored, field, currentValue, engineDefault }) {
    // 1. Explicit current value wins.
    const cur = typeof currentValue === 'number' ? currentValue : parseFloat(currentValue)
    if (Number.isFinite(cur) && cur > 0) {
        return cur
    }
    // 2. Inherit from the most recent valid record.
    const inherited = findLatestFuelValue(stored, field)
    if (inherited !== null) {
        return inherited
    }
    // 3. Engine default fallback.
    return engineDefault
}
