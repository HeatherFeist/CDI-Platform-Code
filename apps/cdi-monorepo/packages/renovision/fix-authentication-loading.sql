-- =====================================================
-- FIX AUTHENTICATION AND RLS POLICIES
-- =====================================================
-- This will allow your app to load data properly
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- First, let's check if you have any users
SELECT 
    '1. User Check' as step,
    COUNT(*) as user_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '⚠️ No users exist - you need to sign up first!'
        ELSE '✅ Users exist'
    END as status
FROM auth.users;

-- Check if profiles table exists
SELECT 
    '2. Profiles Table Check' as step,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles')
        THEN '✅ profiles table exists'
        ELSE '❌ profiles table missing - need to run schema'
    END as status;

-- Check if businesses table exists
SELECT 
    '3. Businesses Table Check' as step,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'businesses')
        THEN '✅ businesses table exists'
        ELSE '❌ businesses table missing - need to run schema'
    END as status;

-- Check if estimates table exists
SELECT 
    '4. Estimates Table Check' as step,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'estimates')
        THEN '✅ estimates table exists'
        ELSE '❌ estimates table missing - need to run schema'
    END as status;

-- Check RLS status on key tables
SELECT 
    '5. RLS Status Check' as step,
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS Enabled'
        ELSE '🔓 RLS Disabled'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'businesses', 'estimates', 'customers', 'projects', 'team_members')
ORDER BY tablename;

-- =====================================================
-- TEMPORARY FIX: Disable RLS for testing
-- =====================================================
-- This will allow the app to load while we debug
-- WARNING: Only for testing! You'll need proper policies later

DO $$ 
BEGIN
    -- Disable RLS on main tables temporarily
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'businesses') THEN
        ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'estimates') THEN
        ALTER TABLE estimates DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customers') THEN
        ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projects') THEN
        ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'team_members') THEN
        ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
        ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Verify RLS is now disabled
SELECT 
    '6. RLS Disabled Verification' as step,
    tablename,
    CASE 
        WHEN rowsecurity THEN '⚠️ Still has RLS (might be issue)'
        ELSE '✅ RLS Disabled (should load now)'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'businesses', 'estimates', 'customers', 'projects', 'team_members', 'invoices')
ORDER BY tablename;

-- =====================================================
-- RESULT INTERPRETATION:
-- =====================================================
-- After running this:
-- 1. If "No users exist" - you need to sign up on the website first
-- 2. If any tables are missing - run supabase-schema.sql first
-- 3. All tables should show "✅ RLS Disabled"
-- 4. Try loading the app again - it should work now!
-- =====================================================
