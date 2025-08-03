import { defineConfig } from 'vite'

export default defineConfig({
    base: '/reli/',
    build: {
        outDir: 'dist',
    },
    server: {
        port: 3000,
    },
})
