-- Fix Payment Settings Table
-- This script ensures the payment_settings table has the correct structure

-- First, check if the table exists and drop it if needed to recreate cleanly
DROP TABLE IF EXISTS payment_settings CASCADE;

-- Recreate the payment_settings table with correct structure
CREATE TABLE payment_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL UNIQUE,
    paypal_email VARCHAR(255),
    paypal_client_id VARCHAR(255),
    cashapp_cashtag VARCHAR(100),
    payment_methods_enabled JSONB DEFAULT '{"paypal": false, "cashapp": false}'::jsonb,
    platform_fee_percentage DECIMAL(5,2) DEFAULT 5.00,
    platform_paypal_email VARCHAR(255) DEFAULT 'constructivedesignsinc@mail.com',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_payment_settings_business_id ON payment_settings(business_id);

-- Enable Row Level Security
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Users can insert payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Users can update payment settings" ON payment_settings;

-- Create RLS policies
CREATE POLICY "Users can view payment settings" ON payment_settings 
    FOR SELECT 
    USING (
        business_id IN (
            SELECT business_id FROM user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert payment settings" ON payment_settings 
    FOR INSERT 
    WITH CHECK (
        business_id IN (
            SELECT business_id FROM user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update payment settings" ON payment_settings 
    FOR UPDATE 
    USING (
        business_id IN (
            SELECT business_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_payment_settings_updated_at ON payment_settings;
CREATE TRIGGER handle_payment_settings_updated_at 
    BEFORE UPDATE ON payment_settings 
    FOR EACH ROW 
    EXECUTE PROCEDURE handle_updated_at();

-- Grant necessary permissions
GRANT ALL ON payment_settings TO authenticated;
GRANT ALL ON payment_settings TO service_role;

-- Refresh the schema cache (this command tells Postgrest to reload)
NOTIFY pgrst, 'reload schema';

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_settings'
ORDER BY ordinal_position;
