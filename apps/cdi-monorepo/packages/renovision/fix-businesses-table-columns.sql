-- Add missing columns to businesses table for complete business profile
-- This fixes the "Could not find the 'address' column" error

-- Add company_name (alias for name, used in some parts of the app)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'company_name') THEN
        ALTER TABLE businesses ADD COLUMN company_name VARCHAR(255);
        RAISE NOTICE 'Added company_name column';
    END IF;
END $$;

-- Add phone number
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'phone') THEN
        ALTER TABLE businesses ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE 'Added phone column';
    END IF;
END $$;

-- Add address
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'address') THEN
        ALTER TABLE businesses ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column';
    END IF;
END $$;

-- Add city
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'city') THEN
        ALTER TABLE businesses ADD COLUMN city VARCHAR(100);
        RAISE NOTICE 'Added city column';
    END IF;
END $$;

-- Add state
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'state') THEN
        ALTER TABLE businesses ADD COLUMN state VARCHAR(2);
        RAISE NOTICE 'Added state column';
    END IF;
END $$;

-- Add zip code
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'zip') THEN
        ALTER TABLE businesses ADD COLUMN zip VARCHAR(10);
        RAISE NOTICE 'Added zip column';
    END IF;
END $$;

-- Add website
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'website') THEN
        ALTER TABLE businesses ADD COLUMN website VARCHAR(255);
        RAISE NOTICE 'Added website column';
    END IF;
END $$;

-- Add email
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'email') THEN
        ALTER TABLE businesses ADD COLUMN email VARCHAR(255);
        RAISE NOTICE 'Added email column';
    END IF;
END $$;

-- Add logo URL
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'logo_url') THEN
        ALTER TABLE businesses ADD COLUMN logo_url TEXT;
        RAISE NOTICE 'Added logo_url column';
    END IF;
END $$;

-- Add tax ID / EIN
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'tax_id') THEN
        ALTER TABLE businesses ADD COLUMN tax_id VARCHAR(50);
        RAISE NOTICE 'Added tax_id column';
    END IF;
END $$;

-- Add business license number
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'license_number') THEN
        ALTER TABLE businesses ADD COLUMN license_number VARCHAR(100);
        RAISE NOTICE 'Added license_number column';
    END IF;
END $$;

-- Add insurance info
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'insurance_policy') THEN
        ALTER TABLE businesses ADD COLUMN insurance_policy VARCHAR(100);
        RAISE NOTICE 'Added insurance_policy column';
    END IF;
END $$;

-- Sync company_name with name for existing records
UPDATE businesses 
SET company_name = name 
WHERE company_name IS NULL AND name IS NOT NULL;

-- Add UPDATE policy for businesses if it doesn't exist
DROP POLICY IF EXISTS "Users can update own business" ON businesses;
CREATE POLICY "Users can update own business" 
ON businesses 
FOR UPDATE 
USING (
    id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
    id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
ORDER BY ordinal_position;

RAISE NOTICE 'Businesses table updated successfully!';
