-- ============================================
-- Business Profile Setup - Diagnostic & Fix
-- ============================================

-- STEP 1: Check your current profile
-- Run this first to see what's missing
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    business_id,
    created_at
FROM profiles
WHERE email = 'heatherfeist0@gmail.com'; -- Replace with your actual email

-- STEP 2: Check if businesses table exists and has data
SELECT * FROM businesses LIMIT 5;

-- STEP 3: Create a business if it doesn't exist
-- Replace YOUR_EMAIL with your actual email
DO $$
DECLARE
    v_user_id UUID;
    v_business_id UUID;
BEGIN
    -- Get your user ID
    SELECT id INTO v_user_id 
    FROM profiles 
    WHERE email = 'heatherfeist0@gmail.com'; -- Replace with your email
    
    -- Check if user already has a business
    SELECT business_id INTO v_business_id
    FROM profiles
    WHERE id = v_user_id;
    
    IF v_business_id IS NULL THEN
        -- Create new business
        INSERT INTO businesses (
            id,
            company_name,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Constructive Design LLC', -- Change this to your company name
            NOW(),
            NOW()
        ) RETURNING id INTO v_business_id;
        
        -- Link business to profile
        UPDATE profiles
        SET business_id = v_business_id
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Business created with ID: %', v_business_id;
    ELSE
        RAISE NOTICE 'User already has business_id: %', v_business_id;
    END IF;
END $$;

-- STEP 4: Verify the fix
SELECT 
    p.id as user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.business_id,
    b.company_name,
    b.phone,
    b.address
FROM profiles p
LEFT JOIN businesses b ON p.business_id = b.id
WHERE p.email = 'heatherfeist0@gmail.com';

-- ============================================
-- ALTERNATIVE: Manual Fix (if the above doesn't work)
-- ============================================

-- Method 1: Create business and link in one step
WITH new_business AS (
    INSERT INTO businesses (
        id,
        company_name,
        phone,
        address,
        city,
        state,
        zip,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'Your Company Name',    -- Change this
        '555-1234',            -- Change this
        '123 Main St',         -- Change this
        'Your City',           -- Change this
        'ST',                  -- Change this
        '12345',               -- Change this
        NOW(),
        NOW()
    ) RETURNING id
)
UPDATE profiles
SET business_id = (SELECT id FROM new_business)
WHERE email = 'YOUR_EMAIL_HERE'; -- Replace with your email

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if business was created
SELECT COUNT(*) as business_count FROM businesses;

-- Check if your profile is linked
SELECT 
    email,
    business_id IS NOT NULL as has_business,
    role
FROM profiles
WHERE email = 'YOUR_EMAIL_HERE';

-- Check setup status
SELECT 
    b.id,
    b.company_name,
    b.phone IS NOT NULL as has_phone,
    b.address IS NOT NULL as has_address,
    EXISTS(
        SELECT 1 FROM payment_settings ps 
        WHERE ps.business_id = b.id
    ) as has_payment_settings,
    EXISTS(
        SELECT 1 FROM api_keys ak 
        WHERE ak.business_id = b.id AND ak.service = 'gemini'
    ) as has_gemini_key
FROM businesses b
WHERE b.id = (
    SELECT business_id FROM profiles WHERE email = 'YOUR_EMAIL_HERE'
);

-- ============================================
-- QUICK FIX FOR MISSING TABLES
-- ============================================

-- If businesses table doesn't exist, create it
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- If payment_settings table doesn't exist
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    paypal_email TEXT,
    cashapp_cashtag TEXT,
    payment_methods_enabled JSONB DEFAULT '{"paypal": false, "cashapp": false}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id)
);

-- If api_keys table doesn't exist
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    service TEXT NOT NULL, -- 'gemini', 'openai', etc.
    api_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, service)
);

-- Add business_id column to profiles if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'business_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN business_id UUID REFERENCES businesses(id);
    END IF;
END $$;

-- ============================================
-- STEP-BY-STEP MANUAL FIX (Foolproof)
-- ============================================

-- 1. Find your user ID
SELECT id, email, first_name, last_name, business_id 
FROM profiles 
WHERE email = 'heatherfeist0@gmail.com';
-- Copy the 'id' value from the result

-- 2. Create a business (run this with a new UUID)
INSERT INTO businesses (id, company_name, created_at, updated_at)
VALUES (
    'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', -- Generate a new UUID or use gen_random_uuid()
    'My Company',
    NOW(),
    NOW()
);
-- Copy the UUID you used

-- 3. Link the business to your profile
UPDATE profiles
SET business_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' -- Use the UUID from step 2
WHERE id = 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy'; -- Use the user ID from step 1

-- 4. Verify
SELECT 
    p.email,
    p.business_id,
    b.company_name
FROM profiles p
LEFT JOIN businesses b ON p.business_id = b.id
WHERE p.email = 'heatherfeist0@gmail.com';

-- ============================================
-- AFTER RUNNING THIS, REFRESH YOUR APP
-- ============================================
-- The setup banner should appear and guide you through:
-- 1. Business details (company name, phone, address)
-- 2. Payment settings (PayPal, CashApp)
-- 3. AI settings (Gemini API key)
