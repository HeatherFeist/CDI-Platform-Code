-- ====================================================================
-- CHECK PROFILES TABLE STRUCTURE
-- ====================================================================
-- Let's see what columns exist and what the role constraint actually is
-- ====================================================================

-- Check all columns in profiles table
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check the exact role constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
AND conname LIKE '%role%';
