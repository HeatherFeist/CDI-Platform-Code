-- ADD MISSING COLUMNS TO PAYMENT_SETTINGS TABLE
-- This fixes: "Could not find the 'paypal_email' column" error

-- Add paypal_email column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_settings' AND column_name = 'paypal_email') THEN
        ALTER TABLE payment_settings ADD COLUMN paypal_email VARCHAR(255);
        RAISE NOTICE 'Added paypal_email column';
    ELSE
        RAISE NOTICE 'paypal_email column already exists';
    END IF;
END $$;

-- Add cashapp_cashtag column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_settings' AND column_name = 'cashapp_cashtag') THEN
        ALTER TABLE payment_settings ADD COLUMN cashapp_cashtag VARCHAR(100);
        RAISE NOTICE 'Added cashapp_cashtag column';
    ELSE
        RAISE NOTICE 'cashapp_cashtag column already exists';
    END IF;
END $$;

-- Add payment_methods_enabled column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_settings' AND column_name = 'payment_methods_enabled') THEN
        ALTER TABLE payment_settings ADD COLUMN payment_methods_enabled JSONB DEFAULT '{"paypal": false, "cashapp": false}'::jsonb;
        RAISE NOTICE 'Added payment_methods_enabled column';
    ELSE
        RAISE NOTICE 'payment_methods_enabled column already exists';
    END IF;
END $$;

-- Add platform_fee_percentage column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_settings' AND column_name = 'platform_fee_percentage') THEN
        ALTER TABLE payment_settings ADD COLUMN platform_fee_percentage DECIMAL(5,2) DEFAULT 5.00;
        RAISE NOTICE 'Added platform_fee_percentage column';
    ELSE
        RAISE NOTICE 'platform_fee_percentage column already exists';
    END IF;
END $$;

-- Add created_at if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_settings' AND column_name = 'created_at') THEN
        ALTER TABLE payment_settings ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    ELSE
        RAISE NOTICE 'created_at column already exists';
    END IF;
END $$;

-- Add updated_at if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_settings' AND column_name = 'updated_at') THEN
        ALTER TABLE payment_settings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- Refresh the schema cache (CRITICAL!)
NOTIFY pgrst, 'reload schema';

-- Wait a moment for the schema to refresh
SELECT pg_sleep(1);

-- Verify all columns exist
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
    RAISE NOTICE '================================';
    RAISE NOTICE 'Payment settings columns added!';
    RAISE NOTICE 'Schema cache refreshed!';
    RAISE NOTICE '================================';
    RAISE NOTICE 'You can now save payment settings!';
END $$;
