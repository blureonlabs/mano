-- Migration: Normalize session_types from JSONB on therapists into a proper table
-- This enables indexing, foreign keys, and tiered pricing per client category.

-- 1. Create the session_types table
CREATE TABLE IF NOT EXISTS public.session_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_mins integer NOT NULL DEFAULT 50,
  rate_inr integer NOT NULL DEFAULT 150000, -- default rate in paise (₹1,500)
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  intake_form_id uuid REFERENCES public.intake_forms(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_session_type_name UNIQUE (therapist_id, name)
);

-- 2. Tiered pricing: different rates per client category
CREATE TABLE IF NOT EXISTS public.session_type_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type_id uuid NOT NULL REFERENCES public.session_types(id) ON DELETE CASCADE,
  client_category text NOT NULL, -- 'indian', 'nri', 'couple', etc.
  rate_inr integer NOT NULL,     -- rate in paise

  CONSTRAINT uq_session_type_rate UNIQUE (session_type_id, client_category)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_session_types_therapist ON public.session_types(therapist_id, is_active);
CREATE INDEX IF NOT EXISTS idx_session_type_rates_type ON public.session_type_rates(session_type_id);

-- 4. RLS
ALTER TABLE public.session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_type_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_types_therapist" ON public.session_types
  FOR ALL USING (therapist_id = auth.uid());

CREATE POLICY "session_type_rates_therapist" ON public.session_type_rates
  FOR ALL USING (
    session_type_id IN (
      SELECT id FROM public.session_types WHERE therapist_id = auth.uid()
    )
  );

-- Public read access for booking page (session types need to be visible)
CREATE POLICY "session_types_public_read" ON public.session_types
  FOR SELECT USING (is_active = true);

CREATE POLICY "session_type_rates_public_read" ON public.session_type_rates
  FOR SELECT USING (
    session_type_id IN (
      SELECT id FROM public.session_types WHERE is_active = true
    )
  );

-- 5. Updated_at trigger (reuses existing set_updated_at function from 00001)
CREATE TRIGGER trg_session_types_updated_at
  BEFORE UPDATE ON public.session_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Migrate existing JSONB data into the new table
-- Reads the JSONB session_types array from therapists and inserts rows.
-- Field names match the JSONB shape: id, name, duration_mins, rate_inr, description, is_active, sort_order, intake_form_id
DO $$
DECLARE
  t RECORD;
  st RECORD;
  elem_id uuid;
  form_id uuid;
BEGIN
  FOR t IN SELECT id, session_types FROM public.therapists
           WHERE session_types IS NOT NULL
             AND session_types != '[]'::jsonb
  LOOP
    FOR st IN SELECT * FROM jsonb_array_elements(t.session_types) AS elem
    LOOP
      -- Parse intake_form_id if present and valid
      BEGIN
        form_id := (st.elem->>'intake_form_id')::uuid;
      EXCEPTION WHEN OTHERS THEN
        form_id := NULL;
      END;

      -- Use the existing UUID from JSONB if present, otherwise generate one
      BEGIN
        elem_id := (st.elem->>'id')::uuid;
      EXCEPTION WHEN OTHERS THEN
        elem_id := gen_random_uuid();
      END;

      INSERT INTO public.session_types (id, therapist_id, name, duration_mins, rate_inr, description, is_active, sort_order, intake_form_id)
      VALUES (
        elem_id,
        t.id,
        COALESCE(st.elem->>'name', 'Therapy Session'),
        COALESCE((st.elem->>'duration_mins')::integer, 50),
        COALESCE((st.elem->>'rate_inr')::integer, 150000),
        st.elem->>'description',
        COALESCE((st.elem->>'is_active')::boolean, true),
        COALESCE((st.elem->>'sort_order')::integer, 0),
        form_id
      )
      ON CONFLICT (therapist_id, name) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 7. Update handle_new_user() to create session_types rows instead of JSONB
-- (The JSONB column on therapists is kept for now but will no longer be the source of truth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  raw_name text;
  slug_base text;
  user_type text;
BEGIN
  user_type := coalesce(new.raw_user_meta_data->>'user_type', 'therapist');

  IF user_type = 'client' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'client')
    ON CONFLICT (user_id) DO NOTHING;

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

  -- Create default session types in the new table
  INSERT INTO public.session_types (therapist_id, name, duration_mins, rate_inr, description, is_active, sort_order)
  VALUES
    (new.id, 'Intro Call', 15, 0, 'A free introductory call to see if we are a good fit.', true, 0),
    (new.id, 'Regular Session', 50, 0, NULL, true, 1);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'therapist')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
