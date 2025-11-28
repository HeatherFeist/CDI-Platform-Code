-- Facebook Integration Schema
-- This schema supports Facebook login, sharing, and marketplace integration

-- Facebook user integrations table
CREATE TABLE facebook_integrations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  facebook_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  pages JSONB DEFAULT '[]',
  groups JSONB DEFAULT '[]',
  sharing_preferences JSONB DEFAULT '{
    "auto_share_auctions": false,
    "auto_share_trades": false,
    "auto_share_achievements": false,
    "share_to_timeline": true,
    "share_to_marketplace": false,
    "share_to_groups": false,
    "selected_groups": [],
    "privacy_setting": "friends"
  }',
  connected BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Facebook shares log
CREATE TABLE facebook_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('auction', 'trade', 'achievement')),
  content_id UUID,
  content_title TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('timeline', 'marketplace', 'group', 'page')),
  post_id TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  engagement_data JSONB DEFAULT '{}',
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Facebook marketplace posts
CREATE TABLE facebook_marketplace_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  facebook_post_id TEXT,
  marketplace_category TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'removed')),
  facebook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Facebook analytics
CREATE TABLE facebook_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL REFERENCES facebook_shares(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_facebook_integrations_user_id ON facebook_integrations(user_id);
CREATE INDEX idx_facebook_integrations_facebook_user_id ON facebook_integrations(facebook_user_id);
CREATE INDEX idx_facebook_shares_user_id ON facebook_shares(user_id);
CREATE INDEX idx_facebook_shares_content_type ON facebook_shares(content_type);
CREATE INDEX idx_facebook_shares_shared_at ON facebook_shares(shared_at);
CREATE INDEX idx_facebook_marketplace_posts_user_id ON facebook_marketplace_posts(user_id);
CREATE INDEX idx_facebook_marketplace_posts_item_id ON facebook_marketplace_posts(item_id);
CREATE INDEX idx_facebook_analytics_share_id ON facebook_analytics(share_id);
CREATE INDEX idx_facebook_analytics_post_id ON facebook_analytics(post_id);

-- RLS Policies
ALTER TABLE facebook_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_marketplace_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only access their own Facebook integrations
CREATE POLICY "Users can manage their own Facebook integrations" ON facebook_integrations
FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own Facebook shares
CREATE POLICY "Users can manage their own Facebook shares" ON facebook_shares
FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own marketplace posts
CREATE POLICY "Users can manage their own marketplace posts" ON facebook_marketplace_posts
FOR ALL USING (auth.uid() = user_id);

-- Users can only access analytics for their own shares
CREATE POLICY "Users can view analytics for their own shares" ON facebook_analytics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM facebook_shares 
    WHERE facebook_shares.id = facebook_analytics.share_id 
    AND facebook_shares.user_id = auth.uid()
  )
);

-- Admin access for analytics
CREATE POLICY "Admins can view all analytics" ON facebook_analytics
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Functions for Facebook integration

-- Function to get user's Facebook sharing preferences
CREATE OR REPLACE FUNCTION get_facebook_sharing_preferences(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  preferences JSONB;
BEGIN
  SELECT sharing_preferences INTO preferences
  FROM facebook_integrations
  WHERE user_id = user_uuid AND connected = true;
  
  RETURN COALESCE(preferences, '{
    "auto_share_auctions": false,
    "auto_share_trades": false,
    "auto_share_achievements": false,
    "share_to_timeline": true,
    "share_to_marketplace": false,
    "share_to_groups": false,
    "selected_groups": [],
    "privacy_setting": "friends"
  }'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log successful Facebook share
CREATE OR REPLACE FUNCTION log_facebook_share(
  user_uuid UUID,
  content_type TEXT,
  content_uuid UUID,
  content_title TEXT,
  platform TEXT,
  post_id TEXT
)
RETURNS UUID AS $$
DECLARE
  share_id UUID;
BEGIN
  INSERT INTO facebook_shares (
    user_id,
    content_type,
    content_id,
    content_title,
    platform,
    post_id,
    success
  ) VALUES (
    user_uuid,
    content_type,
    content_uuid,
    content_title,
    platform,
    post_id,
    true
  ) RETURNING id INTO share_id;
  
  RETURN share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update Facebook analytics
CREATE OR REPLACE FUNCTION update_facebook_analytics(
  post_id_param TEXT,
  reach_param INTEGER,
  impressions_param INTEGER,
  clicks_param INTEGER,
  shares_param INTEGER,
  likes_param INTEGER,
  comments_param INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO facebook_analytics (
    share_id,
    post_id,
    platform,
    reach,
    impressions,
    clicks,
    shares,
    likes,
    comments
  )
  SELECT 
    fs.id,
    post_id_param,
    fs.platform,
    reach_param,
    impressions_param,
    clicks_param,
    shares_param,
    likes_param,
    comments_param
  FROM facebook_shares fs
  WHERE fs.post_id = post_id_param
  ON CONFLICT (share_id, post_id) DO UPDATE SET
    reach = EXCLUDED.reach,
    impressions = EXCLUDED.impressions,
    clicks = EXCLUDED.clicks,
    shares = EXCLUDED.shares,
    likes = EXCLUDED.likes,
    comments = EXCLUDED.comments,
    recorded_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically share auctions to Facebook when created
CREATE OR REPLACE FUNCTION trigger_facebook_auto_share()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue Facebook auto-share for new auctions
  IF TG_TABLE_NAME = 'items' AND NEW.status = 'active' THEN
    -- This would typically be handled by the application layer
    -- but we can log the trigger for potential background processing
    INSERT INTO facebook_shares (
      user_id,
      content_type,
      content_id,
      content_title,
      platform,
      success,
      error_message
    )
    SELECT 
      NEW.seller_id,
      'auction',
      NEW.id,
      NEW.title,
      'pending',
      false,
      'Auto-share queued'
    FROM facebook_integrations fi
    WHERE fi.user_id = NEW.seller_id 
    AND fi.connected = true
    AND (fi.sharing_preferences->>'auto_share_auctions')::BOOLEAN = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-sharing auctions
CREATE TRIGGER facebook_auto_share_auctions
  AFTER INSERT ON items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_facebook_auto_share();

-- Create trigger for auto-sharing trades
CREATE TRIGGER facebook_auto_share_trades
  AFTER INSERT ON trade_proposals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_facebook_auto_share();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON facebook_integrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON facebook_shares TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON facebook_marketplace_posts TO authenticated;
GRANT SELECT ON facebook_analytics TO authenticated;

GRANT EXECUTE ON FUNCTION get_facebook_sharing_preferences(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_facebook_share(UUID, TEXT, UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_facebook_analytics(TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;