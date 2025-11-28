-- Check the role constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
AND conname LIKE '%role%';

-- Also check what roles currently exist in the profiles table
SELECT DISTINCT role, COUNT(*) as count
FROM profiles
GROUP BY role;
