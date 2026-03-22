-- Allow clients to cancel their own sessions (update status to cancelled)
CREATE POLICY "sessions_client_cancel"
  ON public.sessions FOR UPDATE
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()))
  WITH CHECK (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
    AND status = 'cancelled'
  );
