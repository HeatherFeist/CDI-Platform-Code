-- ============================================================================
-- STEP 1: CHECK WHAT TABLES EXIST
-- Run this first to see what we're working with
-- ============================================================================

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
