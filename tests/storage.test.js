import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StorageManager } from '../src/utils/storage.js'

// jsdom provides localStorage; clear it between tests so state is isolated.
describe('StorageManager', () => {
    let mgr

    beforeEach(() => {
        localStorage.clear()
        mgr = new StorageManager()
    })

    afterEach(() => {
        localStorage.clear()
        vi.restoreAllMocks()
    })

    it('initializes with a default structure containing metadata', () => {
        const data = mgr.getAllData()
        expect(data._meta).toBeDefined()
        expect(data.daily).toEqual({})
    })

    it("saves and retrieves today's data", () => {
        mgr.saveDaily({
            results: { totalKotor: 500000, pendapatanBersih: 300000 },
            fuel: { jarak: 120 },
        })
        const today = new Date().toISOString().split('T')[0]
        const data = mgr.getAllData()
        expect(data.daily[today]).toBeDefined()
        expect(data.daily[today].results.totalKotor).toBe(500000)
    })

    it('produces a valid CSV export with headers and rows', () => {
        mgr.saveDaily({ results: { totalKotor: 100000, pendapatanBersih: 60000 } })
        const csv = mgr.exportData('csv')
        const lines = csv.split('\n').filter(Boolean)
        expect(lines[0]).toContain('Tanggal')
        expect(lines[0]).toContain('Pendapatan Bersih')
        expect(lines.length).toBeGreaterThan(1)
    })

    it('produces valid JSON export', () => {
        mgr.saveDaily({ results: { totalKotor: 100 } })
        const json = mgr.exportData('json')
        const parsed = JSON.parse(json)
        expect(parsed._meta).toBeDefined()
        expect(parsed.daily).toBeDefined()
    })

    it('throws on unsupported export format', () => {
        expect(() => mgr.exportData('xml')).toThrow(/Unsupported export format/)
    })

    it('keeps only the last 5 backups', () => {
        // Create 7 backups
        for (let i = 0; i < 7; i++) {
            mgr.saveDaily({ results: { totalKotor: i * 10 } })
            mgr.createBackup()
        }
        const backups = mgr.getBackups()
        expect(Object.keys(backups).length).toBeLessThanOrEqual(5)
    })

    it('restoreFromBackup throws on unknown backup id', () => {
        expect(() => mgr.restoreFromBackup('nope')).toThrow(/Backup not found/)
    })

    it('cleanupOldData trims to the last 30 days', () => {
        // Insert 40 days of data
        const base = new Date('2024-01-01')
        for (let i = 0; i < 40; i++) {
            const d = new Date(base)
            d.setDate(d.getDate() + i)
            const key = d.toISOString().split('T')[0]
            const all = mgr.getAllData()
            all.daily[key] = { results: { totalKotor: i } }
            all._meta = { ...all._meta, lastModified: new Date().toISOString() }
            localStorage.setItem(mgr.storageKey, JSON.stringify(all))
        }
        mgr.cleanupOldData()
        const data = mgr.getAllData()
        expect(Object.keys(data.daily).length).toBe(30)
    })
})
