-- Migration: Add configurable session types (intro call, regular, custom)
-- Stored as JSONB array on therapists table for per-therapist configuration.

-- 1. Add session_types column to therapists
ALTER TABLE public.therapists
  ADD COLUMN session_types jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Add session_type_name to sessions (records the type name at booking time)
ALTER TABLE public.sessions
  ADD COLUMN session_type_name text;

-- 3. Backfill existing therapists with default types
UPDATE public.therapists
SET session_types = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'name', 'Intro Call',
    'duration_mins', 15,
    'rate_inr', 0,
    'description', 'A free introductory call to see if we are a good fit.',
    'is_active', true,
    'sort_order', 0
  ),
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'name', 'Regular Session',
    'duration_mins', session_duration_mins,
    'rate_inr', session_rate_inr,
    'description', NULL::text,
    'is_active', true,
    'sort_order', 1
  )
);

-- 4. Update handle_new_user() to seed default session types on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  raw_name text;
  slug_base text;
BEGIN
  raw_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  slug_base := lower(regexp_replace(raw_name, '[^a-z0-9]+', '-', 'gi'));
  slug_base := trim(both '-' from slug_base);

  INSERT INTO public.therapists (id, full_name, display_name, slug, session_types)
  VALUES (
    new.id,
    raw_name,
    split_part(raw_name, ' ', 1),
    slug_base || '-' || substr(new.id::text, 1, 4),
    jsonb_build_array(
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'name', 'Intro Call',
        'duration_mins', 15,
        'rate_inr', 0,
        'description', 'A free introductory call to see if we are a good fit.',
        'is_active', true,
        'sort_order', 0
      ),
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'name', 'Regular Session',
        'duration_mins', 50,
        'rate_inr', 0,
        'description', NULL::text,
        'is_active', true,
        'sort_order', 1
      )
    )
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
