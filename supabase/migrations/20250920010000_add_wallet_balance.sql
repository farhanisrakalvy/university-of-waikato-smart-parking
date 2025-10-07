-- Add wallet_balance column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0.00;

-- Add constraint to ensure balance is never negative
ALTER TABLE users ADD CONSTRAINT check_positive_balance CHECK (wallet_balance >= 0);

-- Create index for faster wallet balance queries
CREATE INDEX IF NOT EXISTS idx_users_wallet_balance ON users(wallet_balance);