/**
 * D2 tests: debounce utility.
 *
 * Verifies rapid changes collapse into one save, the latest state is
 * persisted, the timer resets on a later call, explicit flush prevents a
 * duplicate delayed save, and cancel drops a pending call. Uses fake timers
 * so timing is deterministic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce } from '../src/utils/debounce.js'

describe('debounce — basic behavior', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.restoreAllMocks())

    it('does not invoke fn immediately', () => {
        const fn = vi.fn()
        const d = debounce(fn, 500)
        d()
        expect(fn).not.toHaveBeenCalled()
    })

    it('invokes fn once after the wait elapses', () => {
        const fn = vi.fn()
        const d = debounce(fn, 500)
        d()
        vi.advanceTimersByTime(500)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('collapses rapid calls into a single invocation', () => {
        const fn = vi.fn()
        const d = debounce(fn, 500)
        d()
        d()
        d()
        vi.advanceTimersByTime(500)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('persists the latest arguments, not the first', () => {
        const fn = vi.fn()
        const d = debounce(fn, 500)
        d('a')
        d('b')
        d('c')
        vi.advanceTimersByTime(500)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith('c')
    })

    it('resets the timer when called again before wait elapses', () => {
        const fn = vi.fn()
        const d = debounce(fn, 500)
        d()
        vi.advanceTimersByTime(400) // not yet
        expect(fn).not.toHaveBeenCalled()
        d() // resets timer
        vi.advanceTimersByTime(400) // still not yet (reset)
        expect(fn).not.toHaveBeenCalled()
        vi.advanceTimersByTime(100) // now 500 since the last call
        expect(fn).toHaveBeenCalledTimes(1)
    })
})

describe('debounce — flush (explicit save)', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.restoreAllMocks())

    it('flush invokes the pending call immediately with latest args', () => {
        const fn = vi.fn()
        const d = debounce(fn, 500)
        d('first')
        d('second')
        d.flush()
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith('second')
    })

    it('flush prevents the delayed duplicate from firing later', () => {
        const fn = vi.fn()
        const d = debounce(fn, 500)
        d('x')
        d.flush()
        expect(fn).toHaveBeenCalledTimes(1)
        vi.advanceTimersByTime(1000)
        expect(fn).toHaveBeenCalledTimes(1) // no duplicate
    })

    it('flush is a no-op when nothing is pending', () => {
        const fn = vi.fn()
        const d = debounce(fn, 500)
        expect(d.flush()).toBe(false)
        expect(fn).not.toHaveBeenCalled()
    })

    it('flush returns true when a pending call was flushed', () => {
        const fn = vi.fn()
        const d = debounce(fn, 500)
        d('x')
        expect(d.flush()).toBe(true)
    })
})

describe('debounce — cancel', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.restoreAllMocks())

    it('cancel drops a pending call so it never fires', () => {
        const fn = vi.fn()
        const d = debounce(fn, 500)
        d('x')
        d.cancel()
        vi.advanceTimersByTime(1000)
        expect(fn).not.toHaveBeenCalled()
    })

    it('cancel clears pending() state', () => {
        const fn = vi.fn()
        const d = debounce(fn, 500)
        d('x')
        expect(d.pending()).toBe(true)
        d.cancel()
        expect(d.pending()).toBe(false)
    })
})

describe('debounce — pending()', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.restoreAllMocks())

    it('is false before any call', () => {
        const d = debounce(vi.fn(), 500)
        expect(d.pending()).toBe(false)
    })

    it('is true while a call is scheduled', () => {
        const d = debounce(vi.fn(), 500)
        d()
        expect(d.pending()).toBe(true)
    })

    it('is false after the wait elapses', () => {
        const d = debounce(vi.fn(), 500)
        d()
        vi.advanceTimersByTime(500)
        expect(d.pending()).toBe(false)
    })
})

describe('debounce — async fn does not throw synchronously', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.restoreAllMocks())

    it('awaits an async function without throwing the caller', async () => {
        const fn = vi.fn(async () => 42)
        const d = debounce(fn, 500)
        d()
        vi.advanceTimersByTime(500)
        // Flush microtasks so the async fn settles.
        await Promise.resolve()
        await Promise.resolve()
        expect(fn).toHaveBeenCalledTimes(1)
    })
})
