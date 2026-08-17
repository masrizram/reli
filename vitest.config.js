import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: false,
        include: ['tests/**/*.test.js'],
        // Build-smoke tests require dist/ to exist. They are excluded from the
        // default `npm test` run and invoked explicitly via `npm run test:smoke`
        // which passes --testNamePattern-friendly include; here we keep them out
        // of the default suite so `npm test` doesn't fail on a fresh checkout
        // before `npm run build` has run.
        exclude: ['tests/build-smoke.test.js'],
        coverage: {
            reporter: ['text', 'html'],
            include: [
                'src/utils/calc.js',
                'src/services/**/*.js',
                'src/utils/export.js',
                'src/utils/debounce.js',
                'src/utils/records.js',
            ],
        },
    },
})
