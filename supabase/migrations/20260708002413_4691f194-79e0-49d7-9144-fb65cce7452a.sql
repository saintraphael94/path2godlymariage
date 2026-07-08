
CREATE TYPE public.material_type AS ENUM ('pdf', 'audio', 'video', 'link');

CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type public.material_type NOT NULL,
  session_month INT NOT NULL CHECK (session_month BETWEEN 1 AND 12),
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view materials"
  ON public.materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert materials"
  ON public.materials FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update materials"
  ON public.materials FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete materials"
  ON public.materials FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_materials_session_month ON public.materials(session_month);
