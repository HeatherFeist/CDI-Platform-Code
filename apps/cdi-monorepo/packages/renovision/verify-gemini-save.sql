-- ====================================================================
-- VERIFY GEMINI'S SAVE WORKED
-- ====================================================================
-- Run this to check if Gemini's design saved successfully
-- ====================================================================

-- 1. Check total count
SELECT COUNT(*) as total_designs FROM saved_designs;

-- 2. Show all saved designs (most recent first)
SELECT 
    name,
    user_id,
    storage_path,
    thumbnail_url,
    generation_prompt,
    created_at
FROM saved_designs
ORDER BY created_at DESC;

-- 3. Check if files uploaded to storage
SELECT 
    name as file_name,
    bucket_id,
    created_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'designs'
ORDER BY created_at DESC;

-- ====================================================================
-- EXPECTED RESULTS:
-- ====================================================================
-- Query 1: Should show 2 (1 manual test + 1 from Gemini)
-- Query 2: Should show "Test Kitchen Design v3" or similar
-- Query 3: Should show actual image file uploaded to storage
-- ====================================================================
