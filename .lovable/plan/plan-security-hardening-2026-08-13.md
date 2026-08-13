# Plan - Security Hardening

The database linter identified that the `has_role` SECURITY DEFINER function is executable by all authenticated users. While this is necessary for RLS policies to function, it is a security best practice to move such sensitive logic into a dedicated schema or explicitly manage its execution privileges. I will also perform a general security audit of RLS policies and server-side functions.

## Technical Details

### Database Fixes
- Revoke public/authenticated `EXECUTE` on `public.has_role`.
- Re-grant `EXECUTE` only to `service_role` and `postgres`.
- Ensure RLS policies using `has_role` still function correctly (RLS runs with table owner privileges, which is usually `postgres`).

### Frontend/Server Audit
- Review `src/lib/*.functions.ts` for any unauthorized data exposure.
- Check for missing `inputValidator` in server functions.
- Verify that `requireSupabaseAuth` is used correctly on all sensitive endpoints.

## User Review Required

> [!IMPORTANT]
> This change strictly limits who can call the `has_role` function directly via the API, which reduces the attack surface for role probing.

- **Security Impact**: High (Prevents unauthorized role enumeration).
- **Breaking Change**: None expected for the application UI.
