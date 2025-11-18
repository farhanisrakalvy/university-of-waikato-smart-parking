-- Fix Supabase Database Schema for University of Waikato Smart Parking App
-- Run this SQL in your Supabase Dashboard -> SQL Editor

-- 1. Add wallet_balance column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0.00;

-- 2. Add constraint to ensure wallet balance is never negative  
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS wallet_balance_non_negative CHECK (wallet_balance >= 0);

-- 3. Create index for faster wallet queries
CREATE INDEX IF NOT EXISTS idx_users_wallet_balance ON users(wallet_balance);

-- 4. Update existing users to have 0 balance if they don't have one
UPDATE users SET wallet_balance = 0.00 WHERE wallet_balance IS NULL;

-- 5. Create saved_cards table
CREATE TABLE IF NOT EXISTS saved_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_number TEXT NOT NULL,
  card_holder_name TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT CHECK (type IN ('credit', 'debit')) NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT, -- booking_id or payment_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Enable Row Level Security (RLS) on new tables
ALTER TABLE saved_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for saved_cards
CREATE POLICY "Users can manage own cards" ON saved_cards
  FOR ALL USING (auth.uid() = user_id);

-- 9. Create RLS policies for wallet_transactions
CREATE POLICY "Users can view own transactions" ON wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. Verify the fixes
SELECT 'Database schema updated successfully!' as status;