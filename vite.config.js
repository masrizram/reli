import { defineConfig } from 'vite'

export default defineConfig({
    base: '/',
    css: {
        postcss: './postcss.config.js',
    },
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
