export async function assertAdminRole(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(`Forbidden: admin access only (${error.message})`);
  if (!data) throw new Error("Forbidden: admin access only.");
}
