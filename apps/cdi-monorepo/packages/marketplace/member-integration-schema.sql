-- Member Integration Database Schema
-- Run this in Supabase SQL Editor to set up member integration system

-- 1. Member Applications Table
CREATE TABLE IF NOT EXISTS member_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Application Data
  applicant_email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  
  -- Store Information
  store_name TEXT NOT NULL,
  store_description TEXT,
  business_type TEXT,
  
  -- Membership Details
  tier_requested TEXT NOT NULL DEFAULT 'free',
  referral_code TEXT,
  mentor_username TEXT,
  
  -- Status Tracking
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, under_review
  processed_at TIMESTAMP,
  processed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  
  -- Integration Tracking
  google_form_id TEXT,
  google_workspace_data JSONB,
  application_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Member Stores Table
CREATE TABLE IF NOT EXISTS member_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  
  -- Store Details
  store_name TEXT NOT NULL,
  store_slug TEXT UNIQUE NOT NULL,
  description TEXT,
  business_type TEXT,
  
  -- Store Settings
  tier TEXT NOT NULL DEFAULT 'free',
  status TEXT DEFAULT 'active', -- active, suspended, inactive
  featured BOOLEAN DEFAULT FALSE,
  
  -- Branding
  logo_url TEXT,
  banner_url TEXT,
  theme_color TEXT DEFAULT '#3B82F6',
  
  -- Contact & Location
  contact_email TEXT,
  contact_phone TEXT,
  business_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  
  -- Social Links
  website_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  
  -- Settings
  auto_approve_orders BOOLEAN DEFAULT FALSE,
  minimum_order_amount DECIMAL(10,2) DEFAULT 0,
  shipping_policy TEXT,
  return_policy TEXT,
  
  -- Analytics
  views_count INTEGER DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Member Mentorship Table
CREATE TABLE IF NOT EXISTS member_mentorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES auth.users(id),
  mentee_id UUID REFERENCES auth.users(id),
  
  -- Mentorship Details
  status TEXT DEFAULT 'active', -- active, completed, paused, terminated
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  
  -- Goals and Progress
  goals TEXT[],
  progress_notes TEXT,
  last_contact_at TIMESTAMP,
  next_meeting_at TIMESTAMP,
  
  -- Evaluation
  mentor_rating INTEGER CHECK (mentor_rating >= 1 AND mentor_rating <= 5),
  mentee_rating INTEGER CHECK (mentee_rating >= 1 AND mentee_rating <= 5),
  feedback TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(mentor_id, mentee_id)
);

-- 4. Google Workspace Integration Table
CREATE TABLE IF NOT EXISTS google_workspace_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Google Data
  google_form_id TEXT,
  google_sheet_id TEXT,
  google_drive_folder_id TEXT,
  form_response_id TEXT,
  
  -- Sync Status
  sync_status TEXT DEFAULT 'pending', -- pending, synced, failed, skipped
  sync_attempts INTEGER DEFAULT 0,
  last_sync_at TIMESTAMP,
  error_message TEXT,
  
  -- Application Link
  application_id UUID REFERENCES member_applications(id),
  user_id UUID REFERENCES auth.users(id),
  
  -- Raw Data
  form_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Update profiles table for member data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_nonprofit_member BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_tier TEXT DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_since TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_mentor BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_type TEXT;

-- 6. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_member_applications_status ON member_applications(status);
CREATE INDEX IF NOT EXISTS idx_member_applications_tier ON member_applications(tier_requested);
CREATE INDEX IF NOT EXISTS idx_member_applications_created_at ON member_applications(created_at);

CREATE INDEX IF NOT EXISTS idx_member_stores_tier ON member_stores(tier);
CREATE INDEX IF NOT EXISTS idx_member_stores_status ON member_stores(status);
CREATE INDEX IF NOT EXISTS idx_member_stores_featured ON member_stores(featured);
CREATE INDEX IF NOT EXISTS idx_member_stores_city_state ON member_stores(city, state);

CREATE INDEX IF NOT EXISTS idx_member_mentorships_mentor ON member_mentorships(mentor_id);
CREATE INDEX IF NOT EXISTS idx_member_mentorships_mentee ON member_mentorships(mentee_id);
CREATE INDEX IF NOT EXISTS idx_member_mentorships_status ON member_mentorships(status);

CREATE INDEX IF NOT EXISTS idx_google_workspace_sync_status ON google_workspace_sync(sync_status);
CREATE INDEX IF NOT EXISTS idx_google_workspace_sync_form_id ON google_workspace_sync(google_form_id);

CREATE INDEX IF NOT EXISTS idx_profiles_member_tier ON profiles(member_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_is_nonprofit_member ON profiles(is_nonprofit_member);

-- 7. Row Level Security (RLS) Policies
ALTER TABLE member_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_workspace_sync ENABLE ROW LEVEL SECURITY;

-- Member Applications Policies
CREATE POLICY "Users can view their own applications" ON member_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications" ON member_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications" ON member_applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Member Stores Policies
CREATE POLICY "Anyone can view active stores" ON member_stores
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage their own store" ON member_stores
  FOR ALL USING (auth.uid() = user_id);

-- Member Mentorships Policies
CREATE POLICY "Users can view their mentorships" ON member_mentorships
  FOR SELECT USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

CREATE POLICY "Mentors can update their mentorships" ON member_mentorships
  FOR UPDATE USING (auth.uid() = mentor_id);

-- Google Workspace Sync Policies
CREATE POLICY "Admins can access sync data" ON google_workspace_sync
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 8. Functions for Automated Processing

-- Function to create store slug
CREATE OR REPLACE FUNCTION generate_store_slug(store_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(store_name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Function to auto-process free tier applications
CREATE OR REPLACE FUNCTION auto_process_free_tier_application()
RETURNS TRIGGER AS $$
DECLARE
  store_slug_value TEXT;
  slug_counter INTEGER := 0;
  base_slug TEXT;
BEGIN
  -- Only auto-process free tier applications
  IF NEW.tier_requested = 'free' AND NEW.status = 'pending' THEN
    -- Generate unique store slug
    base_slug := generate_store_slug(NEW.store_name);
    store_slug_value := base_slug;
    
    -- Ensure slug is unique
    WHILE EXISTS (SELECT 1 FROM member_stores WHERE store_slug = store_slug_value) LOOP
      slug_counter := slug_counter + 1;
      store_slug_value := base_slug || '-' || slug_counter;
    END LOOP;
    
    -- Create the member store
    INSERT INTO member_stores (
      user_id,
      store_name,
      store_slug,
      description,
      business_type,
      tier,
      contact_email,
      city,
      state,
      zip_code
    ) VALUES (
      NEW.user_id,
      NEW.store_name,
      store_slug_value,
      NEW.store_description,
      NEW.business_type,
      NEW.tier_requested,
      NEW.applicant_email,
      NEW.city,
      NEW.state,
      NEW.zip_code
    );
    
    -- Update user profile
    UPDATE profiles SET
      is_nonprofit_member = true,
      member_tier = NEW.tier_requested,
      member_since = NOW(),
      business_name = NEW.store_name,
      business_type = NEW.business_type,
      city = NEW.city,
      state = NEW.state
    WHERE id = NEW.user_id;
    
    -- Auto-approve the application
    NEW.status := 'approved';
    NEW.processed_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-processing
CREATE TRIGGER auto_process_free_tier_applications
  BEFORE INSERT ON member_applications
  FOR EACH ROW
  EXECUTE FUNCTION auto_process_free_tier_application();

-- 9. Sample Data for Testing
INSERT INTO member_applications (
  user_id,
  applicant_email,
  first_name,
  last_name,
  phone,
  address,
  city,
  state,
  zip_code,
  store_name,
  store_description,
  business_type,
  tier_requested,
  status
) VALUES (
  gen_random_uuid(), -- This would be a real user_id in practice
  'test@example.com',
  'Test',
  'User',
  '555-123-4567',
  '123 Main St',
  'Dayton',
  'OH',
  '45402',
  'Test Store',
  'A sample store for testing',
  'handmade',
  'free',
  'approved'
) ON CONFLICT DO NOTHING;

-- 10. Views for Easy Querying

-- Active Member Stores View
CREATE OR REPLACE VIEW active_member_stores AS
SELECT 
  ms.*,
  p.username,
  p.avatar_url,
  p.rating,
  COUNT(l.id) as total_listings,
  COUNT(CASE WHEN l.status = 'sold' THEN 1 END) as total_sales
FROM member_stores ms
LEFT JOIN profiles p ON ms.user_id = p.id
LEFT JOIN listings l ON ms.user_id = l.seller_id
WHERE ms.status = 'active'
GROUP BY ms.id, p.id;

-- Member Directory View
CREATE OR REPLACE VIEW member_directory AS
SELECT 
  p.id,
  p.username,
  p.avatar_url,
  p.bio,
  p.city,
  p.state,
  p.member_tier,
  p.member_since,
  p.business_name,
  p.business_type,
  ms.store_name,
  ms.store_slug,
  ms.featured,
  ms.views_count,
  ms.orders_count,
  ms.total_sales
FROM profiles p
JOIN member_stores ms ON p.id = ms.user_id
WHERE p.is_nonprofit_member = true AND ms.status = 'active';

-- Comments and Documentation
COMMENT ON TABLE member_applications IS 'Stores member applications from various sources including Google Forms';
COMMENT ON TABLE member_stores IS 'Individual member stores with their settings and branding';
COMMENT ON TABLE member_mentorships IS 'Tracks mentor-mentee relationships within the community';
COMMENT ON TABLE google_workspace_sync IS 'Manages synchronization with Google Workspace tools';

SELECT 'Member integration database schema created successfully!' as status;