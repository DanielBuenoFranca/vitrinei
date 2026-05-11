CREATE OR REPLACE FUNCTION public.generate_random_pin()
RETURNS TEXT AS $$
DECLARE
  pin TEXT;
BEGIN
  pin := lpad(floor(random() * 1000000)::text, 6, '0');
  RETURN pin;
END;
$$ LANGUAGE plpgsql SET search_path = public;
