-- Explicitly grant execute permission on the has_role function
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- Ensure the user_roles table is actually readable by the authenticated role
-- so the SECURITY DEFINER function can access it under the owner's context
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
