/**
 * F-08 regression: hardened numeric coercion.
 *
 * toNumber must accept numbers and numeric strings (browser form inputs) and
 * reject everything else, returning 0. It must not silently convert arrays or
 * objects into a plausible-but-wrong number.
 */
import { describe, it, expect } from 'vitest'
import { toNumber } from '../src/utils/calc.js'

describe('F-08: toNumber accepted inputs', () => {
    it('accepts finite numbers', () => {
        expect(toNumber(0)).toBe(0)
        expect(toNumber(42)).toBe(42)
        expect(toNumber(-3.5)).toBe(-3.5)
        expect(toNumber(1e6)).toBe(1e6)
    })

    it('accepts numeric strings (browser form input)', () => {
        expect(toNumber('123')).toBe(123)
        expect(toNumber('123.45')).toBe(123.45)
        expect(toNumber('-7')).toBe(-7)
        expect(toNumber('+7')).toBe(7)
        expect(toNumber('1e3')).toBe(1000)
    })

    it('trims surrounding whitespace from numeric strings', () => {
        expect(toNumber('  42  ')).toBe(42)
        expect(toNumber('\t3.14\n')).toBeCloseTo(3.14, 5)
    })

    it('treats empty / whitespace-only strings as 0', () => {
        expect(toNumber('')).toBe(0)
        expect(toNumber('   ')).toBe(0)
    })

    it('treats null and undefined as 0', () => {
        expect(toNumber(null)).toBe(0)
        expect(toNumber(undefined)).toBe(0)
    })
})

describe('F-08: toNumber rejected inputs (return 0)', () => {
    it('rejects NaN and Infinity', () => {
        expect(toNumber(NaN)).toBe(0)
        expect(toNumber(Infinity)).toBe(0)
        expect(toNumber(-Infinity)).toBe(0)
    })

    it('rejects malformed numeric strings', () => {
        expect(toNumber('abc')).toBe(0)
        expect(toNumber('12abc')).toBe(0) // trailing garbage rejected
        expect(toNumber('abc12')).toBe(0)
        expect(toNumber('1.2.3')).toBe(0)
        expect(toNumber('--5')).toBe(0)
        expect(toNumber('')).toBe(0)
    })

    it('rejects arrays (no silent first-element coercion)', () => {
        expect(toNumber([1, 2])).toBe(0)
        expect(toNumber([42])).toBe(0)
        expect(toNumber([])).toBe(0)
    })

    it('rejects plain objects (even with valueOf)', () => {
        expect(toNumber({})).toBe(0)
        expect(toNumber({ valueOf: () => 5 })).toBe(0)
        expect(toNumber({ a: 1 })).toBe(0)
    })

    it('rejects functions and symbols', () => {
        expect(toNumber(() => 5)).toBe(0)
        expect(toNumber(Symbol('x'))).toBe(0)
    })

    it('rejects booleans', () => {
        expect(toNumber(true)).toBe(0)
        expect(toNumber(false)).toBe(0)
    })
})

describe('F-08: toNumber preserves browser form input behavior', () => {
    // Simulate the values an <input type="number"> produces via .value:
    //   - a numeric string when filled
    //   - '' when cleared by the user
    it('handles a filled number input', () => {
        const inputEl = { value: '250000' } // stand-in for DOM input.value
        expect(toNumber(inputEl.value)).toBe(250000)
    })
    it('handles a cleared number input as 0', () => {
        const inputEl = { value: '' }
        expect(toNumber(inputEl.value)).toBe(0)
    })
    it('handles a decimal number input', () => {
        const inputEl = { value: '0.5' }
        expect(toNumber(inputEl.value)).toBe(0.5)
    })
})
