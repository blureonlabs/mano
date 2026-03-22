-- =============================================================================
-- Migration 00015: Fix infinite recursion in practice_members RLS
-- =============================================================================

-- The SELECT policy on practice_members references practice_members itself,
-- causing infinite recursion. Replace with a non-recursive check via user_id.

DROP POLICY IF EXISTS "Members can view practice members" ON practice_members;

-- Members can see fellow members: check via direct user_id match first,
-- then join through practices table to avoid self-referencing.
CREATE POLICY "Members can view practice members"
  ON practice_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
  );
