-- Fix 'permission denied for table sessions': API roles never received table-level
-- privileges on public.sessions. RLS policies exist but require grants too.
GRANT SELECT ON public.sessions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;