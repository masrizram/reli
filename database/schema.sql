-- RELI Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Create daily_records table
CREATE TABLE IF NOT EXISTS daily_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    platforms JSONB NOT NULL DEFAULT '{}',
    fuel JSONB NOT NULL DEFAULT '{}',
    additional_costs JSONB NOT NULL DEFAULT '{}',
    results JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster date queries
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(date);
CREATE INDEX IF NOT EXISTS idx_daily_records_created_at ON daily_records(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on daily_records" ON daily_records
    FOR ALL USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_daily_records_updated_at 
    BEFORE UPDATE ON daily_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO daily_records (date, platforms, fuel, additional_costs, results) VALUES
(
    '2025-01-06',
    '{"grab": {"topup": 0, "sisa": 0, "kotor": 333300}, "maxim": {"topup": 0, "sisa": 0, "kotor": 230600}, "gojek": {"topup": 0, "sisa": 0, "kotor": 0}, "indrive": {"topup": 0, "sisa": 0, "kotor": 0}}',
    '{"jarak": 286.6, "konsumsi": 13.5, "harga": 10000, "literTerpakai": 21.2296, "biayaBBM": 212296}',
    '{"parkir": 0, "makan": 50000, "kuota": 0, "tol": 200000, "lainnya": 0, "total": 250000}',
    '{"totalKotor": 563900, "biayaBBM": 212296, "totalAdditionalCosts": 250000, "pendapatanBersih": 101604}'
) ON CONFLICT (date) DO NOTHING;

-- Create view for analytics (optional)
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