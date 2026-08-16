# RELI Database Setup

## Supabase Configuration

### 1. Database Setup

1. Login to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to SQL Editor
3. Run the SQL script from `schema.sql`

### 2. Connection Details

> **WARNING**: Never commit real database credentials to source control.
> Supabase URL and anon key are injected at build time from environment
> variables (see `.env.example`). The database password must be stored only
> in your secret manager / hosting provider's environment variables.

- **Project URL**: set via `VITE_SUPABASE_URL`
- **Anon Key**: set via `VITE_SUPABASE_ANON_KEY` (public anon key, safe for client use under RLS)
- **Database Password**: stored only in the Supabase dashboard / secret manager — never in this repo.

### 3. Table Structure

#### daily_records

- `id` (UUID, Primary Key)
- `user_id` (UUID) — **owner** of the record, populated from the authenticated session (`auth.uid()`)
- `date` (DATE, unique per user)
- `platforms` (JSONB) - Platform earnings data
- `fuel` (JSONB) - Fuel consumption data
- `additional_costs` (JSONB) - Additional costs data
- `results` (JSONB) - Calculated results
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 4. Security Model (Row Level Security)

RELI is a single-user personal earnings tracker. Every row in
`daily_records` belongs to exactly one Supabase Auth user, enforced by RLS:

- `user_id` is populated from `auth.uid()` and is `NOT NULL`.
- Policies allow `SELECT`, `INSERT`, `UPDATE`, and `DELETE` **only** when
  `auth.uid() = user_id`.
- Anonymous (unauthenticated) requests are denied for all operations —
  the public anon key in the client bundle cannot read or mutate any row.

**Before enabling cloud sync you must:**

1. Enable Supabase Auth in the dashboard (email/password or magic link).
2. Sign in from the application so an authenticated session exists.
3. All daily_records operations are then scoped to the signed-in user.

Until Auth is enabled, the application runs in local-storage-only mode
(Supabase not configured / no session), which is the default safe behavior.

### 5. Features

- ✅ **Hybrid Storage**: Database + localStorage backup
- ✅ **Offline Support**: Works without internet
- ✅ **Auto Sync**: Syncs local data to database
- ✅ **Real-time Status**: Shows online/offline and database status
- ✅ **Data Migration**: Can sync existing localStorage data
- ✅ **Per-User Isolation**: RLS prevents cross-user data access

### 6. Usage

1. **Online Mode**: Data saved to both database and localStorage
2. **Offline Mode**: Data saved to localStorage only
3. **Sync**: Manual sync button to upload local data to database
4. **Toggle**: Can switch between database and localStorage-only mode

### 7. Security

- Row Level Security (RLS) enabled with per-user ownership policies
- API key is public (anon key) - safe for client-side use under RLS
- Anonymous access denied; requires Supabase Auth session for cloud CRUD
