/**
 * Calculation engine — pure functions for RELI earnings math.
 *
 * Extracted from main.js so the business rules can be unit-tested without a
 * DOM. main.js imports these and keeps its state object shape identical to
 * preserve backward compatibility with saved localStorage / database records.
 *
 * All functions are total: they never throw on finite numbers and treat
 * non-numeric / missing inputs as 0.
 */

export const DEFAULT_KONSUMSI = 14
export const DEFAULT_HARGA = 10000
export const DEFAULT_KOMISI_PERCENT = { grab: 20, maxim: 20, gojek: 20, indrive: 15 }

export const PLATFORMS = ['grab', 'maxim', 'gojek', 'indrive']
export const ADDITIONAL_COST_KEYS = ['parkir', 'makan', 'kuota', 'tol', 'lainnya']

/** Create a fresh, empty appData object matching the persisted shape. */
export function createInitialAppData() {
    const platforms = {}
    for (const p of PLATFORMS) {
        platforms[p] = {
            topup: 0,
            sisa: 0,
            kotor: 0,
            cash: 0,
            transfer: 0,
            komisi: 0,
            komisiPercent: DEFAULT_KOMISI_PERCENT[p],
        }
    }
    return {
        paymentMode: 'topup',
        platforms,
        fuel: {
            jarak: 0,
            konsumsi: DEFAULT_KONSUMSI,
            harga: DEFAULT_HARGA,
            literTerpakai: 0,
            biayaBBM: 0,
        },
        additionalCosts: { parkir: 0, makan: 0, kuota: 0, tol: 0, lainnya: 0, total: 0 },
        results: {
            totalKotor: 0,
            biayaBBM: 0,
            totalAdditionalCosts: 0,
            pendapatanBersih: 0,
        },
    }
}

/**
 * Coerce an input into a finite, non-NaN number (default 0).
 *
 * Accepted types (F-08 hardening):
 *   - number        -> kept as-is when finite
 *   - numeric string -> parsed (trimming surrounding whitespace); empty
 *                       string yields 0
 *   - null/undefined -> 0
 *
 * Rejected (returned as 0) so arbitrary data is not silently converted:
 *   - arrays   (parseFloat([1,2]) would otherwise yield 1)
 *   - plain objects
 *   - functions / symbols
 *   - boolean
 *   - NaN / ±Infinity
 *   - malformed numeric strings ("abc", "1.2.3", "12abc")
 *
 * This preserves legitimate browser form input behavior (HTML number inputs
 * deliver strings or empty strings) while refusing to silently coerce
 * structured data into a plausible-but-wrong number.
 */
export function toNumber(value) {
    if (value === null || value === undefined) return 0
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0
    }
    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed === '') return 0
        // parseFloat accepts leading numbers and ignores trailing garbage;
        // require the *entire* trimmed string to be a valid numeric literal
        // so "12abc" is rejected rather than coerced to 12.
        if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(trimmed)) return 0
        const n = parseFloat(trimmed)
        return Number.isFinite(n) ? n : 0
    }
    // arrays, plain objects, functions, symbols, booleans -> 0
    return 0
}

/**
 * Recompute a single platform's `kotor` and `komisi` based on payment mode.
 * Mutates the platform object in place and returns it (convenience).
 *
 * Rules:
 *  - topup mode:  kotor = topup - sisa        (direct `kotor` input wins)
 *  - direct mode: kotor = cash + transfer - komisi, where
 *                 komisi = (cash + transfer) * komisiPercent / 100
 *                 (direct `kotor` input wins)
 */
export function recomputePlatform(platform, paymentMode) {
    const directKotor = toNumber(platform.kotor)
    if (paymentMode === 'topup') {
        // Direct `kotor` input wins when provided; otherwise derive from
        // topup - sisa. Komisi is NOT meaningful in topup mode and must
        // always be reset to 0 so a stale value from a previous direct-mode
        // session cannot leak into totals or the UI (invariant: TOPUP mode
        // never retains DIRECT-mode commission state).
        platform.kotor = directKotor || toNumber(platform.topup) - toNumber(platform.sisa)
        platform.komisi = 0
        return platform
    }

    // direct mode: cash + transfer - komisi, where
    // komisi = (cash + transfer) * komisiPercent / 100
    // (direct `kotor` input wins)
    const cash = toNumber(platform.cash)
    const transfer = toNumber(platform.transfer)
    const pct = toNumber(platform.komisiPercent)
    const totalBeforeKomisi = cash + transfer
    if (directKotor) {
        platform.kotor = directKotor
        // Back-calculate the implied komisi so the UI shows a consistent figure.
        platform.komisi = Math.max(0, totalBeforeKomisi - directKotor)
    } else {
        platform.komisi = (totalBeforeKomisi * pct) / 100
        platform.kotor = totalBeforeKomisi - platform.komisi
    }
    return platform
}

/**
 * Recompute fuel fields (literTerpakai, biayaBBM) from jarak/konsumsi/harga.
 * Returns early with zeros when jarak or konsumsi is non-positive so we never
 * divide by zero or produce Infinity/NaN.
 */
export function recomputeFuel(fuel) {
    const jarak = toNumber(fuel.jarak)
    const konsumsi = toNumber(fuel.konsumsi)
    const harga = toNumber(fuel.harga)
    if (jarak > 0 && konsumsi > 0) {
        fuel.literTerpakai = jarak / konsumsi
        fuel.biayaBBM = fuel.literTerpakai * harga
    } else {
        fuel.literTerpakai = 0
        fuel.biayaBBM = 0
    }
    return fuel
}

/**
 * Recompute the additionalCosts.total from its component fields.
 */
export function recomputeAdditionalCosts(additionalCosts) {
    let total = 0
    for (const key of ADDITIONAL_COST_KEYS) {
        total += toNumber(additionalCosts[key])
    }
    additionalCosts.total = total
    return additionalCosts
}

/**
 * Full results recalculation. Mutates `appData` in place (same shape as
 * main.js's calculateResults) and returns the `results` object.
 *
 *   totalKotor          = sum of platform.kotor
 *   biayaBBM            = round(fuel.biayaBBM)
 *   totalAdditionalCosts = additionalCosts.total
 *   pendapatanBersih    = totalKotor - biayaBBM - totalAdditionalCosts
 */
export function calculateResults(appData) {
    let totalKotor = 0
    for (const p of PLATFORMS) {
        const platform = appData.platforms?.[p]
        if (platform) {
            // Recompute derived fields so the totals always reflect the raw
            // inputs (topup/sisa or cash/transfer), even when callers mutate
            // raw fields directly without going through recomputePlatform.
            recomputePlatform(platform, appData.paymentMode)
            totalKotor += toNumber(platform.kotor)
        }
    }

    recomputeFuel(appData.fuel)
    recomputeAdditionalCosts(appData.additionalCosts)

    const biayaBBM = Math.round(toNumber(appData.fuel.biayaBBM))
    const totalAdditionalCosts = toNumber(appData.additionalCosts.total)

    appData.results = {
        totalKotor,
        biayaBBM,
        totalAdditionalCosts,
        pendapatanBersih: totalKotor - biayaBBM - totalAdditionalCosts,
    }
    return appData.results
}

/** Format a number as Indonesian locale currency grouping (no currency symbol). */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID').format(Math.round(toNumber(amount)))
}
