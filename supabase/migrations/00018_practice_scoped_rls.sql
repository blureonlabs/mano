-- =============================================================================
-- Migration 00018: Practice-scoped RLS policies for multi-therapist RBAC
-- =============================================================================
-- Adds practice-aware SELECT policies so that owners/admins can view data
-- across all therapists in their practice. Mutations (INSERT, UPDATE, DELETE)
-- remain restricted to therapist_id = auth.uid() — only the data owner can modify.
-- =============================================================================

-- ============================================================
-- 1. Helper function: check if user is a practice member with specific role(s)
--    for a given target therapist.
--    SECURITY DEFINER so it runs as table owner, bypassing RLS.
--    STABLE because it does not modify data.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_practice_member_with_role(
  target_therapist_id uuid,
  required_roles text[]
) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.practice_members pm_caller
    JOIN public.practice_members pm_target
      ON pm_caller.practice_id = pm_target.practice_id
    WHERE pm_caller.user_id = auth.uid()
      AND pm_target.user_id = target_therapist_id
      AND pm_caller.role = ANY(required_roles)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users (needed for RLS evaluation)
GRANT EXECUTE ON FUNCTION public.is_practice_member_with_role(uuid, text[]) TO authenticated;


-- ============================================================
-- 2. CLIENTS — practice owner/admin can see all practice clients
-- ============================================================

-- Drop existing therapist-only SELECT policy (from 00016)
DROP POLICY IF EXISTS "clients_therapist_select" ON clients;

-- New SELECT: own rows OR practice owner/admin can view
CREATE POLICY "clients_therapist_select" ON clients
  FOR SELECT USING (
    deleted_at IS NULL AND (
      therapist_id = auth.uid()
      OR public.is_practice_member_with_role(therapist_id, ARRAY['owner', 'admin'])
    )
  );

-- NOTE: "clients_therapist_modify" (FOR ALL with therapist_id = auth.uid()) stays unchanged.
-- Only the owning therapist can INSERT/UPDATE/DELETE client rows.
-- NOTE: "clients_self_select" (FOR SELECT with user_id = auth.uid()) stays unchanged.


-- ============================================================
-- 3. SESSIONS — practice owner/admin can see all practice sessions
-- ============================================================

DROP POLICY IF EXISTS "sessions_therapist_select" ON sessions;

CREATE POLICY "sessions_therapist_select" ON sessions
  FOR SELECT USING (
    deleted_at IS NULL AND (
      therapist_id = auth.uid()
      OR public.is_practice_member_with_role(therapist_id, ARRAY['owner', 'admin'])
    )
  );

-- NOTE: "sessions_therapist_modify" stays unchanged — only owning therapist can modify.
-- NOTE: "sessions_client_select" stays unchanged — clients can still see their own sessions.


-- ============================================================
-- 4. SESSION NOTES — owner with can_view_notes=true can see all practice notes.
--    Admin CANNOT see notes (enforced both here and in tRPC clinicalProcedure).
-- ============================================================

DROP POLICY IF EXISTS "session_notes_therapist_select" ON session_notes;

CREATE POLICY "session_notes_therapist_select" ON session_notes
  FOR SELECT USING (
    deleted_at IS NULL AND (
      therapist_id = auth.uid()
      OR (
        -- Practice owner who has can_view_notes permission
        public.is_practice_member_with_role(therapist_id, ARRAY['owner'])
        AND EXISTS (
          SELECT 1 FROM public.practice_members
          WHERE user_id = auth.uid()
            AND can_view_notes = true
        )
      )
    )
  );

-- NOTE: "session_notes_therapist_modify" stays unchanged — only owning therapist can modify.


-- ============================================================
-- 5. INVOICES — practice owner/admin can see all practice invoices
-- ============================================================

-- The original policy "invoices_therapist" is FOR ALL. We need to split it
-- into a modify policy and a practice-aware SELECT policy.
DROP POLICY IF EXISTS "invoices_therapist" ON invoices;

-- Modify (INSERT/UPDATE/DELETE): only owning therapist
CREATE POLICY "invoices_therapist_modify" ON invoices
  FOR ALL USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

-- SELECT: own rows OR practice owner/admin
CREATE POLICY "invoices_therapist_select" ON invoices
  FOR SELECT USING (
    therapist_id = auth.uid()
    OR public.is_practice_member_with_role(therapist_id, ARRAY['owner', 'admin'])
  );

-- NOTE: "invoices_client_select" stays unchanged — clients can still see their own invoices.


-- ============================================================
-- 6. RECURRING RESERVATIONS — practice owner/admin can view
-- ============================================================

-- Drop existing FOR ALL policy
DROP POLICY IF EXISTS "Therapists can manage own recurring reservations" ON recurring_reservations;

-- Modify: only owning therapist
CREATE POLICY "recurring_reservations_therapist_modify" ON recurring_reservations
  FOR ALL USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

-- SELECT: own rows OR practice owner/admin
CREATE POLICY "recurring_reservations_therapist_select" ON recurring_reservations
  FOR SELECT USING (
    therapist_id = auth.uid()
    OR public.is_practice_member_with_role(therapist_id, ARRAY['owner', 'admin'])
  );


-- ============================================================
-- 7. AVAILABILITY — practice owner/admin can view schedules
-- ============================================================

DROP POLICY IF EXISTS "availability_all_own" ON availability;

-- Modify: only owning therapist
CREATE POLICY "availability_therapist_modify" ON availability
  FOR ALL USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

-- SELECT: own rows OR practice owner/admin
CREATE POLICY "availability_therapist_select" ON availability
  FOR SELECT USING (
    therapist_id = auth.uid()
    OR public.is_practice_member_with_role(therapist_id, ARRAY['owner', 'admin'])
  );


-- ============================================================
-- 8. BLOCKED SLOTS — practice owner/admin can view
-- ============================================================

DROP POLICY IF EXISTS "blocked_slots_all_own" ON blocked_slots;

-- Modify: only owning therapist
CREATE POLICY "blocked_slots_therapist_modify" ON blocked_slots
  FOR ALL USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());

-- SELECT: own rows OR practice owner/admin
CREATE POLICY "blocked_slots_therapist_select" ON blocked_slots
  FOR SELECT USING (
    therapist_id = auth.uid()
    OR public.is_practice_member_with_role(therapist_id, ARRAY['owner', 'admin'])
  );


-- ============================================================
-- 9. INDEX for practice_members lookups used by the helper function
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_practice_members_practice_user
  ON practice_members(practice_id, user_id);
