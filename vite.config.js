import { defineConfig } from 'vite'

export default defineConfig({
    base: process.env.NODE_ENV === 'production' ? '/reli/' : '/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
    },
    server: {
        port: 3000,
    },
})
