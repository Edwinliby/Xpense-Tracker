-- Add exclude_from_budget column to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS exclude_from_budget BOOLEAN DEFAULT FALSE;
