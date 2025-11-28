-- ============================================================================
-- PHONE DONATION SWEEPSTAKES - FIRST TRADE LISTING
-- ============================================================================
-- Simple insert to create the first "Trade" listing in the marketplace
-- This uses EXISTING infrastructure - no new tables, no complex setup!
-- ============================================================================

-- First, ensure we have a "Trade" category (if not already exists)
INSERT INTO categories (name, description, icon)
VALUES (
  'Trade',
  'Trade items, services, or donations for sweepstakes entries and other opportunities',
  'swap_horiz'
)
ON CONFLICT (name) DO NOTHING;

-- Get the category ID we just created (or that already exists)
DO $$
DECLARE
  trade_category_id UUID;
  nonprofit_user_id UUID;
BEGIN
  -- Get the Trade category ID
  SELECT id INTO trade_category_id
  FROM categories
  WHERE name = 'Trade'
  LIMIT 1;

  -- Get your nonprofit user ID (you'll need to replace this with your actual user_id)
  -- Option 1: If you know your user_id, replace the WHERE clause
  -- Option 2: Use your email to find it
  SELECT id INTO nonprofit_user_id
  FROM profiles
  WHERE email = 'your-email@example.com' -- REPLACE THIS WITH YOUR ACTUAL EMAIL
  LIMIT 1;

  -- If no user found, use the first admin/user (TEMPORARY - you should update this!)
  IF nonprofit_user_id IS NULL THEN
    SELECT id INTO nonprofit_user_id
    FROM profiles
    LIMIT 1;
  END IF;

  -- Create the sweepstakes trade listing
  INSERT INTO listings (
    seller_id,
    category_id,
    title,
    description,
    images,
    listing_type,
    starting_bid,
    current_bid,
    buy_now_price,
    bid_increment,
    start_time,
    end_time,
    status,
    condition,
    stock_quantity,
    allow_offers
  )
  VALUES (
    nonprofit_user_id,
    trade_category_id,
    '📱 Phone Donation Sweepstakes - Trade Your Locked/Unwanted Phone!',
    
    '🎁 MYSTERY PRIZE SWEEPSTAKES! 🎁

Trade in your locked, unwanted, or broken phone for sweepstakes entries!

📱 WHAT WE ACCEPT:
• Locked phones (any carrier - AT&T, Verizon, T-Mobile, Cricket, Metro, etc.)
• Contract default phones (balance owed)
• Broken phones (cracked screen, water damage, etc.)
• Old phones you don''t use anymore
• ANY phone in ANY condition!

🎫 SWEEPSTAKES ENTRIES:
Each phone = 1 entry into our monthly prize drawing

🎁 MYSTERY PRIZE INCLUDES:
Possible prizes may include:
• 📱 Brand new smartphone
• 💰 Cash prizes
• 📅 Free phone plan months
• 🎉 Gift cards & accessories
• 🌟 And MORE exciting surprises!

✨ 100% ANONYMOUS DONATION
We never ask for your name or personal info. Just bring the phone, get your raffle ticket, and you''re entered!

🏆 WHY DONATE?
• Get rid of old phones cluttering your drawers
• Help construction workers & community members in need
• Support our 501(c)(3) nonprofit programs
• Chance to WIN amazing prizes every month!
• Reduce phone theft in the community (we return stolen phones to owners!)

📍 HOW IT WORKS:
1. Bring your phone to our donation location (details provided after contact)
2. We check the IMEI (takes 2 minutes)
3. You receive your sweepstakes entry ticket
4. Monthly drawing - winners announced!
5. No purchase necessary, no obligation!

🔒 WHAT HAPPENS TO PHONES:
• Stolen phones → Returned to original owners
• Locked phones → Unlocked for community members in need
• Broken phones → Recycled responsibly
• Working phones → Provided to workers without reliable communication

🎯 EVERYONE WINS:
You: Get rid of old phone + chance to win prizes
Us: Help people in need + reduce phone theft
Community: Safer neighborhoods + connected workers

💚 THIS IS A TAX-EXEMPT 501(c)(3) NONPROFIT PROGRAM
All donations are voluntary and go directly to helping our community!

📞 INTERESTED?
Contact us through the platform to schedule your phone donation and get your sweepstakes entry!

Winner drawn monthly - odds increase with each phone donated!

🌟 Turn your old phone into opportunity! 🌟',
    
    ARRAY[
      'https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=Phone+Donation+Sweepstakes',
      'https://via.placeholder.com/800x600/50C878/FFFFFF?text=Mystery+Prize+Drawing',
      'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Any+Phone+Any+Condition'
    ], -- Placeholder images - you can replace these later
    
    'trade', -- This is a trade listing type
    0, -- No bidding - it's a trade
    0,
    0, -- No buy now price - it's a donation/trade
    0,
    NOW(), -- Starts now
    NOW() + INTERVAL '365 days', -- Ends in 1 year (ongoing program)
    'active',
    'new', -- The sweepstakes opportunity is "new"
    999999, -- Unlimited entries available
    false -- Not accepting offers - this is a donation program
  );

  RAISE NOTICE 'Phone Donation Sweepstakes listing created successfully!';
  RAISE NOTICE 'Category ID: %', trade_category_id;
  RAISE NOTICE 'Seller ID: %', nonprofit_user_id;
  
END $$;

-- ============================================================================
-- DONE! 🎉
-- ============================================================================
-- Now you have:
-- ✅ Trade category in marketplace
-- ✅ First sweepstakes listing visible to all users
-- ✅ No new tables, no complex code - just using what's already there!
--
-- NEXT STEPS:
-- 1. Update the seller_id in the listing to YOUR actual user ID
-- 2. Replace placeholder images with real photos
-- 3. Users can now see this in the marketplace and contact you!
-- 4. When Cricket owner agrees to sponsor, update prize description!
-- ============================================================================
