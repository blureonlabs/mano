-- Migration: Client status/type fields + structured therapist policies + recurring reservations + practices/team access

-- ============================================================
-- 1. Client status and type enums + columns
-- ============================================================

CREATE TYPE client_status AS ENUM ('active', 'inactive', 'terminated');
CREATE TYPE client_type AS ENUM ('regular', 'irregular');
CREATE TYPE client_category AS ENUM ('indian', 'nri', 'couple', 'other');

ALTER TABLE clients
  ADD COLUMN status client_status NOT NULL DEFAULT 'active',
  ADD COLUMN client_type client_type NOT NULL DEFAULT 'irregular',
  ADD COLUMN category client_category NOT NULL DEFAULT 'indian';

CREATE INDEX idx_clients_status ON clients (therapist_id, status);
CREATE INDEX idx_clients_type ON clients (therapist_id, client_type);

-- ============================================================
-- 2. Structured cancellation/booking policy fields on therapists
-- ============================================================

ALTER TABLE therapists
  ADD COLUMN cancellation_hours integer NOT NULL DEFAULT 24 CHECK (cancellation_hours BETWEEN 0 AND 168),
  ADD COLUMN min_booking_advance_hours integer NOT NULL DEFAULT 24 CHECK (min_booking_advance_hours BETWEEN 0 AND 720),
  ADD COLUMN no_show_charge_percent integer NOT NULL DEFAULT 100 CHECK (no_show_charge_percent BETWEEN 0 AND 100),
  ADD COLUMN late_cancel_charge_percent integer NOT NULL DEFAULT 100 CHECK (late_cancel_charge_percent BETWEEN 0 AND 100);

-- ============================================================
-- 3. Recurring reservations table
-- ============================================================

CREATE TABLE recurring_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  session_type_name text,
  amount_inr integer NOT NULL DEFAULT 0 CHECK (amount_inr >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (therapist_id, day_of_week, start_time),
  CHECK (start_time < end_time)
);

ALTER TABLE recurring_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists can manage own recurring reservations"
  ON recurring_reservations FOR ALL
  USING (therapist_id = auth.uid());

CREATE TRIGGER set_updated_at_recurring_reservations
  BEFORE UPDATE ON recurring_reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_recurring_reservations_therapist ON recurring_reservations (therapist_id, is_active);
CREATE INDEX idx_recurring_reservations_client ON recurring_reservations (client_id);

-- Link sessions to recurring reservations (optional FK)
ALTER TABLE sessions
  ADD COLUMN recurring_reservation_id uuid REFERENCES recurring_reservations(id) ON DELETE SET NULL;

-- ============================================================
-- 4. Practices + team access
-- ============================================================

CREATE TYPE practice_role AS ENUM ('owner', 'therapist', 'admin');

CREATE TABLE practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE practices ENABLE ROW LEVEL SECURITY;

CREATE TABLE practice_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES therapists(id) ON DELETE SET NULL,
  role practice_role NOT NULL DEFAULT 'therapist',
  can_view_notes boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (practice_id, user_id)
);

ALTER TABLE practice_members ENABLE ROW LEVEL SECURITY;

-- Practice members can see their own practice
CREATE POLICY "Members can view own practice"
  ON practices FOR SELECT
  USING (
    id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

-- Owner can INSERT/UPDATE/DELETE their practice
CREATE POLICY "Owner can insert practice"
  ON practices FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can update practice"
  ON practices FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can delete practice"
  ON practices FOR DELETE
  USING (owner_id = auth.uid());

-- Members can see fellow members
CREATE POLICY "Members can view practice members"
  ON practice_members FOR SELECT
  USING (
    practice_id IN (SELECT practice_id FROM practice_members pm WHERE pm.user_id = auth.uid())
  );

-- Owner can manage members (INSERT/UPDATE/DELETE)
CREATE POLICY "Owner can insert practice members"
  ON practice_members FOR INSERT
  WITH CHECK (
    practice_id IN (SELECT p.id FROM practices p WHERE p.owner_id = auth.uid())
  );

CREATE POLICY "Owner can update practice members"
  ON practice_members FOR UPDATE
  USING (
    practice_id IN (SELECT p.id FROM practices p WHERE p.owner_id = auth.uid())
  )
  WITH CHECK (
    practice_id IN (SELECT p.id FROM practices p WHERE p.owner_id = auth.uid())
  );

CREATE POLICY "Owner can delete practice members"
  ON practice_members FOR DELETE
  USING (
    practice_id IN (SELECT p.id FROM practices p WHERE p.owner_id = auth.uid())
  );

CREATE INDEX idx_practice_members_practice ON practice_members (practice_id);
CREATE INDEX idx_practice_members_user ON practice_members (user_id);
CREATE INDEX idx_practices_owner ON practices (owner_id);

-- Link therapists to practice (optional)
ALTER TABLE therapists
  ADD COLUMN practice_id uuid REFERENCES practices(id) ON DELETE SET NULL;

CREATE TRIGGER set_updated_at_practices
  BEFORE UPDATE ON practices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_practice_members
  BEFORE UPDATE ON practice_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 5. Session cancellation tracking (who cancelled, was it late)
-- ============================================================

CREATE TYPE cancellation_actor AS ENUM ('therapist', 'client', 'system');

ALTER TABLE sessions
  ADD COLUMN cancelled_by cancellation_actor,
  ADD COLUMN is_late_cancellation boolean DEFAULT false;
