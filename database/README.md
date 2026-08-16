# RELI Database Setup

## Supabase Configuration

### 1. Database Setup

1. Login ke [Supabase Dashboard](https://supabase.com/dashboard/project/jgkgrjkjpokofgyroxvr)
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
- `date` (DATE, Unique)
- `platforms` (JSONB) - Platform earnings data
- `fuel` (JSONB) - Fuel consumption data
- `additional_costs` (JSONB) - Additional costs data
- `results` (JSONB) - Calculated results
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 4. Features

- ✅ **Hybrid Storage**: Database + localStorage backup
- ✅ **Offline Support**: Works without internet
- ✅ **Auto Sync**: Syncs local data to database
- ✅ **Real-time Status**: Shows online/offline and database status
- ✅ **Data Migration**: Can sync existing localStorage data

### 5. Usage

1. **Online Mode**: Data saved to both database and localStorage
2. **Offline Mode**: Data saved to localStorage only
3. **Sync**: Manual sync button to upload local data to database
4. **Toggle**: Can switch between database and localStorage-only mode

### 6. Security

- Row Level Security (RLS) enabled
- API key is public (anon key) - safe for client-side use
- Can be restricted later with user authentication
