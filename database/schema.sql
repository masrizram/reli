-- RELI Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
--
-- SECURITY MODEL
-- --------------
-- RELI is a single-user personal earnings tracker. Each daily_records row
-- belongs to exactly one Supabase Auth user. Row Level Security (RLS)
-- enforces per-user ownership so that the public anon key (which ships in
-- the client bundle) can NEVER read or mutate another user's records.
--
-- Before this schema is usable for cloud sync you MUST:
--   1. Enable Supabase Auth (email/password or magic link) in the dashboard.
--   2. Sign in from the application so an authenticated session exists.
--   3. All policies below resolve auth.uid() against the session; an
--      anonymous (unauthenticated) request is DENIED for all operations.
--
-- If you run the app WITHOUT Supabase Auth enabled, the application
-- automatically falls back to local-storage-only mode (no cloud CRUD).

-- Create daily_records table
CREATE TABLE IF NOT EXISTS daily_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Owner of the record. Populated from the authenticated session so RLS
    -- can enforce per-user isolation. NOT NULL: a row without an owner is
    -- never allowed.
    user_id UUID NOT NULL DEFAULT auth.uid(),
    date DATE NOT NULL,
    platforms JSONB NOT NULL DEFAULT '{}',
    fuel JSONB NOT NULL DEFAULT '{}',
    additional_costs JSONB NOT NULL DEFAULT '{}',
    results JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A given user may have at most one record per date.
-- NOTE: the previous UNIQUE(date) constraint allowed any user to overwrite
-- another user's row; it is replaced by a composite unique constraint.
DROP INDEX IF EXISTS idx_daily_records_date;
ALTER TABLE daily_records DROP CONSTRAINT IF EXISTS daily_records_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_records_user_date
    ON daily_records (user_id, date);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_records_user ON daily_records(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_created_at ON daily_records(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;

-- Drop legacy permissive policy if it exists from a previous deploy.
DROP POLICY IF EXISTS "Allow all operations on daily_records" ON daily_records;

-- ---------------------------------------------------------------------------
-- Per-user ownership policies.
--
-- Each policy compares the row's user_id against the authenticated user.
-- auth.uid() returns NULL for anonymous requests, which never matches, so
-- anonymous access is denied by construction (NOT USING (true)).
-- ---------------------------------------------------------------------------

-- SELECT: a user can only read their own records.
CREATE POLICY "owner_can_select" ON daily_records
    FOR SELECT
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- INSERT: a user can only insert records they own. The default user_id
-- (auth.uid()) plus this CHECK prevents cross-user inserts.
CREATE POLICY "owner_can_insert" ON daily_records
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: a user can only update their own records, and cannot reassign
-- ownership to another user.
CREATE POLICY "owner_can_update" ON daily_records
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: a user can only delete their own records.
CREATE POLICY "owner_can_delete" ON daily_records
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Replace the legacy trigger so re-running this script is idempotent.
DROP TRIGGER IF EXISTS update_daily_records_updated_at ON daily_records;
CREATE TRIGGER update_daily_records_updated_at
    BEFORE UPDATE ON daily_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional). Owned by NULL user on fresh installs with
-- no auth; this row is invisible to all authenticated users because of RLS,
-- so it is safe to leave as a structural placeholder. Remove it for
-- production deployments owned by a real user.
INSERT INTO daily_records (user_id, date, platforms, fuel, additional_costs, results) VALUES
(
    auth.uid(),
    '2025-01-06',
    '{"grab": {"topup": 0, "sisa": 0, "kotor": 333300}, "maxim": {"topup": 0, "sisa": 0, "kotor": 230600}, "gojek": {"topup": 0, "sisa": 0, "kotor": 0}, "indrive": {"topup": 0, "sisa": 0, "kotor": 0}}',
    '{"jarak": 286.6, "konsumsi": 13.5, "harga": 10000, "literTerpakai": 21.2296, "biayaBBM": 212296}',
    '{"parkir": 0, "makan": 50000, "kuota": 0, "tol": 200000, "lainnya": 0, "total": 250000}',
    '{"totalKotor": 563900, "biayaBBM": 212296, "totalAdditionalCosts": 250000, "pendapatanBersih": 101604}'
)
ON CONFLICT (user_id, date) DO NOTHING;

-- Create view for analytics (optional). Only the owner's rows are visible
-- through RLS; the view itself adds no privilege bypass.
CREATE OR REPLACE VIEW daily_summary AS
SELECT
    date,
    (results->>'totalKotor')::numeric as total_kotor,
    (results->>'biayaBBM')::numeric as biaya_bbm,
    (results->>'totalAdditionalCosts')::numeric as biaya_tambahan,
    (results->>'pendapatanBersih')::numeric as pendapatan_bersih,
    (fuel->>'jarak')::numeric as jarak_tempuh,
    (fuel->>'literTerpakai')::numeric as liter_terpakai,
    created_at,
    updated_at
FROM daily_records
ORDER BY date DESC;
