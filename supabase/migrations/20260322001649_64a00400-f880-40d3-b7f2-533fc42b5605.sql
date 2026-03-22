
-- Create enum for user status
CREATE TYPE public.user_status AS ENUM ('active', 'completed');

-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  gender TEXT,
  church TEXT,
  registration_id TEXT NOT NULL UNIQUE,
  status user_status NOT NULL DEFAULT 'active',
  batch_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  title TEXT NOT NULL,
  bible_study_content TEXT,
  breakout_notes TEXT,
  file_urls TEXT[],
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(month)
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public verification lookup" ON public.profiles
  FOR SELECT TO anon USING (true);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Sessions policies
CREATE POLICY "Anyone can view sessions" ON public.sessions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage sessions" ON public.sessions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Attendance policies
CREATE POLICY "Users can view own attendance" ON public.attendance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can mark own attendance" ON public.attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all attendance" ON public.attendance
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Registration ID generator
CREATE OR REPLACE FUNCTION public.generate_registration_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  year_part TEXT;
  seq_part TEXT;
  counter INTEGER;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  SELECT COUNT(*) + 1 INTO counter FROM public.profiles WHERE batch_year = EXTRACT(YEAR FROM NOW());
  seq_part := LPAD(counter::TEXT, 4, '0');
  new_id := 'P2GM-' || year_part || '-' || seq_part;
  RETURN new_id;
END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reg_id TEXT;
BEGIN
  reg_id := public.generate_registration_id();
  INSERT INTO public.profiles (user_id, name, email, phone, gender, church, registration_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'gender', ''),
    COALESCE(NEW.raw_user_meta_data->>'church', ''),
    reg_id
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed 12 sessions
INSERT INTO public.sessions (month, title) VALUES
  (1, 'Foundations of Godly Relationships'),
  (2, 'Understanding God''s Design for Marriage'),
  (3, 'Communication & Emotional Intelligence'),
  (4, 'Financial Stewardship Together'),
  (5, 'Conflict Resolution & Forgiveness'),
  (6, 'Spiritual Intimacy & Prayer Life'),
  (7, 'Roles & Responsibilities in Marriage'),
  (8, 'Building Trust & Accountability'),
  (9, 'Family Planning & Legacy'),
  (10, 'Navigating Cultural & Family Dynamics'),
  (11, 'Preparing for the Covenant'),
  (12, 'Walking in Covenant - Graduation');

-- Storage bucket for materials
INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true);

CREATE POLICY "Anyone can view materials" ON storage.objects
  FOR SELECT USING (bucket_id = 'materials');

CREATE POLICY "Admins can upload materials" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'materials' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update materials" ON storage.objects
  FOR UPDATE USING (bucket_id = 'materials' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete materials" ON storage.objects
  FOR DELETE USING (bucket_id = 'materials' AND public.has_role(auth.uid(), 'admin'));
