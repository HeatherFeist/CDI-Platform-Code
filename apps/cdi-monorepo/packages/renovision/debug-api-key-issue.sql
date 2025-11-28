-- =====================================================
-- COMPREHENSIVE API KEY DEBUG
-- =====================================================
-- This will help us find exactly what's wrong
-- =====================================================

-- 1. Check if the api_keys table even exists
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'api_keys';

-- 2. If table exists, show ALL columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'api_keys'
ORDER BY ordinal_position;

-- 3. Show ALL rows in api_keys table (without filtering by ID)
SELECT 
    id,
    LENGTH(gemini_api_key) as key_length,
    LEFT(gemini_api_key, 20) as key_preview,
    created_at,
    updated_at
FROM api_keys;

-- 4. Count rows in api_keys
SELECT COUNT(*) as row_count FROM api_keys;

-- 5. Try to find the specific UUID row
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM api_keys 
            WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
        )
        THEN '✅ UUID row exists'
        ELSE '❌ UUID row does NOT exist'
    END as uuid_check;

-- 6. Show what the AI service is actually trying to query
-- This simulates the exact query from AIProductSuggestionService.ts
SELECT gemini_api_key 
FROM api_keys 
LIMIT 1;
