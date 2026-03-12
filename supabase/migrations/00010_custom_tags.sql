-- Add custom_tags JSONB column for per-therapist tag customization
-- Structure: { modalities: string[], techniques: string[], categories: string[], risk_flags: string[] }
-- NULL = use all defaults
ALTER TABLE therapists ADD COLUMN custom_tags jsonb DEFAULT NULL;
