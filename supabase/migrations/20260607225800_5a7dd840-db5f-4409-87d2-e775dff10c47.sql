ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS residential_location TEXT, ADD COLUMN IF NOT EXISTS attendance_mode TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  reg_id TEXT;
BEGIN
  reg_id := public.generate_registration_id();
  INSERT INTO public.profiles (user_id, name, email, phone, gender, church, residential_location, attendance_mode, registration_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'gender', ''),
    COALESCE(NEW.raw_user_meta_data->>'church', ''),
    COALESCE(NEW.raw_user_meta_data->>'residential_location', ''),
    COALESCE(NEW.raw_user_meta_data->>'attendance_mode', ''),
    reg_id
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$function$;