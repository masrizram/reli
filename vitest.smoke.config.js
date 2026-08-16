import { defineConfig } from 'vitest/config'

// Smoke tests run AFTER `npm run build` and verify the dist/ artifacts only.
export default defineConfig({
    test: {
        environment: 'node',
        globals: false,
        include: ['tests/build-smoke.test.js'],
    },
})
