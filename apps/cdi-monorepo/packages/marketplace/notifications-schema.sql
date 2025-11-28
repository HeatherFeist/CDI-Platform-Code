-- Real-time notification system database schema
-- This extends the existing notifications table with real-time capabilities

-- Update existing notifications table with new fields
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS notification_type TEXT CHECK (notification_type IN (
  'bid_outbid', 'auction_ending', 'auction_won', 'auction_lost', 
  'listing_sold', 'new_bid', 'payment_received', 'watchlist_alert',
  'price_drop', 'new_listing_category', 'system_announcement'
)) DEFAULT 'system_announcement',
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS is_push_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Browser push notifications
  push_enabled BOOLEAN DEFAULT true,
  push_bid_alerts BOOLEAN DEFAULT true,
  push_auction_ending BOOLEAN DEFAULT true,
  push_auction_results BOOLEAN DEFAULT true,
  push_payment_updates BOOLEAN DEFAULT true,
  push_watchlist_alerts BOOLEAN DEFAULT true,
  
  -- Email notifications
  email_enabled BOOLEAN DEFAULT true,
  email_bid_alerts BOOLEAN DEFAULT false, -- Less frequent for email
  email_auction_ending BOOLEAN DEFAULT true,
  email_auction_results BOOLEAN DEFAULT true,
  email_payment_updates BOOLEAN DEFAULT true,
  email_weekly_summary BOOLEAN DEFAULT true,
  
  -- Sound preferences
  sound_enabled BOOLEAN DEFAULT true,
  sound_volume INTEGER DEFAULT 50 CHECK (sound_volume >= 0 AND sound_volume <= 100),
  
  -- Timing preferences
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'America/New_York',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create push subscription table for web push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL, -- Contains p256dh and auth keys
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Create notification queue for scheduled notifications
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_type_user ON notifications(user_id, notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id) WHERE is_active = true;

-- Enable RLS on new tables
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for push_subscriptions  
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for notification_queue (read-only for users)
CREATE POLICY "Users can view their own notification queue" ON notification_queue
  FOR SELECT USING (auth.uid() = user_id);

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences when user signs up
DROP TRIGGER IF EXISTS create_default_notification_preferences_trigger ON profiles;
CREATE TRIGGER create_default_notification_preferences_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Function to queue auction ending notifications
CREATE OR REPLACE FUNCTION queue_auction_ending_notifications()
RETURNS void AS $$
DECLARE
  listing_record RECORD;
BEGIN
  -- Queue 5-minute warnings
  FOR listing_record IN 
    SELECT l.*, p.id as seller_id
    FROM listings l
    JOIN profiles p ON l.seller_id = p.id
    WHERE l.status = 'active' 
    AND l.end_time BETWEEN NOW() + INTERVAL '4 minutes 50 seconds' AND NOW() + INTERVAL '5 minutes 10 seconds'
    AND NOT EXISTS (
      SELECT 1 FROM notification_queue nq 
      WHERE nq.user_id = l.seller_id 
      AND nq.notification_type = 'auction_ending'
      AND nq.data->>'listing_id' = l.id::text
      AND nq.data->>'warning_type' = '5_minutes'
    )
  LOOP
    -- Notify seller
    INSERT INTO notification_queue (user_id, notification_type, title, message, data, scheduled_for)
    VALUES (
      listing_record.seller_id,
      'auction_ending',
      'Auction ending soon!',
      'Your auction "' || listing_record.title || '" ends in 5 minutes',
      jsonb_build_object('listing_id', listing_record.id, 'warning_type', '5_minutes'),
      listing_record.end_time - INTERVAL '5 minutes'
    );
    
    -- Notify all bidders
    INSERT INTO notification_queue (user_id, notification_type, title, message, data, scheduled_for)
    SELECT 
      DISTINCT b.bidder_id,
      'auction_ending',
      'Auction ending soon!',
      'The auction for "' || listing_record.title || '" ends in 5 minutes',
      jsonb_build_object('listing_id', listing_record.id, 'warning_type', '5_minutes'),
      listing_record.end_time - INTERVAL '5 minutes'
    FROM bids b 
    WHERE b.listing_id = listing_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to be called via cron or scheduled job
CREATE OR REPLACE FUNCTION process_scheduled_notifications()
RETURNS void AS $$
BEGIN
  -- This would be called by a scheduled job to queue upcoming notifications
  PERFORM queue_auction_ending_notifications();
  
  -- Add other scheduled notification types here
END;
$$ LANGUAGE plpgsql;