
-- Prevent deletion of the last master user
CREATE OR REPLACE FUNCTION public.prevent_last_master_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'master' THEN
    IF (SELECT count(*) FROM public.user_roles WHERE role = 'master' AND id != OLD.id) = 0 THEN
      RAISE EXCEPTION 'Não é possível remover o último usuário Master do sistema';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER prevent_last_master_delete
BEFORE DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_last_master_deletion();
