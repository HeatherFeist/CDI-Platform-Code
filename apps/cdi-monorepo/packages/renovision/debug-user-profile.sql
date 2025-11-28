-- =====================================================
-- DEBUG: Check User Profile Data
-- =====================================================
-- This will show all data for heatherfeist0@gmail.com
-- =====================================================

SELECT 
    id,
    email,
    first_name,
    last_name,
    business_id,
    CASE 
        WHEN business_id IS NOT NULL 
        THEN '✅ Has Business ID'
        ELSE '❌ Missing Business ID'
    END as business_status,
    CASE 
        WHEN gemini_api_key IS NOT NULL 
        THEN '✅ Has API Key (length: ' || LENGTH(gemini_api_key) || ')'
        ELSE '❌ No API Key'
    END as api_key_status,
    created_at
FROM profiles
WHERE email = 'heatherfeist0@gmail.com';

-- =====================================================
-- If business_id is NULL, that's the problem!
-- We need to set it to your business ID
-- =====================================================

-- Check what businesses exist:
SELECT 
    id,
    business_name,
    created_at
FROM businesses
ORDER BY created_at DESC;

-- =====================================================
-- EXPECTED OUTPUT:
-- Your profile should have business_id set
-- If not, we'll need to update it!
-- =====================================================
