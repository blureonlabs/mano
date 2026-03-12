-- Migration: Change column types to support encrypted data (base64 strings)
-- Encrypted columns store AES-256-GCM ciphertext as base64 text instead of
-- their original types (text[], jsonb). Decryption happens in the API layer.

-- session_notes: techniques_used text[] → text, risk_flags text[] → text
ALTER TABLE session_notes
  ALTER COLUMN techniques_used TYPE text USING techniques_used::text,
  ALTER COLUMN risk_flags TYPE text USING risk_flags::text;

-- treatment_plans: goals jsonb → text
ALTER TABLE treatment_plans
  ALTER COLUMN goals DROP DEFAULT,
  ALTER COLUMN goals TYPE text USING goals::text;
