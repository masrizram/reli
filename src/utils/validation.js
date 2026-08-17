/**
 * G2: Input Validation Warnings — pure, non-blocking validation.
 *
 * Inspects the current appData and returns a list of warning objects for
 * suspicious input values. Warnings are NON-BLOCKING: they inform the user
 * but never alter calculations or prevent saving.
 *
 * Each warning: { id, field, severity, message }
 *   - id: stable identifier for the warning (for clear-on-revalidate)
 *   - field: the logical input area ('fuel', 'platforms', 'costs', 'results')
 *   - severity: 'warning' | 'info'
 *   - message: Indonesian-language user-facing message
 *
 * The calculation engine (calc.js) is NEVER modified. This module only
 * reads appData and reports anomalies.
 */

import { PLATFORMS } from './calc.js'

/**
 * Validate the current appData and return non-blocking warnings.
 *
 * @param {Object} appData - the application state object.
 * @returns {Array<{id:string, field:string, severity:string, message:string}>}
 */
export function validateInputs(appData) {
    const warnings = []
    if (!appData || typeof appData !== 'object') return warnings

    // --- Fuel validation ---
    const fuel = appData.fuel || {}
    const konsumsi = typeof fuel.konsumsi === 'number' ? fuel.konsumsi : parseFloat(fuel.konsumsi)
    const jarak = typeof fuel.jarak === 'number' ? fuel.jarak : parseFloat(fuel.jarak)
    const harga = typeof fuel.harga === 'number' ? fuel.harga : parseFloat(fuel.harga)

    if (jarak > 0 && (konsumsi === 0 || !Number.isFinite(konsumsi))) {
        warnings.push({
            id: 'fuel-zero-konsumsi',
            field: 'fuel',
            severity: 'warning',
            message: 'Konsumsi BBM 0 km/L membuat biaya BBM tidak dapat dihitung. Masukkan konsumsi kendaraan.',
        })
    }

    if (Number.isFinite(konsumsi) && konsumsi < 0) {
        warnings.push({
            id: 'fuel-negative-konsumsi',
            field: 'fuel',
            severity: 'warning',
            message: 'Konsumsi BBM negatif tidak masuk akal. Periksa kembali nilai konsumsi.',
        })
    }

    if (Number.isFinite(harga) && harga < 0) {
        warnings.push({
            id: 'fuel-negative-harga',
            field: 'fuel',
            severity: 'warning',
            message: 'Harga BBM negatif tidak masuk akal. Periksa kembali nilai harga.',
        })
    }

    if (Number.isFinite(jarak) && jarak < 0) {
        warnings.push({
            id: 'fuel-negative-jarak',
            field: 'fuel',
            severity: 'warning',
            message: 'Jarak tempuh negatif tidak masuk akal. Periksa kembali nilai jarak.',
        })
    }

    // --- Platform validation ---
    if (appData.platforms) {
        for (const p of PLATFORMS) {
            const plat = appData.platforms[p]
            if (!plat) continue

            const kotor = typeof plat.kotor === 'number' ? plat.kotor : parseFloat(plat.kotor)
            if (Number.isFinite(kotor) && kotor < 0) {
                warnings.push({
                    id: `platform-negative-kotor-${p}`,
                    field: 'platforms',
                    severity: 'warning',
                    message: `Pendapatan kotor ${p} negatif (Rp ${formatInt(kotor)}). Sisa saldo melebihi top-up?`,
                })
            }

            // In direct mode, warn if komisiPercent is implausible (>100 or <0).
            if (appData.paymentMode === 'direct') {
                const pct = typeof plat.komisiPercent === 'number' ? plat.komisiPercent : parseFloat(plat.komisiPercent)
                if (Number.isFinite(pct) && (pct < 0 || pct > 100)) {
                    warnings.push({
                        id: `platform-invalid-komisi-percent-${p}`,
                        field: 'platforms',
                        severity: 'warning',
                        message: `Komisi ${p} ${pct}% di luar rentang wajar (0-100%). Periksa kembali persentase komisi.`,
                    })
                }
            }
        }
    }

    // --- Additional costs validation ---
    if (appData.additionalCosts) {
        const costFields = ['parkir', 'makan', 'kuota', 'tol', 'lainnya']
        for (const f of costFields) {
            const v =
                typeof appData.additionalCosts[f] === 'number'
                    ? appData.additionalCosts[f]
                    : parseFloat(appData.additionalCosts[f])
            if (Number.isFinite(v) && v < 0) {
                warnings.push({
                    id: `cost-negative-${f}`,
                    field: 'costs',
                    severity: 'warning',
                    message: `Biaya ${f} negatif tidak masuk akal. Periksa kembali nilai.`,
                })
            }
        }
    }

    // --- Expense ratio anomaly ---
    const results = appData.results || {}
    const totalKotor = typeof results.totalKotor === 'number' ? results.totalKotor : parseFloat(results.totalKotor)
    const biayaBBM = typeof results.biayaBBM === 'number' ? results.biayaBBM : parseFloat(results.biayaBBM)
    const totalCosts =
        typeof results.totalAdditionalCosts === 'number'
            ? results.totalAdditionalCosts
            : parseFloat(results.totalAdditionalCosts)

    if (Number.isFinite(totalKotor) && totalKotor > 0) {
        const totalExpenses =
            (Number.isFinite(biayaBBM) ? biayaBBM : 0) + (Number.isFinite(totalCosts) ? totalCosts : 0)
        const ratio = totalExpenses / totalKotor
        if (ratio > 0.6) {
            warnings.push({
                id: 'expense-ratio-high',
                field: 'results',
                severity: 'info',
                message: `Biaya operasional ${(ratio * 100).toFixed(0)}% dari pendapatan kotor. Pertimbangkan optimasi biaya.`,
            })
        }
    }

    return warnings
}

// Minimal integer formatter for the warning messages (no side-effects).
function formatInt(n) {
    return new Intl.NumberFormat('id-ID').format(Math.round(n || 0))
}
