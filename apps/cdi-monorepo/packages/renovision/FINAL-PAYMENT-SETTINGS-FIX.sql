-- COMPREHENSIVE PAYMENT SETTINGS FIX
-- Run this complete script to fix all payment settings issues

-- Step 1: Create payment_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    paypal_email VARCHAR(255),
    cashapp_cashtag VARCHAR(100),
    payment_methods_enabled JSONB DEFAULT '{"paypal": false, "cashapp": false}'::jsonb,
    platform_fee_percentage DECIMAL(5,2) DEFAULT 5.00,
    paypal_client_id TEXT,
    paypal_mode VARCHAR(20) DEFAULT 'sandbox' CHECK (paypal_mode IN ('sandbox', 'live')),
    paypal_api_enabled BOOLEAN DEFAULT false,
    stripe_publishable_key TEXT,
    stripe_enabled BOOLEAN DEFAULT false,
    currency VARCHAR(3) DEFAULT 'USD',
    notify_on_payment BOOLEAN DEFAULT true,
    auto_confirm_payments BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id)
);

-- Step 2: Enable RLS
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing policies
DROP POLICY IF EXISTS "payment_settings_select_policy" ON payment_settings;
DROP POLICY IF EXISTS "payment_settings_insert_policy" ON payment_settings;
DROP POLICY IF EXISTS "payment_settings_update_policy" ON payment_settings;
DROP POLICY IF EXISTS "payment_settings_delete_policy" ON payment_settings;

-- Step 4: Create comprehensive RLS policies
CREATE POLICY "payment_settings_select_policy" 
ON payment_settings 
FOR SELECT 
TO authenticated
USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "payment_settings_insert_policy" 
ON payment_settings 
FOR INSERT 
TO authenticated
WITH CHECK (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "payment_settings_update_policy" 
ON payment_settings 
FOR UPDATE 
TO authenticated
USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "payment_settings_delete_policy" 
ON payment_settings 
FOR DELETE 
TO authenticated
USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_settings_business_id ON payment_settings(business_id);

-- Step 6: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_payment_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_settings_updated_at ON payment_settings;
CREATE TRIGGER update_payment_settings_updated_at
    BEFORE UPDATE ON payment_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_settings_updated_at();

-- Step 7: Grant permissions
GRANT ALL ON payment_settings TO authenticated;
GRANT ALL ON payment_settings TO anon;

-- Step 8: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 9: Verify setup
DO $$
BEGIN
    RAISE NOTICE 'Payment settings table setup complete!';
    RAISE NOTICE 'Checking table structure...';
END $$;

-- Display table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_settings' 
ORDER BY ordinal_position;

-- Display RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'payment_settings';

-- Test query (should work for authenticated users)
-- SELECT * FROM payment_settings LIMIT 1;
