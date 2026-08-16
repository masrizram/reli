/**
 * Database Service
 * Handles all Supabase persistence operations for RELI.
 *
 * When Supabase is not configured (`supabase === null`), every method fails
 * closed to "not available" so the application falls back to localStorage.
 * Callers receive `{ success: false, error }` and never crash.
 */

import { supabase, isSupabaseConfigured, TABLES } from '../config/supabase.js'

// PostgREST / Supabase error codes that indicate the request was rejected by
// RLS or because no authenticated session exists. When these surface we want
// callers to degrade to localStorage rather than crash, and to log a clear,
// actionable reason.
const RLS_DENIED_PATTERNS = ['42501', 'PGRST301', 'permission denied', 'row-level security']

function isRlsDenied(error) {
    if (!error) return false
    const code = String(error.code || '')
    const message = String(error.message || '')
    return RLS_DENIED_PATTERNS.some(p => code === p || message.toLowerCase().includes(p.toLowerCase()))
}

export class DatabaseService {
    _available() {
        return isSupabaseConfigured && supabase !== null
    }

    /**
     * Save (upsert) a daily record keyed by date.
     * @param {Object} data - Daily record data
     * @param {string} date - Date in YYYY-MM-DD format
     */
    async saveDailyRecord(data, date) {
        if (!this._available()) {
            return { success: false, error: 'Supabase not configured' }
        }
        try {
            const record = {
                date,
                platforms: data.platforms,
                fuel: data.fuel,
                additional_costs: data.additionalCosts,
                results: data.results,
            }

            // Check if record exists, then update or insert.
            // Using upsert would be ideal, but we keep the explicit select+update
            // path so partial-network failures don't silently overwrite fields.
            // RLS scopes all queries to the authenticated user; without a session
            // the select returns nothing and the insert is denied by policy.
            const { data: existing, error: selectError } = await supabase
                .from(TABLES.DAILY_RECORDS)
                .select('id')
                .eq('date', date)
                .maybeSingle()

            if (selectError && selectError.code !== 'PGRST116') {
                throw selectError
            }

            let result
            if (existing) {
                result = await supabase.from(TABLES.DAILY_RECORDS).update(record).eq('date', date)
            } else {
                result = await supabase.from(TABLES.DAILY_RECORDS).insert([record])
            }

            if (result.error) {
                throw result.error
            }

            return { success: true, data: result.data }
        } catch (error) {
            if (isRlsDenied(error)) {
                console.warn(
                    '[RELI] Database write denied by RLS (no authenticated session). ' +
                        'Enable Supabase Auth and sign in to use cloud sync. Falling back to localStorage.'
                )
            } else {
                console.warn('[RELI] Error saving to database:', error?.message || error)
            }
            return { success: false, error: error?.message || 'Unknown error' }
        }
    }

    /**
     * Load a single daily record by date.
     * @param {string} date - Date in YYYY-MM-DD format
     */
    async loadDailyRecord(date) {
        if (!this._available()) {
            return { success: false, error: 'Supabase not configured' }
        }
        try {
            const { data, error } = await supabase.from(TABLES.DAILY_RECORDS).select('*').eq('date', date).maybeSingle()

            if (error && error.code !== 'PGRST116') {
                throw error
            }

            if (data) {
                return {
                    success: true,
                    data: {
                        platforms: data.platforms,
                        fuel: data.fuel,
                        additionalCosts: data.additional_costs,
                        results: data.results,
                    },
                }
            }
            return { success: false, error: 'No data found for this date' }
        } catch (error) {
            console.warn('[RELI] Error loading from database:', error?.message || error)
            return { success: false, error: error?.message || 'Unknown error' }
        }
    }

    /**
     * Get all daily records (most recent first).
     * @param {number} limit - Maximum records to fetch
     */
    async getAllDailyRecords(limit = 30) {
        if (!this._available()) {
            return { success: false, error: 'Supabase not configured' }
        }
        try {
            const { data, error } = await supabase
                .from(TABLES.DAILY_RECORDS)
                .select('*')
                .order('date', { ascending: false })
                .limit(limit)

            if (error) {
                throw error
            }

            return { success: true, data }
        } catch (error) {
            console.warn('[RELI] Error loading records:', error?.message || error)
            return { success: false, error: error?.message || 'Unknown error' }
        }
    }

    /**
     * Delete a daily record by date.
     * @param {string} date - Date in YYYY-MM-DD format
     */
    async deleteDailyRecord(date) {
        if (!this._available()) {
            return { success: false, error: 'Supabase not configured' }
        }
        try {
            const { error } = await supabase.from(TABLES.DAILY_RECORDS).delete().eq('date', date)
            if (error) {
                throw error
            }
            return { success: true }
        } catch (error) {
            console.warn('[RELI] Error deleting record:', error?.message || error)
            return { success: false, error: error?.message || 'Unknown error' }
        }
    }

    /**
     * Get statistics for the dashboard (last 7 days).
     */
    async getStatistics() {
        if (!this._available()) {
            return { success: false, error: 'Supabase not configured' }
        }
        try {
            const { data, error } = await supabase
                .from(TABLES.DAILY_RECORDS)
                .select('results, date')
                .order('date', { ascending: false })
                .limit(7)

            if (error) {
                throw error
            }

            const stats = {
                totalDays: data.length,
                totalEarnings: data.reduce((sum, r) => sum + (r.results?.pendapatanBersih || 0), 0),
                averageEarnings: 0,
                bestDay: null,
                worstDay: null,
            }

            if (stats.totalDays > 0) {
                stats.averageEarnings = stats.totalEarnings / stats.totalDays
                const sorted = [...data].sort(
                    (a, b) => (b.results?.pendapatanBersih || 0) - (a.results?.pendapatanBersih || 0)
                )
                stats.bestDay = sorted[0]
                stats.worstDay = sorted[sorted.length - 1]
            }

            return { success: true, data: stats }
        } catch (error) {
            console.warn('[RELI] Error getting statistics:', error?.message || error)
            return { success: false, error: error?.message || 'Unknown error' }
        }
    }

    /**
     * Sync all localStorage daily records to the database.
     */
    async syncLocalStorageToDatabase() {
        if (!this._available()) {
            return { success: false, error: 'Supabase not configured' }
        }
        try {
            const localData = JSON.parse(localStorage.getItem('reli-data') || '{}')
            const syncResults = []

            for (const [date, dayData] of Object.entries(localData)) {
                // Skip internal metadata keys that aren't daily records.
                if (date === '_meta' || !dayData || typeof dayData !== 'object' || !dayData.results) {
                    continue
                }
                const result = await this.saveDailyRecord(dayData, date)
                syncResults.push({ date, success: result.success })
            }

            const successCount = syncResults.filter(r => r.success).length
            return {
                success: true,
                synced: successCount,
                total: syncResults.length,
                results: syncResults,
            }
        } catch (error) {
            console.warn('[RELI] Error syncing to database:', error?.message || error)
            return { success: false, error: error?.message || 'Unknown error' }
        }
    }
}

// Singleton instance
export const databaseService = new DatabaseService()
