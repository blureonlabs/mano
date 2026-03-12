-- Treatment plan status enum
CREATE TYPE public.treatment_plan_status AS ENUM ('draft', 'active', 'completed', 'archived');

-- Therapy modality enum
CREATE TYPE public.therapy_modality AS ENUM (
  'cbt', 'rebt', 'dbt', 'psychodynamic', 'humanistic',
  'gestalt', 'act', 'emdr', 'solution_focused', 'integrative', 'other'
);

-- Treatment plans table
CREATE TABLE public.treatment_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id    uuid NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
  client_id       uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

  title           text NOT NULL DEFAULT 'Treatment Plan',
  modality        public.therapy_modality NOT NULL DEFAULT 'cbt',
  modality_other  text,

  presenting_concerns text,
  diagnosis       text,

  -- Goals stored as JSONB array: [{ id, title, sub_goals: [{ id, title, completed }], completed }]
  goals           jsonb NOT NULL DEFAULT '[]',

  status          public.treatment_plan_status NOT NULL DEFAULT 'draft',
  start_date      date,
  target_end_date date,
  notes           text,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_treatment_plans_client ON public.treatment_plans(client_id);
CREATE INDEX idx_treatment_plans_therapist ON public.treatment_plans(therapist_id);

-- RLS
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "treatment_plans_therapist" ON public.treatment_plans
  FOR ALL USING (therapist_id = auth.uid());

-- Auto updated_at trigger
CREATE TRIGGER trg_treatment_plans_updated_at
  BEFORE UPDATE ON public.treatment_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
