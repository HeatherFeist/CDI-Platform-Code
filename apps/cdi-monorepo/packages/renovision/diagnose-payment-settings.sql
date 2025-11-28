-- Quick diagnostic script to check payment settings setup
-- Run this to see what's missing

-- 1. Check if payment_settings table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payment_settings'
) AS table_exists;

-- 2. Check all columns in payment_settings
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_settings'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'payment_settings';

-- 4. Check RLS policies
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'payment_settings';

-- 5. Check if you have any payment settings records
SELECT COUNT(*) as record_count FROM payment_settings;

-- 6. Try to insert a test record (will show exact error if any)
-- Replace 'your-business-id-here' with an actual business_id from your businesses table
DO $$
DECLARE
    test_business_id UUID;
BEGIN
    -- Get a business_id to test with
    SELECT id INTO test_business_id FROM businesses LIMIT 1;
    
    IF test_business_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with business_id: %', test_business_id;
        
        -- Try to insert
        INSERT INTO payment_settings (
            business_id,
            paypal_email,
            cashapp_cashtag,
            payment_methods_enabled
        ) VALUES (
            test_business_id,
            'test@example.com',
            '$TestCashTag',
            '{"paypal": true, "cashapp": false}'::jsonb
        )
        ON CONFLICT (business_id) DO UPDATE
        SET paypal_email = 'test@example.com';
        
        RAISE NOTICE 'Test insert/update successful!';
    ELSE
        RAISE NOTICE 'No businesses found to test with';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during test: % %', SQLERRM, SQLSTATE;
END $$;
