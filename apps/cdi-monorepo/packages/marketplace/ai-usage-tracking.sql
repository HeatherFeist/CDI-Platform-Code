-- AI Usage Tracking Table
-- Tracks AI feature usage for billing, analytics, and tier limit enforcement

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('text_generation', 'image_generation', 'image_editing')),
  model_used TEXT NOT NULL, -- 'gpt-3.5-turbo', 'dall-e-2', 'dall-e-3'
  prompt TEXT, -- The prompt used (for debugging/analytics)
  tokens_used INTEGER, -- For text generation
  cost_estimate DECIMAL(10, 4), -- Estimated cost in USD
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB, -- Extra data like image size, style, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature_type ON ai_usage(feature_type);

-- Index for monthly usage queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_month 
  ON ai_usage(user_id, date_trunc('month', created_at));

-- RLS Policies
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own AI usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own usage records
CREATE POLICY "Users can insert own AI usage"
  ON ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to get monthly usage by feature type
CREATE OR REPLACE FUNCTION get_monthly_ai_usage(
  p_user_id UUID,
  p_feature_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  month DATE,
  feature_type TEXT,
  usage_count BIGINT,
  total_cost DECIMAL,
  total_tokens BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('month', created_at)::DATE as month,
    ai_usage.feature_type,
    COUNT(*) as usage_count,
    SUM(cost_estimate) as total_cost,
    SUM(tokens_used) as total_tokens
  FROM ai_usage
  WHERE user_id = p_user_id
    AND (p_feature_type IS NULL OR ai_usage.feature_type = p_feature_type)
    AND success = true
  GROUP BY month, ai_usage.feature_type
  ORDER BY month DESC, ai_usage.feature_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has exceeded their tier limit
CREATE OR REPLACE FUNCTION check_ai_usage_limit(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS TABLE (
  current_usage BIGINT,
  tier_limit INTEGER,
  tier_name TEXT,
  can_use BOOLEAN
) AS $$
DECLARE
  v_tier TEXT;
  v_limit INTEGER;
  v_usage BIGINT;
BEGIN
  -- Get user's tier
  SELECT tier INTO v_tier
  FROM member_stores
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Set limits based on tier (for image generation only)
  IF p_feature_type = 'image_generation' OR p_feature_type = 'image_editing' THEN
    CASE v_tier
      WHEN 'free' THEN v_limit := 0;  -- No access
      WHEN 'partner' THEN v_limit := 50;  -- 50 images per month
      WHEN 'professional' THEN v_limit := 200;  -- 200 images per month
      WHEN 'enterprise' THEN v_limit := -1;  -- Unlimited (-1 = no limit)
      ELSE v_limit := 0;
    END CASE;
  ELSE
    -- Text generation is unlimited for all tiers
    v_limit := -1;
  END IF;

  -- Get current month's usage
  SELECT COUNT(*) INTO v_usage
  FROM ai_usage
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type
    AND date_trunc('month', created_at) = date_trunc('month', NOW())
    AND success = true;

  -- Return results
  RETURN QUERY
  SELECT 
    v_usage,
    v_limit,
    COALESCE(v_tier, 'free'),
    (v_limit = -1 OR v_usage < v_limit)::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON TABLE ai_usage IS 'Tracks all AI feature usage for billing, analytics, and tier limit enforcement';
COMMENT ON FUNCTION get_monthly_ai_usage IS 'Returns monthly AI usage statistics for a user';
COMMENT ON FUNCTION check_ai_usage_limit IS 'Checks if user has exceeded their tier limit for a specific AI feature';
