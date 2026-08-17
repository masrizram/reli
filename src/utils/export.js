/**
 * CSV export utility — pure, testable CSV generation for RELI daily records.
 *
 * buildCSV() takes a normalized records map (date -> daily data) and returns
 * an RFC-4180-compatible CSV string. It performs NO I/O and never throws on
 * partially malformed records; missing nested properties resolve safely.
 *
 * The DOM/download logic lives in main.js's exportToCSV() adapter, which
 * gathers records (localStorage or Supabase) and feeds them to buildCSV.
 */

import { PLATFORMS, ADDITIONAL_COST_KEYS } from './calc.js'

// Fuel field keys read from the daily record's `fuel` object.
const FUEL_KEYS = ['jarak', 'konsumsi', 'harga', 'literTerpakai', 'biayaBBM']

// Result field keys read from the daily record's `results` object.
const RESULT_KEYS = ['totalKotor', 'biayaBBM', 'totalAdditionalCosts', 'pendapatanBersih']

// Per-platform field keys read from `platforms[<platform>]`.
const PLATFORM_KEYS = ['topup', 'sisa', 'kotor', 'cash', 'transfer', 'komisi', 'komisiPercent']

// Capitalize first letter for header labels (grab -> Grab).
function cap(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

// Human-readable header labels for platform fields (Grab Topup, etc.).
function platformHeader(platform, field) {
    return `${cap(platform)} ${cap(field)}`
}

// Human-readable header labels for fuel / cost / result fields.
function labelFor(prefix, key) {
    const map = {
        fuel: {
            jarak: 'Jarak (km)',
            konsumsi: 'Konsumsi (km/l)',
            harga: 'Harga BBM',
            literTerpakai: 'Liter Terpakai',
            biayaBBM: 'Biaya BBM',
        },
        costs: {
            parkir: 'Parkir',
            makan: 'Makan',
            kuota: 'Kuota',
            tol: 'Tol',
            lainnya: 'Lainnya',
        },
        results: {
            totalKotor: 'Total Kotor',
            biayaBBM: 'Biaya BBM',
            totalAdditionalCosts: 'Biaya Tambahan',
            pendapatanBersih: 'Pendapatan Bersih',
        },
    }
    return (map[prefix] && map[prefix][key]) || cap(key)
}

/**
 * Escape a single CSV field per RFC 4180.
 * - A field is quoted if it contains a comma, double-quote, or newline.
 * - Inside quoted fields, double-quotes are doubled.
 *
 * Exported so tests can verify escaping behavior directly.
 */
export function escapeCSV(value) {
    const str = value === null || value === undefined ? '' : String(value)
    if (/[",\r\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

/**
 * Build the full CSV header row.
 * Order: Tanggal + platforms(7 each) + fuel(5) + costs(5) + results(4)
 */
export function buildHeaders() {
    const headers = ['Tanggal']
    for (const p of PLATFORMS) {
        for (const f of PLATFORM_KEYS) {
            headers.push(platformHeader(p, f))
        }
    }
    for (const k of FUEL_KEYS) {
        headers.push(labelFor('fuel', k))
    }
    for (const k of ADDITIONAL_COST_KEYS) {
        headers.push(labelFor('costs', k))
    }
    for (const k of RESULT_KEYS) {
        headers.push(labelFor('results', k))
    }
    return headers
}

/**
 * Safely read a numeric field from a nested object, returning 0 when absent
 * or non-finite. Mirrors calc.js toNumber semantics for numeric fields.
 */
function num(obj, key) {
    if (!obj || typeof obj !== 'object') return 0
    const v = obj[key]
    const n = typeof v === 'number' ? v : parseFloat(v)
    return Number.isFinite(n) ? n : 0
}

/**
 * Build a single CSV row from one daily record.
 * Never throws; missing nested objects resolve to zeros.
 */
function buildRow(date, dayData) {
    const row = [escapeCSV(date)]
    const platforms = (dayData && dayData.platforms) || {}
    const fuel = (dayData && dayData.fuel) || {}
    const costs = (dayData && dayData.additionalCosts) || {}
    const results = (dayData && dayData.results) || {}

    for (const p of PLATFORMS) {
        const plat = platforms[p] || {}
        for (const f of PLATFORM_KEYS) {
            row.push(num(plat, f))
        }
    }
    for (const k of FUEL_KEYS) {
        row.push(num(fuel, k))
    }
    for (const k of ADDITIONAL_COST_KEYS) {
        row.push(num(costs, k))
    }
    for (const k of RESULT_KEYS) {
        row.push(num(results, k))
    }
    return row.map(escapeCSV).join(',')
}

/**
 * Generate a full CSV string from a records map.
 *
 * @param {Object} records - map of { date: dayData } (dayData has
 *   platforms, fuel, additionalCosts, results). Values may be partially
 *   malformed; missing nested objects are treated as empty.
 * @returns {string} RFC-4180 CSV with a header row and one row per valid
 *   date. Always returns at least the header row (never an empty string).
 */
export function buildCSV(records) {
    const headers = buildHeaders()
    const lines = [headers.map(escapeCSV).join(',')]

    if (records && typeof records === 'object') {
        // Sort by date ascending for a stable, readable export.
        const dates = Object.keys(records).sort()
        for (const date of dates) {
            // Skip non-record keys (e.g. legacy _meta) that aren't YYYY-MM-DD.
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
            const dayData = records[date]
            if (dayData === null || dayData === undefined) continue
            lines.push(buildRow(date, dayData))
        }
    }

    return lines.join('\n') + '\n'
}
