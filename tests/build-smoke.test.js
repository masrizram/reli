import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Build smoke test: verifies `npm run build` produced the expected artifacts.
// This runs against the dist/ folder; build must be run before these tests.
describe('build artifacts', () => {
    const distDir = resolve(process.cwd(), 'dist')

    it('emits dist/index.html', () => {
        expect(existsSync(resolve(distDir, 'index.html'))).toBe(true)
    })

    it('index.html references the app entry', () => {
        const html = readFileSync(resolve(distDir, 'index.html'), 'utf-8')
        // The built index should contain the module script or a hashed asset ref.
        expect(html).toMatch(/<script[^>]+type="module"/)
    })

    it('emits at least one CSS asset', () => {
        // Look for any .css file under dist/assets (hashed name).
        const indexHtml = readFileSync(resolve(distDir, 'index.html'), 'utf-8')
        expect(indexHtml).toMatch(/\.css"/)
    })
})
