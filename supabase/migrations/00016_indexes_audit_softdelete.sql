-- =============================================================================
-- Migration 00016: Performance indexes, audit logging, and soft delete
-- =============================================================================

-- ============================================================
-- 1. ADD MISSING INDEXES
-- ============================================================

-- Sessions: client lookup
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);

-- Sessions: therapist + starts_at already exists as idx_sessions_starts_at,
--           but add a compound therapist + status index
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_status ON sessions(therapist_id, status);

-- Invoices: client lookup
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);

-- Invoices: therapist + status
CREATE INDEX IF NOT EXISTS idx_invoices_therapist_status ON invoices(therapist_id, status);

-- Messages: unread filtering (uses read_at IS NULL instead of is_read boolean)
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(therapist_id, sender_type)
  WHERE read_at IS NULL;

-- Recurring reservations: day-of-week lookup
CREATE INDEX IF NOT EXISTS idx_recurring_reservations_day ON recurring_reservations(therapist_id, day_of_week, is_active);

-- Session notes: therapist lookup
CREATE INDEX IF NOT EXISTS idx_session_notes_therapist ON session_notes(therapist_id);

-- NOTE: The following indexes already exist and are NOT re-created:
--   idx_sessions_starts_at          → sessions(therapist_id, starts_at)
--   idx_session_notes_session       → session_notes(session_id)
--   idx_messages_thread             → messages(therapist_id, client_id, created_at)
--   idx_blocked_slots_range         → blocked_slots(therapist_id, start_at, end_at)
--   idx_intake_responses_access_token → intake_responses(access_token)
--   idx_practice_members_user       → practice_members(user_id)


-- ============================================================
-- 2. AUDIT LOGGING TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id  uuid NOT NULL REFERENCES auth.users(id),
  actor_id      uuid NOT NULL REFERENCES auth.users(id),
  action        text NOT NULL,       -- 'create', 'update', 'delete', 'view', 'decrypt'
  entity_type   text NOT NULL,       -- 'session_note', 'treatment_plan', 'client', 'session', etc.
  entity_id     uuid,
  changes       jsonb,               -- {field: {old: ..., new: ...}}
  ip_address    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_therapist ON audit_logs(therapist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_therapist_read" ON audit_logs
  FOR SELECT USING (therapist_id = auth.uid());

CREATE POLICY "audit_logs_therapist_insert" ON audit_logs
  FOR INSERT WITH CHECK (therapist_id = auth.uid());


-- ============================================================
-- 3. SOFT DELETE COLUMNS
-- ============================================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Partial indexes for efficient active-row filtering
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(therapist_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(therapist_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_session_notes_active ON session_notes(therapist_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_treatment_plans_active ON treatment_plans(therapist_id) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Update RLS policies to exclude soft-deleted rows from SELECT.
--
-- The existing policies use FOR ALL (covers SELECT, INSERT, UPDATE, DELETE).
-- We must split them: keep a permissive policy for INSERT/UPDATE/DELETE,
-- and create a new SELECT policy that filters out soft-deleted rows.
-- ---------------------------------------------------------------------------

-- --- CLIENTS ---
-- Drop the existing FOR ALL policy
DROP POLICY IF EXISTS "clients_therapist" ON clients;

-- Re-create for INSERT/UPDATE/DELETE (no deleted_at filter needed for writes)
CREATE POLICY "clients_therapist_modify" ON clients
  FOR ALL USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

-- SELECT excludes soft-deleted rows
CREATE POLICY "clients_therapist_select" ON clients
  FOR SELECT USING (therapist_id = auth.uid() AND deleted_at IS NULL);

-- --- SESSIONS ---
DROP POLICY IF EXISTS "sessions_therapist" ON sessions;

CREATE POLICY "sessions_therapist_modify" ON sessions
  FOR ALL USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "sessions_therapist_select" ON sessions
  FOR SELECT USING (therapist_id = auth.uid() AND deleted_at IS NULL);

-- --- SESSION NOTES ---
DROP POLICY IF EXISTS "session_notes_therapist" ON session_notes;

CREATE POLICY "session_notes_therapist_modify" ON session_notes
  FOR ALL USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "session_notes_therapist_select" ON session_notes
  FOR SELECT USING (therapist_id = auth.uid() AND deleted_at IS NULL);

-- --- TREATMENT PLANS ---
DROP POLICY IF EXISTS "treatment_plans_therapist" ON treatment_plans;

CREATE POLICY "treatment_plans_therapist_modify" ON treatment_plans
  FOR ALL USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "treatment_plans_therapist_select" ON treatment_plans
  FOR SELECT USING (therapist_id = auth.uid() AND deleted_at IS NULL);
