-- =====================================================
-- SET GEMINI API KEY
-- =====================================================
-- This will insert or update your Gemini API key in the database
-- IMPORTANT: Replace 'YOUR_GEMINI_API_KEY_HERE' with your actual API key
-- =====================================================

-- First, check if the api_keys table exists and create it if needed
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gemini_api_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert or update the API key (REPLACE WITH YOUR ACTUAL KEY)
INSERT INTO api_keys (id, gemini_api_key, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'AIzaSyDJtwPJCmnjjCSEPhtsfY7amD0PrVHu5IM', -- ✅ API key with proper quotes
    NOW(),
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
    gemini_api_key = EXCLUDED.gemini_api_key,
    updated_at = NOW();

-- Verify the key was set
SELECT 
    CASE 
        WHEN gemini_api_key IS NULL THEN '❌ Failed: API key is NULL'
        WHEN gemini_api_key = 'YOUR_GEMINI_API_KEY_HERE' THEN '⚠️ Warning: You need to replace YOUR_GEMINI_API_KEY_HERE with your actual key!'
        WHEN LENGTH(gemini_api_key) < 20 THEN '⚠️ Warning: API key looks too short'
        ELSE '✅ Success! API key is set (length: ' || LENGTH(gemini_api_key) || ' characters)'
    END as status,
    'Key starts with: ' || LEFT(gemini_api_key, 10) || '...' as preview,
    created_at,
    updated_at
FROM api_keys
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- =====================================================
-- INSTRUCTIONS:
-- =====================================================
-- 1. Get your Gemini API key from: https://aistudio.google.com/app/apikey
-- 2. Replace 'YOUR_GEMINI_API_KEY_HERE' above with your actual key
-- 3. Run this SQL in Supabase SQL Editor
-- 4. Verify you see "✅ Success!" in the output
-- 5. Refresh your app and try the AI Product Suggestions again
-- =====================================================
