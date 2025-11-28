-- Add payment_method_id and additional payment fields to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_method_id VARCHAR,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR,
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS seller_amount DECIMAL(10,2);

-- Update the payment_status enum to include more statuses
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'failed';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'refunded';

-- Create saved_payment_methods table for storing user's saved cards
CREATE TABLE IF NOT EXISTS saved_payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR NOT NULL,
    last4 VARCHAR(4) NOT NULL,
    brand VARCHAR(20) NOT NULL,
    exp_month INTEGER NOT NULL,
    exp_year INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_user_id ON saved_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent ON transactions(stripe_payment_intent_id);

-- Enable RLS on saved_payment_methods
ALTER TABLE saved_payment_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for saved_payment_methods
CREATE POLICY "Users can view their own payment methods" ON saved_payment_methods
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods" ON saved_payment_methods
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" ON saved_payment_methods
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" ON saved_payment_methods
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_payment_methods_updated_at
    BEFORE UPDATE ON saved_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_payment_methods_updated_at();

-- Ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this card as default, unset all other defaults for this user
    IF NEW.is_default = true THEN
        UPDATE saved_payment_methods 
        SET is_default = false 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_payment_method
    BEFORE INSERT OR UPDATE ON saved_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_payment_method();