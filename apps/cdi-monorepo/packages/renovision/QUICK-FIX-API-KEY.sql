-- =====================================================
-- QUICK FIX: Insert API Key into Supabase
-- =====================================================
-- Copy this ENTIRE script and run it in Supabase SQL Editor
-- =====================================================

-- Drop existing table if any and start fresh
DROP TABLE IF EXISTS api_keys CASCADE;

-- Create the api_keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gemini_api_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (but allow all reads for now)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading API keys
CREATE POLICY "Allow read access to api_keys" ON api_keys
    FOR SELECT
    USING (true);

-- Insert your Gemini API key
INSERT INTO api_keys (gemini_api_key)
VALUES ('AIzaSyBkZXHxRWUVBXsocOXsQS7YxX76hpGXTVY');

-- Verify everything is set up correctly
SELECT 
    '✅ Table Created' as step_1,
    'api_keys' as table_name;

SELECT 
    '✅ API Key Inserted' as step_2,
    CASE 
        WHEN gemini_api_key LIKE 'AIza%' THEN '✅ Valid Format'
        ELSE '❌ Invalid Format'
    END as validation,
    LENGTH(gemini_api_key) as key_length,
    LEFT(gemini_api_key, 20) || '...' as preview
FROM api_keys;

SELECT 
    '✅ Row Count Check' as step_3,
    COUNT(*) as total_rows,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ Perfect (exactly 1 row)'
        ELSE '⚠️ Should have exactly 1 row'
    END as status
FROM api_keys;

-- Test the exact query the app uses
SELECT 
    '✅ App Query Test' as step_4,
    CASE 
        WHEN gemini_api_key IS NOT NULL THEN '✅ App will find the key'
        ELSE '❌ App will NOT find the key'
    END as result
FROM api_keys
LIMIT 1;

-- =====================================================
-- EXPECTED OUTPUT:
-- You should see 4 result sets, all with ✅ checkmarks
-- If you see all green checkmarks, the API key is ready!
-- =====================================================
