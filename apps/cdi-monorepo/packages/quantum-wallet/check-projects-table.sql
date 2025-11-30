-- Check the projects table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Check if businesses table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'businesses'
) as businesses_table_exists;
