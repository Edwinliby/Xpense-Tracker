-- Add missing columns for Lent/Debt features
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS is_lent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lent_to TEXT;

-- Add missing columns for Recurring Transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_interval TEXT,
ADD COLUMN IF NOT EXISTS next_occurrence TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS parent_id TEXT;
