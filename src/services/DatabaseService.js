/**
 * Database Service
 * Handles all database operations for RELI application
 */

import { supabase, TABLES } from '../config/supabase.js'

export class DatabaseService {
    /**
     * Save daily record to database
     * @param {Object} data - Daily record data
     * @param {string} date - Date in YYYY-MM-DD format
     */
    async saveDailyRecord(data, date) {
        try {
            const record = {
                date: date,
                platforms: data.platforms,
                fuel: data.fuel,
                additional_costs: data.additionalCosts,
                results: data.results,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }

            // Check if record exists
            const { data: existing } = await supabase.from(TABLES.DAILY_RECORDS).select('id').eq('date', date).single()

            let result
            if (existing) {
                // Update existing record
                result = await supabase
                    .from(TABLES.DAILY_RECORDS)
                    .update({
                        ...record,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('date', date)
            } else {
                // Insert new record
                result = await supabase.from(TABLES.DAILY_RECORDS).insert([record])
            }

            if (result.error) {
                throw result.error
            }

            console.log('✅ Data saved to database:', date)
            return { success: true, data: result.data }
        } catch (error) {
            console.error('❌ Error saving to database:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Load daily record from database
     * @param {string} date - Date in YYYY-MM-DD format
     */
    async loadDailyRecord(date) {
        try {
            const { data, error } = await supabase.from(TABLES.DAILY_RECORDS).select('*').eq('date', date).single()

            if (error && error.code !== 'PGRST116') {
                // PGRST116 = no rows returned
                throw error
            }

            if (data) {
                // console.log('✅ Data loaded from database:', date)
                return {
                    success: true,
                    data: {
                        platforms: data.platforms,
                        fuel: data.fuel,
                        additionalCosts: data.additional_costs,
                        results: data.results,
                    },
                }
            } else {
                return { success: false, error: 'No data found for this date' }
            }
        } catch (error) {
            console.error('❌ Error loading from database:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Get all daily records for analytics
     * @param {number} limit - Number of records to fetch
     */
    async getAllDailyRecords(limit = 30) {
        try {
            const { data, error } = await supabase
                .from(TABLES.DAILY_RECORDS)
                .select('*')
                .order('date', { ascending: false })
                .limit(limit)

            if (error) {
                throw error
            }

            console.log(`✅ Loaded ${data.length} records from database`)
            return { success: true, data }
        } catch (error) {
            console.error('❌ Error loading records:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Delete daily record
     * @param {string} date - Date in YYYY-MM-DD format
     */
    async deleteDailyRecord(date) {
        try {
            const { error } = await supabase.from(TABLES.DAILY_RECORDS).delete().eq('date', date)

            if (error) {
                throw error
            }

            console.log('✅ Record deleted from database:', date)
            return { success: true }
        } catch (error) {
            console.error('❌ Error deleting record:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Get statistics for dashboard
     */
    async getStatistics() {
        try {
            const { data, error } = await supabase
                .from(TABLES.DAILY_RECORDS)
                .select('results, date')
                .order('date', { ascending: false })
                .limit(7) // Last 7 days

            if (error) {
                throw error
            }

            // Calculate statistics
            const stats = {
                totalDays: data.length,
                totalEarnings: data.reduce((sum, record) => sum + (record.results?.pendapatanBersih || 0), 0),
                averageEarnings: 0,
                bestDay: null,
                worstDay: null,
            }

            if (stats.totalDays > 0) {
                stats.averageEarnings = stats.totalEarnings / stats.totalDays

                // Find best and worst days
                const sortedByEarnings = data.sort(
                    (a, b) => (b.results?.pendapatanBersih || 0) - (a.results?.pendapatanBersih || 0)
                )
                stats.bestDay = sortedByEarnings[0]
                stats.worstDay = sortedByEarnings[sortedByEarnings.length - 1]
            }

            return { success: true, data: stats }
        } catch (error) {
            console.error('❌ Error getting statistics:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Sync local storage data to database
     */
    async syncLocalStorageToDatabase() {
        try {
            const localData = JSON.parse(localStorage.getItem('reli-data') || '{}')
            const syncResults = []

            for (const [date, dayData] of Object.entries(localData)) {
                const result = await this.saveDailyRecord(dayData, date)
                syncResults.push({ date, success: result.success })
            }

            const successCount = syncResults.filter(r => r.success).length
            console.log(`✅ Synced ${successCount}/${syncResults.length} records to database`)

            return {
                success: true,
                synced: successCount,
                total: syncResults.length,
                results: syncResults,
            }
        } catch (error) {
            console.error('❌ Error syncing to database:', error)
            return { success: false, error: error.message }
        }
    }
}

// Create singleton instance
export const databaseService = new DatabaseService()
