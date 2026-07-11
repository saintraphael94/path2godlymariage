
CREATE OR REPLACE FUNCTION public.generate_registration_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_id TEXT;
  year_part TEXT;
  seq_part TEXT;
  counter INTEGER;
  current_year INTEGER;
  max_seq INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  year_part := LPAD((current_year % 100)::TEXT, 2, '0') || LPAD(((current_year + 1) % 100)::TEXT, 2, '0');

  -- Serialize concurrent signups for this year to avoid duplicate registration ids
  PERFORM pg_advisory_xact_lock(hashtext('p2gm_reg_id_' || current_year));

  -- Derive next sequence from the existing max for this year's prefix,
  -- so deletions or races never produce a duplicate.
  SELECT COALESCE(
    MAX(NULLIF(regexp_replace(split_part(registration_id, '/', 3), '\D', '', 'g'), '')::INTEGER),
    0
  )
  INTO max_seq
  FROM public.profiles
  WHERE registration_id LIKE 'P2GM/' || year_part || '/%';

  counter := max_seq + 1;
  seq_part := LPAD(counter::TEXT, 5, '0');
  new_id := 'P2GM/' || year_part || '/' || seq_part;
  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  reg_id TEXT;
  attempts INTEGER := 0;
BEGIN
  LOOP
    attempts := attempts + 1;
    reg_id := public.generate_registration_id();
    BEGIN
      INSERT INTO public.profiles (
        user_id, name, email, phone, gender, church,
        residential_location, attendance_mode, registration_id
      )
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
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF attempts >= 5 THEN
        RAISE;
      END IF;
    END;
  END LOOP;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;
