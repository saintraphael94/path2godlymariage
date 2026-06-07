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
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  year_part := LPAD((current_year % 100)::TEXT, 2, '0') || LPAD(((current_year + 1) % 100)::TEXT, 2, '0');
  SELECT COUNT(*) + 1 INTO counter FROM public.profiles WHERE batch_year = current_year;
  seq_part := LPAD(counter::TEXT, 5, '0');
  new_id := 'P2GM/' || year_part || '/' || seq_part;
  RETURN new_id;
END;
$function$;