-- Complete PayPal API Integration Setup
-- Adds PayPal API credentials and proper structure for payment_settings table

-- Add PayPal API credential columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_settings' AND column_name = 'paypal_client_id') THEN
        ALTER TABLE payment_settings ADD COLUMN paypal_client_id TEXT;
        RAISE NOTICE 'Added paypal_client_id column';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_settings' AND column_name = 'paypal_mode') THEN
        ALTER TABLE payment_settings ADD COLUMN paypal_mode VARCHAR(20) DEFAULT 'sandbox' CHECK (paypal_mode IN ('sandbox', 'live'));
        RAISE NOTICE 'Added paypal_mode column';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_settings' AND column_name = 'paypal_api_enabled') THEN
        ALTER TABLE payment_settings ADD COLUMN paypal_api_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added paypal_api_enabled column';
    END IF;
END $$;

-- Add Stripe columns for future expansion
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_settings' AND column_name = 'stripe_publishable_key') THEN
        ALTER TABLE payment_settings ADD COLUMN stripe_publishable_key TEXT;
        RAISE NOTICE 'Added stripe_publishable_key column';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_settings' AND column_name = 'stripe_enabled') THEN
        ALTER TABLE payment_settings ADD COLUMN stripe_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added stripe_enabled column';
    END IF;
END $$;

-- Add currency column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_settings' AND column_name = 'currency') THEN
        ALTER TABLE payment_settings ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
        RAISE NOTICE 'Added currency column';
    END IF;
END $$;

-- Add payment notification settings
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_settings' AND column_name = 'notify_on_payment') THEN
        ALTER TABLE payment_settings ADD COLUMN notify_on_payment BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added notify_on_payment column';
    END IF;
END $$;

-- Add auto-confirm payment setting
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_settings' AND column_name = 'auto_confirm_payments') THEN
        ALTER TABLE payment_settings ADD COLUMN auto_confirm_payments BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added auto_confirm_payments column';
    END IF;
END $$;

-- Create index on business_id if not exists
CREATE INDEX IF NOT EXISTS idx_payment_settings_business_id ON payment_settings(business_id);

-- Ensure RLS policies exist
DROP POLICY IF EXISTS "payment_settings_select_policy" ON payment_settings;
CREATE POLICY "payment_settings_select_policy" 
ON payment_settings 
FOR SELECT 
USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "payment_settings_insert_policy" ON payment_settings;
CREATE POLICY "payment_settings_insert_policy" 
ON payment_settings 
FOR INSERT 
WITH CHECK (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "payment_settings_update_policy" ON payment_settings;
CREATE POLICY "payment_settings_update_policy" 
ON payment_settings 
FOR UPDATE 
USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "payment_settings_delete_policy" ON payment_settings;
CREATE POLICY "payment_settings_delete_policy" 
ON payment_settings 
FOR DELETE 
USING (
    business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Show final structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payment_settings' 
ORDER BY ordinal_position;

RAISE NOTICE 'PayPal API integration setup complete!';
