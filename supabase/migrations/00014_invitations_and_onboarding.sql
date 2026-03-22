-- =============================================================================
-- Migration 00014: Practice invitations + client onboarding tokens
-- =============================================================================

-- 1. Practice invitations table
CREATE TABLE public.practice_invitations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id  uuid NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  invited_by   uuid NOT NULL REFERENCES auth.users(id),
  token        uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  email        text,
  role         practice_role NOT NULL DEFAULT 'therapist',
  can_view_notes boolean NOT NULL DEFAULT false,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  accepted_by  uuid REFERENCES auth.users(id),
  accepted_at  timestamptz,
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_invitations ENABLE ROW LEVEL SECURITY;

-- Members of the practice can view invitations
CREATE POLICY "practice_invitations_member_select"
  ON public.practice_invitations FOR SELECT
  USING (practice_id IN (
    SELECT practice_id FROM public.practice_members WHERE user_id = auth.uid()
  ));

-- Owner can create invitations
CREATE POLICY "practice_invitations_owner_insert"
  ON public.practice_invitations FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND practice_id IN (SELECT id FROM public.practices WHERE owner_id = auth.uid())
  );

-- Owner can update invitations (revoke)
CREATE POLICY "practice_invitations_owner_update"
  ON public.practice_invitations FOR UPDATE
  USING (practice_id IN (SELECT id FROM public.practices WHERE owner_id = auth.uid()));

-- Anyone can read by token (for accepting invites) — via service role or public read
CREATE POLICY "practice_invitations_public_read_by_token"
  ON public.practice_invitations FOR SELECT
  USING (true);

CREATE INDEX idx_practice_invitations_token ON public.practice_invitations(token);
CREATE INDEX idx_practice_invitations_practice_status ON public.practice_invitations(practice_id, status);


-- 2. Client onboarding tokens table
CREATE TABLE public.client_onboarding_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
  token        uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  label        text,
  is_active    boolean NOT NULL DEFAULT true,
  max_uses     integer,
  use_count    integer NOT NULL DEFAULT 0,
  expires_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_onboarding_tokens ENABLE ROW LEVEL SECURITY;

-- Therapist manages own tokens
CREATE POLICY "onboarding_tokens_therapist_all"
  ON public.client_onboarding_tokens FOR ALL
  USING (therapist_id = auth.uid());

-- Public can read by token (for onboarding page)
CREATE POLICY "onboarding_tokens_public_read"
  ON public.client_onboarding_tokens FOR SELECT
  USING (true);

CREATE INDEX idx_onboarding_tokens_token ON public.client_onboarding_tokens(token);
CREATE INDEX idx_onboarding_tokens_therapist ON public.client_onboarding_tokens(therapist_id, is_active);
