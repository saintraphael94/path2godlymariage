DROP POLICY IF EXISTS "Anyone can view sessions" ON public.sessions;
CREATE POLICY "Signed-in users can view sessions" ON public.sessions FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.sessions FROM anon;