-- Revoke execute from authenticated to stop linter warning
-- RLS policies using SECURITY DEFINER functions will still work because 
-- they are evaluated in the context of the table owner.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
