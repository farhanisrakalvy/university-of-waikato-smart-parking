// Script to manually add wallet_balance column to users table
// Run this in your Supabase SQL editor or dashboard

const addWalletBalanceColumn = `
-- Add wallet_balance column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0.00;

-- Add constraint to ensure wallet balance is never negative  
ALTER TABLE users ADD CONSTRAINT wallet_balance_non_negative CHECK (wallet_balance >= 0);

-- Create index for faster wallet queries
CREATE INDEX IF NOT EXISTS idx_users_wallet_balance ON users(wallet_balance);

-- Update existing users to have 0 balance if they don't have one
UPDATE users SET wallet_balance = 0.00 WHERE wallet_balance IS NULL;
`;

console.log('Run this SQL in your Supabase dashboard:');
console.log(addWalletBalanceColumn);

export { addWalletBalanceColumn };