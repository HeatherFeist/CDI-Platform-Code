-- =====================================================
-- FIX API KEY ISSUE - COMPLETE SOLUTION
-- =====================================================
-- Run this entire script to properly set up your API key
-- =====================================================

-- Step 1: Drop and recreate api_keys table cleanly
DROP TABLE IF EXISTS api_keys CASCADE;

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gemini_api_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Insert your API key (this will be the ONLY row)
INSERT INTO api_keys (gemini_api_key)
VALUES ('AIzaSyDJtwPJCmnjjCSEPhtsfY7amD0PrVHu5IM');

-- Step 3: Verify it worked
SELECT 
    'API Key Status' as check_name,
    CASE 
        WHEN gemini_api_key IS NULL THEN '❌ FAILED: Key is NULL'
        WHEN gemini_api_key = '' THEN '❌ FAILED: Key is empty'
        WHEN LENGTH(gemini_api_key) < 30 THEN '⚠️ WARNING: Key is too short'
        WHEN gemini_api_key LIKE 'AIza%' THEN '✅ SUCCESS: Valid Gemini API key!'
        ELSE '⚠️ WARNING: Unexpected key format'
    END as status,
    LENGTH(gemini_api_key) as key_length,
    'Starts: ' || LEFT(gemini_api_key, 15) || '...' as preview,
    '...Ends: ' || RIGHT(gemini_api_key, 10) as suffix
FROM api_keys;

-- Step 4: Test the exact query the app uses
SELECT 
    'App Query Test' as check_name,
    CASE 
        WHEN gemini_api_key IS NOT NULL THEN '✅ SUCCESS: App will find the API key'
        ELSE '❌ FAILED: App will NOT find the API key'
    END as status
FROM api_keys
LIMIT 1;

-- Step 5: Show row count (should be exactly 1)
SELECT 
    'Row Count' as check_name,
    COUNT(*) as total_rows,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ Perfect: Exactly 1 row'
        WHEN COUNT(*) = 0 THEN '❌ ERROR: No rows found'
        ELSE '⚠️ WARNING: Multiple rows (app expects 1)'
    END as status
FROM api_keys;

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- You should see THREE result sets:
-- 1. "✅ SUCCESS: Valid Gemini API key!" with length 39
-- 2. "✅ SUCCESS: App will find the API key"
-- 3. "✅ Perfect: Exactly 1 row"
--
-- If you see all three checkmarks, your API key is ready!
-- =====================================================
