type AdminAuthContext = {
  adminId: string;
  email?: string;
};

/**
 * Checks the admin context supplied by D1-backed authentication middleware.
 */
export async function assertAdminRole(
  context: AdminAuthContext,
): Promise<void> {
  if (!context?.adminId) {
    throw new Error("Forbidden: admin access only.");
  }
}
