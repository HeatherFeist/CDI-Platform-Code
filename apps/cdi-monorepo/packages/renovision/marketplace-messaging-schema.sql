-- ====================================================================
-- MARKETPLACE MESSAGING & VIDEO INSPECTION SYSTEM
-- ====================================================================
-- Real-time chat and video calls for product inspections
-- ====================================================================

-- Conversations between buyers and sellers
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES marketplace_products(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'archived', 'blocked'
    archived_by UUID, -- Who archived it
    
    -- Metadata
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_preview TEXT, -- Preview of last message
    unread_count_buyer INT DEFAULT 0,
    unread_count_seller INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate conversations for same product/users
    UNIQUE(product_id, buyer_id, seller_id)
);

-- Individual messages in conversations
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    
    -- Message content
    message_type TEXT DEFAULT 'text', -- 'text', 'image', 'video_call_invite', 'video_call_ended', 'system', 'purchase_complete'
    message_text TEXT,
    image_url TEXT,
    
    -- Video call metadata
    video_call_id TEXT, -- Daily.co room ID
    video_call_url TEXT, -- Join URL
    video_call_duration_seconds INT, -- Call length
    video_call_status TEXT, -- 'pending', 'accepted', 'declined', 'ended'
    
    -- Read receipts
    read_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- System messages (automated)
    is_system BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video call history (for analytics and safety)
CREATE TABLE IF NOT EXISTS video_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES marketplace_products(id) ON DELETE SET NULL,
    
    -- Participants
    caller_id UUID NOT NULL, -- Who initiated
    recipient_id UUID NOT NULL, -- Who received invitation
    
    -- Daily.co integration
    daily_room_id TEXT NOT NULL,
    daily_room_url TEXT NOT NULL,
    
    -- Call lifecycle
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'ended', 'missed'
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INT,
    
    -- Quality metrics (for troubleshooting)
    connection_quality TEXT, -- 'excellent', 'good', 'poor'
    
    -- Post-call feedback
    caller_rating INT CHECK (caller_rating >= 1 AND caller_rating <= 5),
    recipient_rating INT CHECK (recipient_rating >= 1 AND recipient_rating <= 5),
    caller_feedback TEXT,
    recipient_feedback TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS message_notification_settings (
    user_id UUID PRIMARY KEY,
    
    -- Notification channels
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    
    -- Frequency
    instant_notifications BOOLEAN DEFAULT true, -- Every message
    digest_notifications BOOLEAN DEFAULT false, -- Daily summary
    
    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_product ON conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);

-- Video calls
CREATE INDEX IF NOT EXISTS idx_video_calls_conversation ON video_calls(conversation_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_caller ON video_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_recipient ON video_calls(recipient_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON video_calls(status);
CREATE INDEX IF NOT EXISTS idx_video_calls_created ON video_calls(created_at DESC);

-- ====================================================================
-- TRIGGERS FOR REAL-TIME UPDATES
-- ====================================================================

-- Update conversation's last_message_at when new message sent
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(COALESCE(NEW.message_text, NEW.message_type), 100),
        updated_at = NEW.created_at,
        -- Increment unread count for recipient
        unread_count_buyer = CASE 
            WHEN NEW.sender_id = (SELECT seller_id FROM conversations WHERE id = NEW.conversation_id)
            THEN unread_count_buyer + 1
            ELSE unread_count_buyer
        END,
        unread_count_seller = CASE 
            WHEN NEW.sender_id = (SELECT buyer_id FROM conversations WHERE id = NEW.conversation_id)
            THEN unread_count_seller + 1
            ELSE unread_count_seller
        END
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Reset unread count when messages are read
CREATE OR REPLACE FUNCTION reset_unread_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
        UPDATE conversations
        SET 
            unread_count_buyer = CASE 
                WHEN NEW.sender_id = (SELECT seller_id FROM conversations WHERE id = NEW.conversation_id)
                THEN GREATEST(unread_count_buyer - 1, 0)
                ELSE unread_count_buyer
            END,
            unread_count_seller = CASE 
                WHEN NEW.sender_id = (SELECT buyer_id FROM conversations WHERE id = NEW.conversation_id)
                THEN GREATEST(unread_count_seller - 1, 0)
                ELSE unread_count_seller
            END
        WHERE id = NEW.conversation_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reset_unread_count
    AFTER UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION reset_unread_count();

-- Update video call duration when ended
CREATE OR REPLACE FUNCTION calculate_video_call_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
        NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INT;
        NEW.status := 'ended';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_video_call_duration
    BEFORE UPDATE ON video_calls
    FOR EACH ROW
    EXECUTE FUNCTION calculate_video_call_duration();

-- ====================================================================
-- HELPER FUNCTIONS
-- ====================================================================

-- Get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_product_id UUID,
    p_buyer_id UUID,
    p_seller_id UUID
) RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Try to find existing conversation
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE product_id = p_product_id
      AND buyer_id = p_buyer_id
      AND seller_id = p_seller_id;
    
    -- If not found, create new conversation
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (product_id, buyer_id, seller_id)
        VALUES (p_product_id, p_buyer_id, p_seller_id)
        RETURNING id INTO v_conversation_id;
    ELSE
        -- Reactivate if archived
        UPDATE conversations
        SET status = 'active', updated_at = NOW()
        WHERE id = v_conversation_id AND status = 'archived';
    END IF;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Mark all messages in conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_read(
    p_conversation_id UUID,
    p_user_id UUID
) RETURNS INT AS $$
DECLARE
    v_updated_count INT;
BEGIN
    UPDATE messages
    SET read_at = NOW()
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND read_at IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    -- Reset unread count for this user
    UPDATE conversations
    SET 
        unread_count_buyer = CASE WHEN buyer_id = p_user_id THEN 0 ELSE unread_count_buyer END,
        unread_count_seller = CASE WHEN seller_id = p_user_id THEN 0 ELSE unread_count_seller END
    WHERE id = p_conversation_id;
    
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Get unread message count for user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT 
        COALESCE(SUM(
            CASE 
                WHEN buyer_id = p_user_id THEN unread_count_buyer
                WHEN seller_id = p_user_id THEN unread_count_seller
                ELSE 0
            END
        ), 0)::INT
    INTO v_count
    FROM conversations
    WHERE (buyer_id = p_user_id OR seller_id = p_user_id)
      AND status = 'active';
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- DISABLE RLS (Nonprofit Security Approach)
-- ====================================================================

ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE video_calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_notification_settings DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- SEED DEFAULT NOTIFICATION SETTINGS
-- ====================================================================

-- Users will get default settings on first message (handled in app)

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

SELECT 
    '✅ Messaging Tables Created' as status,
    COUNT(DISTINCT table_name) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('conversations', 'messages', 'video_calls', 'message_notification_settings');

SELECT 
    '✅ Indexes Created' as status,
    COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages', 'video_calls');

SELECT 
    '✅ Functions Created' as status,
    COUNT(*) as function_count
FROM pg_proc
WHERE proname IN (
    'update_conversation_last_message',
    'reset_unread_count',
    'calculate_video_call_duration',
    'get_or_create_conversation',
    'mark_conversation_read',
    'get_unread_message_count'
);

-- ====================================================================
-- READY FOR IMPLEMENTATION! 🚀
-- ====================================================================
-- Next Steps:
-- 1. Set up Daily.co account (https://daily.co - free tier)
-- 2. Build chat UI component
-- 3. Integrate Supabase Realtime subscriptions
-- 4. Add "Message Seller" button to product pages
-- ====================================================================
