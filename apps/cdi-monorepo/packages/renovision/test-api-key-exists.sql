-- =====================================================
-- TEST: Check if API key exists in database
-- =====================================================
-- Run this to see what's actually in your database
-- =====================================================

-- Test 1: Does the api_keys table even exist?
SELECT 
    'Test 1: Table Existence' as test,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'api_keys'
        )
        THEN '✅ api_keys table EXISTS'
        ELSE '❌ api_keys table DOES NOT EXIST - Run QUICK-FIX-API-KEY.sql!'
    END as result;

-- Test 2: How many rows are in the table?
SELECT 
    'Test 2: Row Count' as test,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys')
        THEN (
            SELECT CAST(COUNT(*) AS TEXT) || CASE 
                WHEN COUNT(*) = 0 THEN ' rows ❌ TABLE IS EMPTY!'
                WHEN COUNT(*) = 1 THEN ' row ✅ PERFECT'
                ELSE ' rows ⚠️ Should only have 1 row'
            END
            FROM api_keys
        )
        ELSE 'Table does not exist'
    END as result;

-- Test 3: What's in the table? (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys') THEN
        RAISE NOTICE 'Test 3: Checking table contents...';
    END IF;
END $$;

SELECT 
    'Test 3: API Key Data' as test,
    id,
    CASE 
        WHEN gemini_api_key IS NULL THEN '❌ Key is NULL'
        WHEN gemini_api_key = '' THEN '❌ Key is empty string'
        WHEN LENGTH(gemini_api_key) < 30 THEN '⚠️ Key too short: ' || LENGTH(gemini_api_key) || ' chars'
        WHEN gemini_api_key LIKE 'AIza%' THEN '✅ Valid key: ' || LENGTH(gemini_api_key) || ' chars'
        ELSE '⚠️ Unexpected format'
    END as key_status,
    LEFT(gemini_api_key, 25) || '...' as key_preview,
    created_at
FROM api_keys
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys');

-- Test 4: Simulate the exact query the app uses
SELECT 
    'Test 4: App Query Simulation' as test,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys')
        THEN (
            SELECT CASE 
                WHEN gemini_api_key IS NOT NULL AND gemini_api_key != '' 
                THEN '✅ App WILL find the API key'
                ELSE '❌ App will NOT find the API key'
            END
            FROM api_keys 
            LIMIT 1
        )
        ELSE '❌ Table does not exist - app will fail'
    END as result;

-- =====================================================
-- WHAT TO DO BASED ON RESULTS:
-- =====================================================
-- If Test 1 shows "DOES NOT EXIST":
--   → Run QUICK-FIX-API-KEY.sql in Supabase SQL Editor
--
-- If Test 2 shows "0 rows":
--   → Run QUICK-FIX-API-KEY.sql in Supabase SQL Editor
--
-- If Test 3 shows "Key is NULL" or "empty":
--   → Run QUICK-FIX-API-KEY.sql in Supabase SQL Editor
--
-- If ALL tests show ✅:
--   → The key IS in the database
--   → Problem might be with RLS policies or app code
--   → Check browser console (F12) for actual error
-- =====================================================
