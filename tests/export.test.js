/**
 * F1 tests: CSV export utility (buildCSV).
 *
 * Verifies headers, all platform/fuel/cost/result fields, safe handling of
 * missing nested objects, RFC-4180 escaping (comma/quote/newline), and the
 * empty-dataset (headers-only) behavior. buildCSV is pure (no DOM/I/O).
 */
import { describe, it, expect } from 'vitest'
import { buildCSV, buildHeaders, escapeCSV } from '../src/utils/export.js'
import { PLATFORMS, ADDITIONAL_COST_KEYS } from '../src/utils/calc.js'

function parseCSVLine(line) {
    // Minimal RFC-4180 line parser for test assertions.
    const fields = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (inQuotes) {
            if (ch === '"') {
                if (line[i + 1] === '"') {
                    cur += '"'
                    i++
                } else {
                    inQuotes = false
                }
            } else {
                cur += ch
            }
        } else {
            if (ch === ',') {
                fields.push(cur)
                cur = ''
            } else if (ch === '"') {
                inQuotes = true
            } else {
                cur += ch
            }
        }
    }
    fields.push(cur)
    return fields
}

function sampleRecord() {
    return {
        platforms: {
            grab: { topup: 500000, sisa: 135300, kotor: 364700, cash: 0, transfer: 0, komisi: 0, komisiPercent: 20 },
            maxim: { topup: 0, sisa: 0, kotor: 230600, cash: 0, transfer: 0, komisi: 0, komisiPercent: 20 },
            gojek: { topup: 0, sisa: 0, kotor: 0, cash: 0, transfer: 0, komisi: 0, komisiPercent: 20 },
            indrive: { topup: 0, sisa: 0, kotor: 0, cash: 200000, transfer: 255875, komisi: 68381, komisiPercent: 15 },
        },
        fuel: { jarak: 286.6, konsumsi: 13.5, harga: 10000, literTerpakai: 21.2296, biayaBBM: 212296 },
        additionalCosts: { parkir: 0, makan: 50000, kuota: 0, tol: 200000, lainnya: 0, total: 250000 },
        results: { totalKotor: 563900, biayaBBM: 212296, totalAdditionalCosts: 250000, pendapatanBersih: 101604 },
    }
}

describe('buildHeaders', () => {
    it('starts with Tanggal', () => {
        const h = buildHeaders()
        expect(h[0]).toBe('Tanggal')
    })

    it('includes all 7 fields for each of the 4 platforms', () => {
        const h = buildHeaders()
        for (const p of PLATFORMS) {
            expect(h).toContain(`${p.charAt(0).toUpperCase() + p.slice(1)} Topup`)
            expect(h).toContain(`${p.charAt(0).toUpperCase() + p.slice(1)} Sisa`)
            expect(h).toContain(`${p.charAt(0).toUpperCase() + p.slice(1)} Kotor`)
            expect(h).toContain(`${p.charAt(0).toUpperCase() + p.slice(1)} Cash`)
            expect(h).toContain(`${p.charAt(0).toUpperCase() + p.slice(1)} Transfer`)
            expect(h).toContain(`${p.charAt(0).toUpperCase() + p.slice(1)} Komisi`)
            expect(h).toContain(`${p.charAt(0).toUpperCase() + p.slice(1)} KomisiPercent`)
        }
    })

    it('includes fuel, costs, and result headers', () => {
        const h = buildHeaders()
        expect(h).toContain('Jarak (km)')
        expect(h).toContain('Konsumsi (km/l)')
        expect(h).toContain('Harga BBM')
        expect(h).toContain('Liter Terpakai')
        for (const k of ADDITIONAL_COST_KEYS) {
            expect(h).toContain(k.charAt(0).toUpperCase() + k.slice(1))
        }
        expect(h).toContain('Total Kotor')
        expect(h).toContain('Pendapatan Bersih')
    })

    it('has the expected total column count (1 + 4*7 + 5 + 5 + 4 = 43)', () => {
        expect(buildHeaders().length).toBe(43)
    })
})

describe('buildCSV — headers and structure', () => {
    it('always returns at least the header row (never empty string)', () => {
        const csv = buildCSV({})
        const lines = csv.split('\n').filter(Boolean)
        expect(lines.length).toBe(1)
        expect(lines[0]).toContain('Tanggal')
    })

    it('returns headers only for null/undefined records', () => {
        expect(buildCSV(null).split('\n').filter(Boolean).length).toBe(1)
        expect(buildCSV(undefined).split('\n').filter(Boolean).length).toBe(1)
    })

    it('emits one row per date, sorted ascending', () => {
        const records = {
            '2025-01-03': sampleRecord(),
            '2025-01-01': sampleRecord(),
            '2025-01-02': sampleRecord(),
        }
        const lines = buildCSV(records).split('\n').filter(Boolean)
        expect(lines.length).toBe(4) // 1 header + 3 rows
        const dates = [lines[1], lines[2], lines[3]].map(l => parseCSVLine(l)[0])
        expect(dates).toEqual(['2025-01-01', '2025-01-02', '2025-01-03'])
    })

    it('skips non-date keys (e.g. legacy _meta)', () => {
        const records = {
            '2025-01-01': sampleRecord(),
            _meta: { version: '2.0' },
        }
        const lines = buildCSV(records).split('\n').filter(Boolean)
        expect(lines.length).toBe(2) // header + 1 row
    })
})

describe('buildCSV — field values', () => {
    it('emits platform values for all four platforms', () => {
        const records = { '2025-01-01': sampleRecord() }
        const lines = buildCSV(records).split('\n').filter(Boolean)
        const row = parseCSVLine(lines[1])
        const headers = parseCSVLine(lines[0])
        const grabTopupIdx = headers.indexOf('Grab Topup')
        const indriveKomisiIdx = headers.indexOf('Indrive Komisi')
        expect(row[grabTopupIdx]).toBe('500000')
        expect(row[indriveKomisiIdx]).toBe('68381')
    })

    it('emits fuel values', () => {
        const records = { '2025-01-01': sampleRecord() }
        const lines = buildCSV(records).split('\n').filter(Boolean)
        const row = parseCSVLine(lines[1])
        const headers = parseCSVLine(lines[0])
        expect(row[headers.indexOf('Jarak (km)')]).toBe('286.6')
        expect(row[headers.indexOf('Konsumsi (km/l)')]).toBe('13.5')
        expect(row[headers.indexOf('Harga BBM')]).toBe('10000')
        expect(row[headers.indexOf('Liter Terpakai')]).toBe('21.2296')
        expect(row[headers.indexOf('Biaya BBM')]).toBe('212296')
    })

    it('emits additional cost values', () => {
        const records = { '2025-01-01': sampleRecord() }
        const lines = buildCSV(records).split('\n').filter(Boolean)
        const row = parseCSVLine(lines[1])
        const headers = parseCSVLine(lines[0])
        expect(row[headers.indexOf('Makan')]).toBe('50000')
        expect(row[headers.indexOf('Tol')]).toBe('200000')
        expect(row[headers.indexOf('Parkir')]).toBe('0')
    })

    it('emits result values', () => {
        const records = { '2025-01-01': sampleRecord() }
        const lines = buildCSV(records).split('\n').filter(Boolean)
        const row = parseCSVLine(lines[1])
        const headers = parseCSVLine(lines[0])
        expect(row[headers.indexOf('Total Kotor')]).toBe('563900')
        expect(row[headers.indexOf('Pendapatan Bersih')]).toBe('101604')
    })
})

describe('buildCSV — malformed/missing data', () => {
    it('resolves missing platforms object to zeros', () => {
        const records = { '2025-01-01': { fuel: {}, additionalCosts: {}, results: {} } }
        const lines = buildCSV(records).split('\n').filter(Boolean)
        const row = parseCSVLine(lines[1])
        const headers = parseCSVLine(lines[0])
        expect(row[headers.indexOf('Grab Topup')]).toBe('0')
        expect(row[headers.indexOf('Indrive Kotor')]).toBe('0')
    })

    it('resolves missing fuel/additionalCosts/results to zeros', () => {
        const records = { '2025-01-01': {} }
        const lines = buildCSV(records).split('\n').filter(Boolean)
        const row = parseCSVLine(lines[1])
        const headers = parseCSVLine(lines[0])
        expect(row[headers.indexOf('Jarak (km)')]).toBe('0')
        expect(row[headers.indexOf('Makan')]).toBe('0')
        expect(row[headers.indexOf('Pendapatan Bersih')]).toBe('0')
    })

    it('does not throw on a null dayData value', () => {
        expect(() => buildCSV({ '2025-01-01': null })).not.toThrow()
        const lines = buildCSV({ '2025-01-01': null }).split('\n').filter(Boolean)
        // null dayData is skipped (treated as no record), so headers only
        expect(lines.length).toBe(1)
    })

    it('coerces non-numeric stored strings to numbers', () => {
        const records = {
            '2025-01-01': {
                platforms: { grab: { kotor: 'abc', topup: '100' } },
                fuel: {},
                additionalCosts: {},
                results: {},
            },
        }
        const lines = buildCSV(records).split('\n').filter(Boolean)
        const row = parseCSVLine(lines[1])
        const headers = parseCSVLine(lines[0])
        expect(row[headers.indexOf('Grab Kotor')]).toBe('0')
        expect(row[headers.indexOf('Grab Topup')]).toBe('100')
    })
})

describe('escapeCSV — RFC-4180 field escaping (unit)', () => {
    it('does not quote a plain value with no special characters', () => {
        expect(escapeCSV('hello')).toBe('hello')
        expect(escapeCSV(123)).toBe('123')
        expect(escapeCSV(0)).toBe('0')
    })
    it('quotes a value containing a comma', () => {
        expect(escapeCSV('a,b')).toBe('"a,b"')
    })
    it('quotes a value containing a double-quote and doubles the quote', () => {
        expect(escapeCSV('a"b')).toBe('"a""b"')
    })
    it('quotes a value containing a newline', () => {
        expect(escapeCSV('a\nb')).toBe('"a\nb"')
        expect(escapeCSV('a\rb')).toBe('"a\rb"')
        expect(escapeCSV('a\r\nb')).toBe('"a\r\nb"')
    })
    it('treats null and undefined as empty string', () => {
        expect(escapeCSV(null)).toBe('')
        expect(escapeCSV(undefined)).toBe('')
    })
    it('doubles multiple quotes inside a quoted value', () => {
        expect(escapeCSV('he said "hi" and "bye"')).toBe('"he said ""hi"" and ""bye"""')
    })
})

describe('buildCSV — end-to-end escaping via round-trip', () => {
    it('every data row has the same field count as the header', () => {
        const records = {
            '2025-01-01': sampleRecord(),
            '2025-01-02': sampleRecord(),
        }
        const csv = buildCSV(records)
        const lines = csv.split('\n').filter(Boolean)
        const headerCount = parseCSVLine(lines[0]).length
        for (let i = 1; i < lines.length; i++) {
            expect(parseCSVLine(lines[i]).length).toBe(headerCount)
        }
    })

    it('a normal date is emitted unquoted (no special chars)', () => {
        const records = { '2025-01-01': sampleRecord() }
        const lines = buildCSV(records).split('\n').filter(Boolean)
        expect(lines[1].startsWith('2025-01-01,')).toBe(true)
        // The date field should not be wrapped in quotes.
        expect(lines[1].startsWith('"2025-01-01"')).toBe(false)
    })
})
