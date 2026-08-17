/**
 * Debounce utility — delays invoking `fn` until `wait` ms have elapsed since
 * the last call. Later calls reset the timer so rapid changes collapse into a
 * single trailing invocation with the latest arguments.
 *
 * Returns a debounced function plus a `.flush()` method that immediately
 * invokes any pending call (used by explicit "Save now" to avoid a duplicate
 * delayed save) and a `.cancel()` method that drops a pending call.
 *
 * Designed for D2 (debounced auto-save): multiple rapid input changes produce
 * a single persistence operation, and an explicit save flushes the pending
 * debounce so the latest state is never lost and never double-persisted.
 *
 * The debounced function returns undefined (fire-and-forget); callers that
 * need the result should call the original function directly.
 *
 * @param {Function} fn  - function to debounce (may be async).
 * @param {number} wait  - delay in milliseconds.
 * @returns {Function} debounced, with `.flush()` and `.cancel()` attached.
 */
export function debounce(fn, wait = 500) {
    let timer = null
    let lastArgs = null
    let lastThis = null
    let pending = false

    function run() {
        pending = false
        timer = null
        const args = lastArgs
        const ctx = lastThis
        lastArgs = null
        lastThis = null
        return fn.apply(ctx, args)
    }

    function debounced(...args) {
        lastArgs = args
        lastThis = this
        pending = true
        if (timer) clearTimeout(timer)
        timer = setTimeout(run, wait)
    }

    // Immediately invoke the pending call (if any) and clear the timer.
    // Used by explicit "Save now" to guarantee the latest state persists
    // immediately and no delayed duplicate save fires afterward.
    debounced.flush = function flush() {
        if (!pending) return false
        if (timer) {
            clearTimeout(timer)
            timer = null
        }
        const hadPending = pending
        run()
        return hadPending
    }

    // Drop a pending call without invoking it. Used on navigation teardown
    // when the caller has already persisted state explicitly.
    debounced.cancel = function cancel() {
        if (timer) {
            clearTimeout(timer)
            timer = null
        }
        pending = false
        lastArgs = null
        lastThis = null
    }

    // Whether a debounced invocation is currently scheduled.
    debounced.pending = function () {
        return pending
    }

    return debounced
}
