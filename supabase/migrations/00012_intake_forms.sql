-- Migration: Intake forms (therapist-defined templates) + intake responses (encrypted client submissions)

-- ============================================================
-- 1. Intake form status enum
-- ============================================================
CREATE TYPE public.intake_form_status AS ENUM ('draft', 'active', 'archived');

-- ============================================================
-- 2. Intake forms table (therapist-created form templates)
-- ============================================================
CREATE TABLE public.intake_forms (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id   uuid NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,

  name           text NOT NULL,
  description    text,
  form_type      text NOT NULL DEFAULT 'individual',
  status         public.intake_form_status NOT NULL DEFAULT 'draft',

  -- Field definitions stored as JSONB array
  -- Each field: { id, type, label, placeholder?, required, options?, agreement_text?, sort_order }
  fields         jsonb NOT NULL DEFAULT '[]'::jsonb,

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.intake_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "intake_forms_therapist"
  ON public.intake_forms FOR ALL
  USING (therapist_id = auth.uid());

CREATE TRIGGER trg_intake_forms_updated_at
  BEFORE UPDATE ON public.intake_forms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_intake_forms_therapist ON public.intake_forms (therapist_id);
CREATE INDEX idx_intake_forms_status ON public.intake_forms (therapist_id, status);

-- ============================================================
-- 3. Intake response status enum
-- ============================================================
CREATE TYPE public.intake_response_status AS ENUM ('pending', 'submitted');

-- ============================================================
-- 4. Intake responses table (client submissions)
-- ============================================================
CREATE TABLE public.intake_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id    uuid NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
  client_id       uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  intake_form_id  uuid NOT NULL REFERENCES public.intake_forms(id) ON DELETE CASCADE,
  session_id      uuid REFERENCES public.sessions(id) ON DELETE SET NULL,

  -- Unique token for public access (no login required)
  access_token    uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,

  status          public.intake_response_status NOT NULL DEFAULT 'pending',

  -- Encrypted responses (clinical data, AES-256-GCM same as treatment_plans.goals)
  responses       text,

  -- Snapshot of form fields at creation time (so template edits don't break past responses)
  form_snapshot   jsonb NOT NULL DEFAULT '[]'::jsonb,

  submitted_at    timestamptz,
  expires_at      timestamptz,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.intake_responses ENABLE ROW LEVEL SECURITY;

-- Therapist can manage all their responses
CREATE POLICY "intake_responses_therapist"
  ON public.intake_responses FOR ALL
  USING (therapist_id = auth.uid());

-- Public read access (filtered by access_token in app layer, same pattern as booking router)
CREATE POLICY "intake_responses_public_read"
  ON public.intake_responses FOR SELECT
  USING (true);

-- Public update access (for submitting responses via access_token)
CREATE POLICY "intake_responses_public_update"
  ON public.intake_responses FOR UPDATE
  USING (true);

CREATE TRIGGER trg_intake_responses_updated_at
  BEFORE UPDATE ON public.intake_responses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_intake_responses_therapist ON public.intake_responses (therapist_id);
CREATE INDEX idx_intake_responses_client ON public.intake_responses (client_id);
CREATE INDEX idx_intake_responses_access_token ON public.intake_responses (access_token);
CREATE INDEX idx_intake_responses_session ON public.intake_responses (session_id);
