import { createServerFn } from "@tanstack/react-start";

/**
 * Idempotently provisions the single store-owner account from server-side
 * secrets. Does nothing once an admin already exists.
 */
export const ensureAdminUser = createServerFn({ method: "POST" }).handler(async () => {
  const email = process.env["ADMIN_EMAIL"];
  const password = process.env["ADMIN_PASSWORD"];
  if (!email || !password) return { ready: false as const };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: existingRoles } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1);
  if (existingRoles && existingRoles.length > 0) return { ready: true as const };

  let userId: string | null = null;
  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Anayah Admin" },
  });
  if (created.data.user) {
    userId = created.data.user.id;
  } else {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    userId = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
    if (userId) await supabaseAdmin.auth.admin.updateUserById(userId, { password });
  }
  if (!userId) return { ready: false as const };

  await supabaseAdmin.from("profiles").upsert({ id: userId, email, full_name: "Anayah Admin" });
  await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "admin" } as never, {
    onConflict: "user_id,role",
  });
  return { ready: true as const };
});
