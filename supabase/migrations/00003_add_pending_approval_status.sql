-- Add pending_approval status for booking approval flow
ALTER TYPE public.session_status ADD VALUE IF NOT EXISTS 'pending_approval' BEFORE 'scheduled';
