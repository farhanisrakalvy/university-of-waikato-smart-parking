-- Create saved_cards table for storing user payment methods
CREATE TABLE IF NOT EXISTS saved_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last4 TEXT NOT NULL,
    brand TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    cardholder_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_saved_cards_user_id ON saved_cards(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE saved_cards ENABLE ROW LEVEL SECURITY;

-- Create policies to ensure users can only access their own cards
CREATE POLICY "Users can view their own saved cards" ON saved_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved cards" ON saved_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved cards" ON saved_cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved cards" ON saved_cards
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_saved_cards_updated_at
    BEFORE UPDATE ON saved_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();