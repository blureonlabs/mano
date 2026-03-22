-- =============================================================================
-- Migration 00013: Client authentication + portal support
-- =============================================================================

-- 1. User roles table (differentiate therapists from clients)
CREATE TABLE public.user_roles (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('therapist', 'client')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_role"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "system_insert_role"
  ON public.user_roles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- 2. Backfill existing therapists into user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'therapist' FROM public.therapists
ON CONFLICT (user_id) DO NOTHING;

-- 3. Update handle_new_user trigger to support client signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  raw_name text;
  slug_base text;
  user_type text;
BEGIN
  user_type := coalesce(new.raw_user_meta_data->>'user_type', 'therapist');

  IF user_type = 'client' THEN
    -- Client signup: insert role only, do NOT create therapist record
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'client')
    ON CONFLICT (user_id) DO NOTHING;

    -- Auto-link user_id to existing client records that match by email
    UPDATE public.clients
    SET user_id = new.id
    WHERE email = new.email
      AND user_id IS NULL;

    RETURN new;
  END IF;

  -- Therapist signup (default behavior)
  raw_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  slug_base := lower(regexp_replace(raw_name, '[^a-z0-9]+', '-', 'gi'));
  slug_base := trim(both '-' from slug_base);

  INSERT INTO public.therapists (id, full_name, display_name, slug)
  VALUES (
    new.id,
    raw_name,
    split_part(raw_name, ' ', 1),
    slug_base || '-' || substr(new.id::text, 1, 4)
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'therapist')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Clients can view their own intake responses
CREATE POLICY "intake_responses_client_select"
  ON public.intake_responses FOR SELECT
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

-- 5. Clients can view their own sessions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'sessions_client_select' AND tablename = 'sessions'
  ) THEN
    CREATE POLICY "sessions_client_select"
      ON public.sessions FOR SELECT
      USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));
  END IF;
END $$;

-- 6. Index for client user_id lookups
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
