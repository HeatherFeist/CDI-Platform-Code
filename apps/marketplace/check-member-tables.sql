-- Check if member tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('member_applications', 'member_stores', 'member_mentorships') 
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('member_applications', 'member_stores', 'member_mentorships')
ORDER BY table_name;

-- Also check profiles table for member columns
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('is_nonprofit_member', 'member_tier')
ORDER BY column_name;