-- Fix Payment Settings Table - Add missing business_id column
-- Run this in Supabase SQL Editor

-- Check if business_id column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_settings' 
        AND column_name = 'business_id'
    ) THEN
        -- Add business_id column
        ALTER TABLE payment_settings 
        ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
        
        -- Add UNIQUE constraint
        ALTER TABLE payment_settings 
        ADD CONSTRAINT payment_settings_business_id_unique UNIQUE (business_id);
        
        -- Create index for faster lookups
        CREATE INDEX idx_payment_settings_business_id ON payment_settings(business_id);
        
        RAISE NOTICE 'Added business_id column to payment_settings table';
    ELSE
        RAISE NOTICE 'business_id column already exists in payment_settings table';
    END IF;
END $$;

-- Make business_id NOT NULL (after adding it)
DO $$ 
BEGIN
    -- Only set NOT NULL if column exists and has no NULL values
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_settings' 
        AND column_name = 'business_id'
        AND is_nullable = 'YES'
    ) THEN
        -- First, update any NULL values with a default (optional - remove if not needed)
        -- UPDATE payment_settings SET business_id = (SELECT id FROM businesses LIMIT 1) WHERE business_id IS NULL;
        
        -- Then add NOT NULL constraint
        ALTER TABLE payment_settings 
        ALTER COLUMN business_id SET NOT NULL;
        
        RAISE NOTICE 'Set business_id to NOT NULL';
    END IF;
END $$;

-- Enable Row Level Security if not already enabled
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS "Users can view payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Users can insert payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Users can update payment settings" ON payment_settings;

-- Create RLS policies using business_id
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

-- Grant necessary permissions
GRANT ALL ON payment_settings TO authenticated;
GRANT ALL ON payment_settings TO service_role;

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
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'payment_settings';
