-- Fix missing delivery columns in listings table
-- Run this in Supabase SQL Editor

-- Add the missing delivery-related columns
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS delivery_options JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS seller_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_instructions TEXT;

-- Add index for better performance when querying delivery options
CREATE INDEX IF NOT EXISTS idx_listings_delivery_options 
ON public.listings USING GIN (delivery_options);

-- Add helpful comments for documentation
COMMENT ON COLUMN public.listings.delivery_options IS 
'Array of delivery method objects with method, enabled, fee, description fields';

COMMENT ON COLUMN public.listings.seller_address IS 
'Private seller address for pickup. Only shown to buyer after purchase.';

COMMENT ON COLUMN public.listings.pickup_instructions IS 
'Instructions for buyer pickup (e.g., Ring doorbell, park in back)';

-- Set default delivery options for existing listings (if any)
UPDATE public.listings 
SET delivery_options = '[
  {
    "method": "pickup",
    "enabled": true,
    "fee": 0,
    "description": "Pick up from seller location"
  }
]'::jsonb
WHERE delivery_options IS NULL OR delivery_options = '[]'::jsonb;

-- Verify the columns were added successfully
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'listings' 
  AND column_name IN ('delivery_options', 'seller_address', 'pickup_instructions')
ORDER BY column_name;

-- Show count of listings with delivery options
SELECT 
  COUNT(*) as total_listings,
  COUNT(delivery_options) as with_delivery_options,
  COUNT(seller_address) as with_seller_address,
  COUNT(pickup_instructions) as with_pickup_instructions
FROM public.listings;