-- FIX PAYMENT_METHODS_ENABLED COLUMN TYPE
-- Changes from BOOLEAN to JSONB to store multiple payment method states

-- Step 1: Check current column type
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_settings' 
  AND column_name = 'payment_methods_enabled';

-- Step 2: Drop the existing boolean column and recreate as JSONB
DO $$ 
BEGIN
    -- Drop the column if it exists as boolean
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'payment_settings' 
               AND column_name = 'payment_methods_enabled'
               AND data_type = 'boolean') THEN
        
        ALTER TABLE payment_settings DROP COLUMN payment_methods_enabled;
        RAISE NOTICE 'Dropped old boolean payment_methods_enabled column';
    END IF;
    
    -- Add it back as JSONB
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_settings' 
                   AND column_name = 'payment_methods_enabled'
                   AND data_type = 'jsonb') THEN
        
        ALTER TABLE payment_settings 
        ADD COLUMN payment_methods_enabled JSONB 
        DEFAULT '{"paypal": false, "cashapp": false}'::jsonb;
        
        RAISE NOTICE 'Added payment_methods_enabled as JSONB column';
    ELSE
        RAISE NOTICE 'payment_methods_enabled is already JSONB type';
    END IF;
END $$;

-- Step 3: Refresh the schema cache (CRITICAL!)
NOTIFY pgrst, 'reload schema';

-- Step 4: Wait for schema refresh
SELECT pg_sleep(1);

-- Step 5: Verify the fix
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_settings' 
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'payment_methods_enabled column type fixed!';
    RAISE NOTICE 'Changed from BOOLEAN to JSONB';
    RAISE NOTICE 'Schema cache refreshed!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'You can now save payment settings!';
END $$;
