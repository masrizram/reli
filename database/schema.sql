-- RELI Database Schema for Supabase
--
-- Source of truth for the RELI cloud database.
--
-- SECURITY MODEL
-- --------------
-- RELI uses Supabase Auth + Row Level Security (RLS).
--
-- Every daily_records row belongs to exactly one authenticated user.
--
-- Anonymous requests are denied because auth.uid() is NULL and therefore
-- cannot match a non-null user_id.
--
-- Required application configuration:
--   VITE_SUPABASE_URL
--   VITE_SUPABASE_ANON_KEY
--
-- Authentication must be established before cloud CRUD is available.
-- The application may fall back to localStorage when Supabase/Auth is
-- unavailable.


-- ============================================================
-- TABLE: daily_records
-- ============================================================

CREATE TABLE IF NOT EXISTS public.daily_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    user_id UUID NOT NULL DEFAULT auth.uid(),

    date DATE NOT NULL,

    platforms JSONB NOT NULL DEFAULT '{}',

    fuel JSONB NOT NULL DEFAULT '{}',

    additional_costs JSONB NOT NULL DEFAULT '{}',

    results JSONB NOT NULL DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- CONSTRAINTS / UNIQUENESS
-- ============================================================
--
-- A user can have at most one daily record for a given date.
--
-- IMPORTANT:
-- Do NOT use UNIQUE(date) because that would incorrectly prevent
-- different users from having records for the same date.
--

DROP INDEX IF EXISTS public.idx_daily_records_date;

ALTER TABLE public.daily_records
DROP CONSTRAINT IF EXISTS daily_records_date_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_records_user_date
    ON public.daily_records (user_id, date);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_daily_records_user
    ON public.daily_records (user_id);

CREATE INDEX IF NOT EXISTS idx_daily_records_created_at
    ON public.daily_records (created_at);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- LEGACY POLICY CLEANUP
-- ============================================================

DROP POLICY IF EXISTS "Allow all operations on daily_records"
    ON public.daily_records;

DROP POLICY IF EXISTS "owner_can_select"
    ON public.daily_records;

DROP POLICY IF EXISTS "owner_can_insert"
    ON public.daily_records;

DROP POLICY IF EXISTS "owner_can_update"
    ON public.daily_records;

DROP POLICY IF EXISTS "owner_can_delete"
    ON public.daily_records;


-- ============================================================
-- SELECT POLICY
-- ============================================================
--
-- SELECT policies use USING.
-- WITH CHECK is NOT valid for SELECT.
--

CREATE POLICY "owner_can_select"
ON public.daily_records
FOR SELECT
USING (
    auth.uid() = user_id
);


-- ============================================================
-- INSERT POLICY
-- ============================================================
--
-- INSERT policies use WITH CHECK.
--

CREATE POLICY "owner_can_insert"
ON public.daily_records
FOR INSERT
WITH CHECK (
    auth.uid() = user_id
);


-- ============================================================
-- UPDATE POLICY
-- ============================================================
--
-- USING:
--   controls which existing rows may be updated.
--
-- WITH CHECK:
--   controls what the updated row is allowed to become.
--

CREATE POLICY "owner_can_update"
ON public.daily_records
FOR UPDATE
USING (
    auth.uid() = user_id
)
WITH CHECK (
    auth.uid() = user_id
);


-- ============================================================
-- DELETE POLICY
-- ============================================================
--
-- DELETE policies use USING.
-- WITH CHECK is NOT valid for DELETE.
--

CREATE POLICY "owner_can_delete"
ON public.daily_records
FOR DELETE
USING (
    auth.uid() = user_id
);


-- ============================================================
-- FUNCTION: update_updated_at_column
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();

    RETURN NEW;
END;
$$;


-- ============================================================
-- TRIGGER: daily_records.updated_at
-- ============================================================

DROP TRIGGER IF EXISTS update_daily_records_updated_at
    ON public.daily_records;

CREATE TRIGGER update_daily_records_updated_at
    BEFORE UPDATE ON public.daily_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- VIEW: daily_summary
-- ============================================================
--
-- security_invoker = true ensures the view executes using the
-- privileges/RLS context of the querying user rather than becoming
-- an unintended privilege boundary.
--

CREATE OR REPLACE VIEW public.daily_summary
WITH (security_invoker = true)
AS
SELECT
    date,

    (results->>'totalKotor')::numeric
        AS total_kotor,

    (results->>'biayaBBM')::numeric
        AS biaya_bbm,

    (results->>'totalAdditionalCosts')::numeric
        AS biaya_tambahan,

    (results->>'pendapatanBersih')::numeric
        AS pendapatan_bersih,

    (fuel->>'jarak')::numeric
        AS jarak_tempuh,

    (fuel->>'literTerpakai')::numeric
        AS liter_terpakai,

    created_at,

    updated_at

FROM public.daily_records

ORDER BY date DESC;