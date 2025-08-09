/**
 * Supabase Configuration
 * Database connection setup for RELI application
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://jgkgrjkjpokofgyroxvr.supabase.co'
const supabaseKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2dyamtqcG9rb2ZneXJveHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NTk5ODYsImV4cCI6MjA3MDAzNTk4Nn0.OFXaPpJv_YJVU7FTfjfz9elOD7_IBq9oJHPnwz2p6dY'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})

// Database table names
export const TABLES = {
    DAILY_RECORDS: 'daily_records',
    PLATFORMS: 'platforms',
    FUEL_DATA: 'fuel_data',
    ADDITIONAL_COSTS: 'additional_costs',
}

// Test connection
export async function testConnection() {
    try {
        const { data, error } = await supabase.from('daily_records').select('count', { count: 'exact', head: true })

        if (error) {
            console.error('❌ Supabase connection error:', error)
            return false
        }

        // console.log('✅ Supabase connected successfully')
        return true
    } catch (error) {
        console.error('❌ Supabase connection failed:', error)
        return false
    }
}
