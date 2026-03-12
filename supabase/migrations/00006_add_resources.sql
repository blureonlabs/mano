-- Resources & worksheet sharing
-- Migration: 00006_add_resources.sql

-- Resource type enum
CREATE TYPE public.resource_type AS ENUM ('file', 'link', 'worksheet');

-- Resources library (therapist's personal library)
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  resource_type public.resource_type NOT NULL DEFAULT 'file',
  file_url text,
  external_url text,
  modality_tags text[] DEFAULT '{}',
  category_tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- GIN index for fast array filtering
CREATE INDEX idx_resources_modality_tags ON public.resources USING GIN (modality_tags);
CREATE INDEX idx_resources_therapist ON public.resources (therapist_id);

-- Junction table: which resources are shared with which clients
CREATE TABLE public.client_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  therapist_id uuid NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
  shared_at timestamptz NOT NULL DEFAULT now(),
  note text,
  UNIQUE (resource_id, client_id)
);

CREATE INDEX idx_client_resources_client ON public.client_resources (client_id);
CREATE INDEX idx_client_resources_resource ON public.client_resources (resource_id);

-- Auto-update updated_at for resources
CREATE TRIGGER set_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS policies
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_resources ENABLE ROW LEVEL SECURITY;

-- Therapist can CRUD own resources
CREATE POLICY "Therapists manage own resources"
  ON public.resources FOR ALL
  USING (therapist_id = auth.uid());

-- Therapist can manage sharing
CREATE POLICY "Therapists manage own shared resources"
  ON public.client_resources FOR ALL
  USING (therapist_id = auth.uid());
