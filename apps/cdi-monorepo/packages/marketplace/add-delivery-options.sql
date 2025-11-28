-- ============================================
-- ADD DELIVERY OPTIONS TO LISTINGS TABLE
-- ============================================
-- Run this in Supabase SQL Editor

-- Add delivery-related columns to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS delivery_options JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS seller_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_instructions TEXT;

-- Create delivery_options enum type for validation
CREATE TYPE delivery_method AS ENUM (
  'local_delivery',    -- Seller delivers locally (for a fee)
  'pickup',            -- Buyer picks up at seller's location (free)
  'shipping',          -- Seller ships via carrier (for a fee)
  'seller_delivery'    -- Same as local_delivery (kept for clarity)
);

-- Example delivery_options JSON structure:
-- [
--   {
--     "method": "pickup",
--     "enabled": true,
--     "fee": 0,
--     "description": "Pick up at my workshop in Dayton",
--     "available_hours": "Mon-Fri 9am-5pm"
--   },
--   {
--     "method": "local_delivery",
--     "enabled": true,
--     "fee": 15.00,
--     "description": "I can deliver within 10 miles",
--     "radius_miles": 10
--   },
--   {
--     "method": "shipping",
--     "enabled": true,
--     "fee": 12.50,
--     "description": "USPS shipping within USA",
--     "carrier": "USPS",
--     "estimated_days": "3-5"
--   }
-- ]

-- Add index for querying delivery options
CREATE INDEX IF NOT EXISTS idx_listings_delivery_options 
ON public.listings USING GIN (delivery_options);

-- Add comment to explain the structure
COMMENT ON COLUMN public.listings.delivery_options IS 
'Array of delivery method objects. Each object should have: method (enum), enabled (boolean), fee (decimal), description (text), and method-specific fields.';

COMMENT ON COLUMN public.listings.seller_address IS 
'Seller address for pickup option. Not shown to buyers until purchase is confirmed.';

COMMENT ON COLUMN public.listings.pickup_instructions IS 
'Special instructions for buyer pickup (e.g., "Ring doorbell, workshop in back")';

-- Update existing listings to have default delivery options
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

-- Verify the changes
SELECT 
  id,
  title,
  delivery_options,
  pickup_instructions
FROM public.listings
LIMIT 5;
