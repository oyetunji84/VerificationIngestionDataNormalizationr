-- Migration: set default for wallet_transactions.id

-- Ensure the extension providing gen_random_uuid() is available (pgcrypto in most setups)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE wallet_transactions
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

