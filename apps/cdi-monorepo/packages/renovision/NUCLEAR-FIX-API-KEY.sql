-- =====================================================
-- NUCLEAR OPTION: Complete API Key Reset
-- =====================================================
-- This will delete EVERYTHING and start 100% fresh
-- =====================================================

-- Step 1: Drop the entire table
DROP TABLE IF EXISTS api_keys CASCADE;

-- Step 2: Recreate it cleanly
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gemini_api_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Step 4: Allow anyone to read (for frontend app)
CREATE POLICY "Allow all to read api_keys" ON api_keys
    FOR SELECT
    USING (true);

-- Step 5: Insert THE CORRECT KEY (and ONLY this one)
INSERT INTO api_keys (gemini_api_key)
VALUES ('AIzaSyDJtwPJCmnjjCSEPhtsfY7amD0PrVHu5IM');

-- Step 6: VERIFY - Should show exactly 1 row
SELECT 
    '✅ VERIFICATION' as status,
    COUNT(*) as total_rows,
    LEFT(gemini_api_key, 30) as key_starts_with,
    RIGHT(gemini_api_key, 10) as key_ends_with,
    LENGTH(gemini_api_key) as key_length
FROM api_keys;

-- Step 7: Test the exact query the app uses
SELECT 
    '✅ APP QUERY TEST' as test,
    CASE 
        WHEN gemini_api_key = 'AIzaSyDJtwPJCmnjjCSEPhtsfY7amD0PrVHu5IM' 
        THEN '✅ CORRECT KEY!'
        ELSE '❌ WRONG KEY: ' || gemini_api_key
    END as result
FROM api_keys
LIMIT 1;

-- =====================================================
-- EXPECTED OUTPUT:
-- Row 1: total_rows=1, key_starts_with=AIzaSyDJtwPJCmnjjCSEPhtsfY, key_ends_with=...D0PrVHu5IM
-- Row 2: ✅ CORRECT KEY!
-- =====================================================
