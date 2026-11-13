
import type { MiddlewareResult } from "@tanstack/react-start";
import type { AdminAuthContext } from "@/integrations/supabase/auth-middleware";

/**
 * Admin authorization is handled by the D1-backed requireAdminAuth
 * middleware. This helper remains for compatibility with older imports.
 */
export async function assertAdminRole(
  context: AdminAuthContext,
): Promise<void> {
  if (!context?.adminId) {
    throw new Error("Forbidden: admin access only.");
  }
}
