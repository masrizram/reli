/**
 * Supabase Configuration
 * Database connection setup for RELI application.
 *
 * Credentials are injected at build time from environment variables:
 *   - VITE_SUPABASE_URL
 *   - VITE_SUPABASE_ANON_KEY
 *
 * The anon key is designed to be public and is safe to ship in the client
 * bundle PROVIDED Row Level Security (RLS) policies are correctly configured
 * on the database (see database/schema.sql). Never ship the service_role
 * key or the database password in client code.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || ''

// Fail fast with an actionable message if mandatory configuration is missing.
// The app gracefully degrades to localStorage-only mode when Supabase is not
// configured, but developers must know *why* rather than debugging silently.
if (!supabaseUrl || !supabaseKey) {
    console.warn(
        '[RELI] Supabase credentials not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
            'Application will run in local-storage-only mode. ' +
            'Copy .env.example to .env.local and fill in your Supabase project details to enable cloud sync.'
    )
}

// Only create the client when both values are present. When absent, `supabase`
// is null and DatabaseService must guard against it (fail closed to local mode).
export const supabase =
    supabaseUrl && supabaseKey
        ? createClient(supabaseUrl, supabaseKey, {
              auth: {
                  autoRefreshToken: true,
                  persistSession: true,
                  detectSessionInUrl: false,
              },
          })
        : null

// Whether Supabase is available for use. Services should check this before
// attempting any network call so offline / unconfigured installs degrade
// gracefully instead of throwing.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

// Database table names
export const TABLES = {
    DAILY_RECORDS: 'daily_records',
}

// Test connection — resolves to true only when Supabase is configured AND the
// round-trip succeeds. Never throws; callers receive a boolean.
export async function testConnection() {
    if (!supabase || !isSupabaseConfigured) {
        return false
    }
    try {
        const { error } = await supabase.from(TABLES.DAILY_RECORDS).select('count', { count: 'exact', head: true })
        if (error) {
            console.warn('[RELI] Supabase connection check failed:', error.message)
            return false
        }
        return true
    } catch (error) {
        console.warn('[RELI] Supabase connection check threw:', error?.message || error)
        return false
    }
}
