# RELI Database Setup

## Supabase Configuration

### 1. Database Setup

1. Login ke [Supabase Dashboard](https://supabase.com/dashboard/project/jgkgrjkjpokofgyroxvr)
2. Go to SQL Editor
3. Run the SQL script from `schema.sql`

### 2. Connection Details

- **Project URL**: https://jgkgrjkjpokofgyroxvr.supabase.co
- **API Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2dyamtqcG9rb2ZneXJveHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NTk5ODYsImV4cCI6MjA3MDAzNTk4Nn0.OFXaPpJv_YJVU7FTfjfz9elOD7_IBq9oJHPnwz2p6dY
- **Password**: JQMVPGRRjPe30rmA

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
