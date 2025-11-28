-- Quick check for payment_settings table status

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payment_settings'
) as table_exists;

-- List all columns in payment_settings table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'payment_settings'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'payment_settings';

-- Check if there's any data
SELECT COUNT(*) as row_count FROM payment_settings;

-- Show sample data (if any)
SELECT * FROM payment_settings LIMIT 5;
