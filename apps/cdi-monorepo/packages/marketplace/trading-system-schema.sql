-- Item Trading System Database Schema
-- Enables users to trade items directly with each other

-- Trade proposals table
CREATE TABLE IF NOT EXISTS trade_proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Trade status
    status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed', 'disputed')) DEFAULT 'pending',
    
    -- Trade message/description
    message TEXT,
    proposed_cash_amount DECIMAL(10,2) DEFAULT 0, -- Optional cash component
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT different_users CHECK (proposer_id != recipient_id)
);

-- Trade items table (items offered in each trade)
CREATE TABLE IF NOT EXISTS trade_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_proposal_id UUID REFERENCES trade_proposals(id) ON DELETE CASCADE NOT NULL,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
    offered_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- proposer or recipient
    item_condition_notes TEXT, -- Additional notes about item condition for trade
    estimated_value DECIMAL(10,2), -- User's estimated value for fair trade assessment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(trade_proposal_id, listing_id) -- Each listing can only be in a trade once
);

-- Trade negotiations/messages
CREATE TABLE IF NOT EXISTS trade_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_proposal_id UUID REFERENCES trade_proposals(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('message', 'counter_offer', 'acceptance', 'decline', 'system')) DEFAULT 'message',
    
    -- For counter offers
    proposed_cash_adjustment DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- Trade ratings/reviews (after completion)
CREATE TABLE IF NOT EXISTS trade_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_proposal_id UUID REFERENCES trade_proposals(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(trade_proposal_id, reviewer_id) -- One review per user per trade
);

-- Trade disputes
CREATE TABLE IF NOT EXISTS trade_disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_proposal_id UUID REFERENCES trade_proposals(id) ON DELETE CASCADE NOT NULL,
    disputed_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    dispute_reason TEXT CHECK (dispute_reason IN (
        'item_not_as_described', 'item_not_received', 'damaged_item', 
        'incorrect_item', 'communication_issues', 'other'
    )) NOT NULL,
    description TEXT NOT NULL,
    status TEXT CHECK (status IN ('open', 'investigating', 'resolved', 'closed')) DEFAULT 'open',
    resolution_notes TEXT,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin who resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Trade item wishlist (what users want to trade for)
CREATE TABLE IF NOT EXISTS trade_wishlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    desired_item_description TEXT NOT NULL,
    max_value DECIMAL(10,2), -- Maximum value they'd trade for this item
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade compatibility matching (automated suggestions)
CREATE TABLE IF NOT EXISTS trade_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    user1_listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
    user2_listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
    compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
    match_reasons TEXT[], -- Array of reasons why this is a good match
    is_viewed_by_user1 BOOLEAN DEFAULT FALSE,
    is_viewed_by_user2 BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT different_users_match CHECK (user1_id != user2_id),
    UNIQUE(user1_listing_id, user2_listing_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_proposals_proposer ON trade_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_trade_proposals_recipient ON trade_proposals(recipient_id);
CREATE INDEX IF NOT EXISTS idx_trade_proposals_status ON trade_proposals(status);
CREATE INDEX IF NOT EXISTS idx_trade_proposals_expires ON trade_proposals(expires_at);
CREATE INDEX IF NOT EXISTS idx_trade_items_trade_id ON trade_items(trade_proposal_id);
CREATE INDEX IF NOT EXISTS idx_trade_items_listing ON trade_items(listing_id);
CREATE INDEX IF NOT EXISTS idx_trade_messages_trade_id ON trade_messages(trade_proposal_id);
CREATE INDEX IF NOT EXISTS idx_trade_messages_unread ON trade_messages(sender_id, is_read);
CREATE INDEX IF NOT EXISTS idx_trade_wishlists_user ON trade_wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_matches_users ON trade_matches(user1_id, user2_id);

-- Enable RLS
ALTER TABLE trade_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Trade proposals: users can see trades they're involved in
CREATE POLICY "Users can view their own trade proposals" ON trade_proposals
    FOR SELECT USING (auth.uid() = proposer_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create trade proposals" ON trade_proposals
    FOR INSERT WITH CHECK (auth.uid() = proposer_id);

CREATE POLICY "Users can update their own trade proposals" ON trade_proposals
    FOR UPDATE USING (auth.uid() = proposer_id OR auth.uid() = recipient_id);

-- Trade items: users can see items in their trades
CREATE POLICY "Users can view trade items in their trades" ON trade_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trade_proposals tp 
            WHERE tp.id = trade_proposal_id 
            AND (tp.proposer_id = auth.uid() OR tp.recipient_id = auth.uid())
        )
    );

CREATE POLICY "Users can add items to their trade proposals" ON trade_items
    FOR INSERT WITH CHECK (auth.uid() = offered_by);

-- Trade messages: users can see messages in their trades
CREATE POLICY "Users can view trade messages in their trades" ON trade_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trade_proposals tp 
            WHERE tp.id = trade_proposal_id 
            AND (tp.proposer_id = auth.uid() OR tp.recipient_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their trades" ON trade_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM trade_proposals tp 
            WHERE tp.id = trade_proposal_id 
            AND (tp.proposer_id = auth.uid() OR tp.recipient_id = auth.uid())
        )
    );

-- Trade wishlists: users can manage their own wishlists
CREATE POLICY "Users can manage their own trade wishlists" ON trade_wishlists
    FOR ALL USING (auth.uid() = user_id);

-- Trade matches: users can see their own matches
CREATE POLICY "Users can view their trade matches" ON trade_matches
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Functions for trade management

-- Function to calculate trade value balance
CREATE OR REPLACE FUNCTION calculate_trade_balance(trade_id UUID)
RETURNS JSON AS $$
DECLARE
    proposer_total DECIMAL(10,2) := 0;
    recipient_total DECIMAL(10,2) := 0;
    trade_cash DECIMAL(10,2) := 0;
    proposer_user_id UUID;
    result JSON;
BEGIN
    -- Get trade details
    SELECT proposer_id, proposed_cash_amount 
    INTO proposer_user_id, trade_cash
    FROM trade_proposals 
    WHERE id = trade_id;
    
    -- Calculate proposer's offered value
    SELECT COALESCE(SUM(ti.estimated_value), 0)
    INTO proposer_total
    FROM trade_items ti
    WHERE ti.trade_proposal_id = trade_id 
    AND ti.offered_by = proposer_user_id;
    
    -- Calculate recipient's offered value  
    SELECT COALESCE(SUM(ti.estimated_value), 0)
    INTO recipient_total
    FROM trade_items ti
    WHERE ti.trade_proposal_id = trade_id 
    AND ti.offered_by != proposer_user_id;
    
    -- Create result JSON
    result := json_build_object(
        'proposer_value', proposer_total,
        'recipient_value', recipient_total,
        'cash_component', trade_cash,
        'proposer_total', proposer_total + trade_cash,
        'recipient_total', recipient_total,
        'balance_difference', (proposer_total + trade_cash) - recipient_total,
        'is_balanced', ABS((proposer_total + trade_cash) - recipient_total) <= 50 -- Within $50 is considered balanced
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to find potential trade matches
CREATE OR REPLACE FUNCTION find_trade_matches(user_id UUID, listing_id UUID)
RETURNS TABLE (
    potential_user_id UUID,
    potential_listing_id UUID,
    compatibility_score INTEGER,
    match_reasons TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH user_listing AS (
        SELECT l.*, c.name as category_name
        FROM listings l
        LEFT JOIN categories c ON l.category_id = c.id
        WHERE l.id = listing_id
    ),
    potential_matches AS (
        SELECT 
            l.seller_id,
            l.id as other_listing_id,
            l.title,
            l.category_id,
            c.name as other_category,
            ul.title as user_title,
            ul.category_name as user_category,
            ul.starting_bid as user_value,
            l.starting_bid as other_value
        FROM listings l
        JOIN categories c ON l.category_id = c.id
        CROSS JOIN user_listing ul
        WHERE l.seller_id != user_id
        AND l.status = 'active'
        AND l.seller_id NOT IN (
            -- Exclude users who already have pending trades
            SELECT recipient_id FROM trade_proposals 
            WHERE proposer_id = user_id AND status = 'pending'
            UNION
            SELECT proposer_id FROM trade_proposals 
            WHERE recipient_id = user_id AND status = 'pending'
        )
    )
    SELECT 
        pm.seller_id,
        pm.other_listing_id,
        CASE 
            WHEN pm.category_id = (SELECT category_id FROM user_listing) THEN 90
            WHEN ABS(pm.other_value - pm.user_value) <= 50 THEN 80
            WHEN pm.other_category ILIKE '%hand%' AND pm.user_category ILIKE '%hand%' THEN 85
            ELSE 60
        END as score,
        ARRAY[
            CASE WHEN pm.category_id = (SELECT category_id FROM user_listing) 
                 THEN 'Same category match' ELSE NULL END,
            CASE WHEN ABS(pm.other_value - pm.user_value) <= 50 
                 THEN 'Similar value range' ELSE NULL END,
            CASE WHEN pm.other_category ILIKE '%hand%' AND pm.user_category ILIKE '%hand%' 
                 THEN 'Both handcrafted items' ELSE NULL END
        ]::TEXT[] as reasons
    FROM potential_matches pm
    ORDER BY score DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update trade proposal updated_at
CREATE OR REPLACE FUNCTION update_trade_proposal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trade_proposal_updated_at
    BEFORE UPDATE ON trade_proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_trade_proposal_updated_at();

-- Function to automatically expire old trade proposals
CREATE OR REPLACE FUNCTION expire_old_trade_proposals()
RETURNS void AS $$
BEGIN
    UPDATE trade_proposals 
    SET status = 'cancelled'
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;