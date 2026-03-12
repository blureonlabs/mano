-- Add booking policy fields to therapists table
ALTER TABLE public.therapists
  ADD COLUMN cancellation_policy text,
  ADD COLUMN late_policy text,
  ADD COLUMN rescheduling_policy text;
