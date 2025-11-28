-- DIAGNOSE ESTIMATES PAGE LOADING ISSUE
-- Check if all required data exists for estimates to load

-- Step 1: Check businesses table has required columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'businesses'
    AND column_name IN ('id', 'company_name', 'phone', 'address', 'gemini_api_key')
ORDER BY column_name;

-- Step 2: Check your business record
SELECT 
    id,
    name,
    company_name,
    phone,
    address,
    city,
    state,
    zip,
    gemini_api_key IS NOT NULL as has_api_key,
    created_at
FROM businesses
ORDER BY created_at DESC
LIMIT 5;

-- Step 3: Check payment_settings table
SELECT 
    ps.id,
    ps.business_id,
    ps.paypal_email,
    ps.cashapp_cashtag,
    ps.payment_methods_enabled,
    b.name as business_name
FROM payment_settings ps
LEFT JOIN businesses b ON ps.business_id = b.id
ORDER BY ps.created_at DESC
LIMIT 5;

-- Step 4: Check profiles have business_id
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.business_id,
    p.role,
    b.name as business_name,
    CASE 
        WHEN p.business_id IS NULL THEN '❌ NO BUSINESS'
        ELSE '✅ HAS BUSINESS'
    END as status
FROM profiles p
LEFT JOIN businesses b ON p.business_id = b.id
ORDER BY p.created_at DESC
LIMIT 5;

-- Step 5: Check if estimates table exists
SELECT 
    COUNT(*) as estimate_count,
    COUNT(DISTINCT business_id) as business_count
FROM estimates;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Diagnostic complete!';
    RAISE NOTICE 'Check results above to see what might be missing';
    RAISE NOTICE '================================================';
END $$;
