-- ==========================================
-- QUICK VERIFICATION - Did the setup work?
-- ==========================================
-- Run this to see your current setup status

SELECT 
    '✅ VERIFICATION RESULTS' as check_name,
    p.email,
    p.first_name || ' ' || p.last_name as name,
    p.role,
    p.business_id as has_business_id,
    b.company_name,
    CASE 
        WHEN p.business_id IS NOT NULL AND b.id IS NOT NULL THEN '🎉 SUCCESS - Setup complete!'
        WHEN p.business_id IS NULL THEN '❌ PROBLEM - business_id is NULL'
        ELSE '⚠️ ISSUE - business_id exists but business not found'
    END as status,
    CASE 
        WHEN p.business_id IS NOT NULL AND b.id IS NOT NULL THEN 'Go refresh your browser with Ctrl+Shift+R'
        WHEN p.business_id IS NULL THEN 'Run MASTER_SETUP_SCRIPT.sql again'
        ELSE 'Contact support - data inconsistency'
    END as what_to_do
FROM profiles p
LEFT JOIN businesses b ON p.business_id = b.id
WHERE p.email = 'heatherfeist0@gmail.com';

-- Check if business has details filled in
SELECT 
    '📋 BUSINESS DETAILS' as check_name,
    b.id,
    b.company_name,
    b.phone,
    b.address,
    b.city,
    b.state,
    b.zip,
    CASE 
        WHEN b.company_name IS NOT NULL AND b.phone IS NOT NULL AND b.address IS NOT NULL 
        THEN '✅ Complete - Banner should not show'
        WHEN b.company_name IS NOT NULL 
        THEN '⚠️ Partial - Fill in phone & address via setup wizard'
        ELSE '❌ Empty - Complete setup wizard'
    END as status
FROM businesses b
WHERE b.id IN (SELECT business_id FROM profiles WHERE email = 'heatherfeist0@gmail.com');

-- Check payment settings
SELECT 
    '💳 PAYMENT SETTINGS' as check_name,
    ps.id,
    ps.paypal_email,
    ps.cashapp_cashtag,
    CASE 
        WHEN ps.paypal_email IS NOT NULL OR ps.cashapp_cashtag IS NOT NULL 
        THEN '✅ Configured'
        ELSE '⚠️ Not set - Optional'
    END as status
FROM payment_settings ps
WHERE ps.business_id IN (SELECT business_id FROM profiles WHERE email = 'heatherfeist0@gmail.com');
