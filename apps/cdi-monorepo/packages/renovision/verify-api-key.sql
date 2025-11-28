-- =====================================================
-- VERIFY GEMINI API KEY IN DATABASE
-- =====================================================
-- Run this to confirm your API key is properly stored
-- =====================================================

-- Check if api_keys table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys')
        THEN '✅ api_keys table exists'
        ELSE '❌ api_keys table does NOT exist - run set-gemini-api-key.sql first!'
    END as table_status;

-- Check the API key value
SELECT 
    CASE 
        WHEN gemini_api_key IS NULL THEN '❌ API key is NULL'
        WHEN gemini_api_key = '' THEN '❌ API key is empty string'
        WHEN gemini_api_key = 'YOUR_GEMINI_API_KEY_HERE' THEN '⚠️ Still has placeholder - replace with actual key!'
        WHEN LENGTH(gemini_api_key) < 30 THEN '⚠️ API key looks too short (' || LENGTH(gemini_api_key) || ' chars)'
        WHEN gemini_api_key LIKE 'AIza%' THEN '✅ API key looks valid! Length: ' || LENGTH(gemini_api_key) || ' chars'
        ELSE '⚠️ API key format unexpected (length: ' || LENGTH(gemini_api_key) || ')'
    END as key_status,
    'Starts with: ' || LEFT(gemini_api_key, 15) || '...' as preview,
    'Ends with: ...' || RIGHT(gemini_api_key, 10) as suffix,
    created_at as "First Created",
    updated_at as "Last Updated"
FROM api_keys
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Count total rows (should be 1)
SELECT COUNT(*) as total_rows FROM api_keys;
