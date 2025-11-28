-- Complete Payment Settings Table Fix
-- This script will create or update the payment_settings table with all required columns
-- Run this in Supabase SQL Editor

-- First, let's check if the table exists, if not create it
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    paypal_email TEXT,
    cashapp_cashtag TEXT,
    payment_methods_enabled JSONB DEFAULT '{"paypal": false, "cashapp": false}'::jsonb,
    platform_fee_percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id)
);

-- Add business_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_settings' 
        AND column_name = 'business_id'
    ) THEN
        ALTER TABLE payment_settings 
        ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
        
        -- Add UNIQUE constraint
        ALTER TABLE payment_settings 
        ADD CONSTRAINT payment_settings_business_id_unique UNIQUE (business_id);
        
        RAISE NOTICE 'Added business_id column';
    END IF;
END $$;

-- Add paypal_email column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_settings' 
        AND column_name = 'paypal_email'
    ) THEN
        ALTER TABLE payment_settings 
        ADD COLUMN paypal_email TEXT;
        
        RAISE NOTICE 'Added paypal_email column';
    END IF;
END $$;

-- Add cashapp_cashtag column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_settings' 
        AND column_name = 'cashapp_cashtag'
    ) THEN
        ALTER TABLE payment_settings 
        ADD COLUMN cashapp_cashtag TEXT;
        
        RAISE NOTICE 'Added cashapp_cashtag column';
    END IF;
END $$;

-- Add payment_methods_enabled column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_settings' 
        AND column_name = 'payment_methods_enabled'
    ) THEN
        ALTER TABLE payment_settings 
        ADD COLUMN payment_methods_enabled JSONB DEFAULT '{"paypal": false, "cashapp": false}'::jsonb;
        
        RAISE NOTICE 'Added payment_methods_enabled column';
    END IF;
END $$;

-- Add platform_fee_percentage column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_settings' 
        AND column_name = 'platform_fee_percentage'
    ) THEN
        ALTER TABLE payment_settings 
        ADD COLUMN platform_fee_percentage DECIMAL(5,2) DEFAULT 0.00;
        
        RAISE NOTICE 'Added platform_fee_percentage column';
    END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_settings' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE payment_settings 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        
        RAISE NOTICE 'Added created_at column';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_settings' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE payment_settings 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- Create index on business_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'payment_settings'
        AND indexname = 'idx_payment_settings_business_id'
    ) THEN
        CREATE INDEX idx_payment_settings_business_id ON payment_settings(business_id);
        RAISE NOTICE 'Created index on business_id';
    END IF;
END $$;

-- Make business_id NOT NULL if it isn't already
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_settings' 
        AND column_name = 'business_id'
        AND is_nullable = 'YES'
    ) THEN
        -- First update any NULL values (optional - comment out if you don't want this)
        -- UPDATE payment_settings SET business_id = (SELECT id FROM businesses LIMIT 1) WHERE business_id IS NULL;
        
        -- Then set NOT NULL
        ALTER TABLE payment_settings 
        ALTER COLUMN business_id SET NOT NULL;
        
        RAISE NOTICE 'Set business_id to NOT NULL';
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their business payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Users can insert their business payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Users can update their business payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Users can delete their business payment settings" ON payment_settings;

-- Create RLS policies
CREATE POLICY "Users can view their business payment settings" 
ON payment_settings FOR SELECT 
USING (
    business_id IN (
        SELECT business_id FROM user_profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert their business payment settings" 
ON payment_settings FOR INSERT 
WITH CHECK (
    business_id IN (
        SELECT business_id FROM user_profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update their business payment settings" 
ON payment_settings FOR UPDATE 
USING (
    business_id IN (
        SELECT business_id FROM user_profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can delete their business payment settings" 
ON payment_settings FOR DELETE 
USING (
    business_id IN (
        SELECT business_id FROM user_profiles WHERE id = auth.uid()
    )
);

-- Grant necessary permissions
GRANT ALL ON payment_settings TO authenticated;
GRANT ALL ON payment_settings TO service_role;

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_payment_settings_updated_at ON payment_settings;
CREATE TRIGGER update_payment_settings_updated_at
    BEFORE UPDATE ON payment_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Refresh the PostgREST schema cache
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

-- Show current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'payment_settings';

-- Show sample query that should now work
SELECT 
    'Setup Complete! You can now query payment_settings with all columns:' as status,
    'business_id, paypal_email, cashapp_cashtag, payment_methods_enabled, platform_fee_percentage' as available_columns;
