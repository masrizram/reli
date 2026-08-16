/**
 * F-06 regression: analytics null-trend runtime crash.
 *
 * The previous pattern `trend?.change.toFixed(1)` threw a TypeError when
 * `trend` was null because the optional chaining only guards the member
 * access, not the subsequent `.toFixed()` call on `undefined`.
 *
 * AnalyticsService.normalizeTrend guarantees a safe render shape for every
 * failure mode. These tests verify the *behavior* of the normalization
 * (finite numbers, safe label strings) so the analytics UI remains
 * functional when trend retrieval fails.
 */
import { describe, it, expect } from 'vitest'
import { AnalyticsService } from '../src/services/AnalyticsService.js'

describe('F-06: AnalyticsService.normalizeTrend — null/failed trend', () => {
    it('returns a safe fallback shape for a null result (failed request)', () => {
        const r = AnalyticsService.normalizeTrend(null)
        expect(r.available).toBe(false)
        expect(r.change).toBe(0)
        expect(Number.isFinite(r.change)).toBe(true)
        expect(r.label).toBe('—')
        expect(r.message).toBeTruthy()
        expect(r.icon).toBe('📊')
    })

    it('returns a safe fallback shape for an unsuccessful result', () => {
        const r = AnalyticsService.normalizeTrend({ success: false, error: 'network down' })
        expect(r.available).toBe(false)
        expect(r.label).toBe('—')
    })

    it('returns a safe fallback shape for an undefined result', () => {
        const r = AnalyticsService.normalizeTrend(undefined)
        expect(r.available).toBe(false)
        expect(r.change).toBe(0)
    })

    it('handles a trend with missing change field', () => {
        const r = AnalyticsService.normalizeTrend({ success: true, data: { trend: 'stable', message: 'ok' } })
        expect(r.available).toBe(true)
        expect(r.change).toBe(0)
        expect(Number.isFinite(r.change)).toBe(true)
        expect(r.label).toBe('0.0%')
    })

    it('handles a trend with null change', () => {
        const r = AnalyticsService.normalizeTrend({ success: true, data: { trend: 'stable', change: null } })
        expect(r.available).toBe(true)
        expect(r.change).toBe(0)
        expect(r.label).toBe('0.0%')
    })

    it('handles a trend with NaN change', () => {
        const r = AnalyticsService.normalizeTrend({ success: true, data: { trend: 'stable', change: NaN } })
        expect(r.available).toBe(true)
        expect(Number.isFinite(r.change)).toBe(true)
        expect(r.change).toBe(0)
        expect(r.label).toBe('0.0%')
    })

    it('formats a positive change with a + sign', () => {
        const r = AnalyticsService.normalizeTrend({ success: true, data: { trend: 'increasing', change: 42.5 } })
        expect(r.available).toBe(true)
        expect(r.sign).toBe('+')
        expect(r.label).toBe('+42.5%')
        expect(r.icon).toBe('📈')
    })

    it('formats a negative change without an explicit - sign (number keeps it)', () => {
        const r = AnalyticsService.normalizeTrend({ success: true, data: { trend: 'decreasing', change: -12.3 } })
        expect(r.available).toBe(true)
        expect(r.sign).toBe('')
        expect(r.label).toBe('-12.3%')
        expect(r.icon).toBe('📉')
    })

    it('renders the message from the trend when present', () => {
        const r = AnalyticsService.normalizeTrend({
            success: true,
            data: { trend: 'increasing', change: 15, message: 'Pendapatan meningkat' },
        })
        expect(r.message).toBe('Pendapatan meningkat')
    })

    it('falls back to a default message when message is absent', () => {
        const r = AnalyticsService.normalizeTrend({ success: true, data: { trend: 'stable', change: 0 } })
        expect(r.message).toBeTruthy()
    })
})

describe('F-06: rendering safety — label never calls toFixed on undefined', () => {
    it('the label is always a string, regardless of input', () => {
        const inputs = [
            null,
            undefined,
            { success: false },
            { success: true, data: {} },
            { success: true, data: { change: null } },
            { success: true, data: { change: NaN } },
            { success: true, data: { change: 5 } },
        ]
        for (const input of inputs) {
            const r = AnalyticsService.normalizeTrend(input)
            expect(typeof r.label).toBe('string')
            expect(typeof r.message).toBe('string')
            expect(Number.isFinite(r.change)).toBe(true)
        }
    })
})
