
-- 1) Drop the anon-readable profiles policy (PII exposure)
DROP POLICY IF EXISTS "Public verification lookup" ON public.profiles;

-- 2) Enforce session lock server-side for attendance INSERT
DROP POLICY IF EXISTS "Users can mark own attendance" ON public.attendance;
CREATE POLICY "Users can mark own attendance"
  ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = session_id AND is_locked = true
    )
  );

-- 3) Revoke EXECUTE on internal SECURITY DEFINER helpers from API roles.
--    handle_new_user runs from an auth trigger; generate_registration_id is
--    called from handle_new_user. Neither should be callable from the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_registration_id() FROM PUBLIC, anon, authenticated;

-- 4) Tighten storage.objects policies for the now-private `materials` bucket.
--    Remove any prior broad SELECT policies and require authentication.
DROP POLICY IF EXISTS "Anyone can view materials" ON storage.objects;
DROP POLICY IF EXISTS "Public can view materials" ON storage.objects;
DROP POLICY IF EXISTS "Public read materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view materials" ON storage.objects;

CREATE POLICY "Authenticated users can view materials"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'materials');

-- Make sure admins can still manage objects in the bucket (upload/delete).
DROP POLICY IF EXISTS "Admins can manage materials" ON storage.objects;
CREATE POLICY "Admins can manage materials"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'materials' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'materials' AND public.has_role(auth.uid(), 'admin'));
