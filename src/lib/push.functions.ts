import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  return { key: process.env["VAPID_PUBLIC_KEY"] ?? "" };
});

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { endpoint: string; p256dh: string; auth: string; label?: string }) =>
    z
      .object({
        endpoint: z.string().url(),
        p256dh: z.string().min(10),
        auth: z.string().min(5),
        label: z.string().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdminRole } = await import("./push-admin.server");
    await assertAdminRole(context as never);
    const { error } = await context.supabase.from("push_subscriptions").upsert(
      {
        user_id: context.userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        label: data.label ?? null,
      } as never,
      { onConflict: "endpoint" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { endpoint: string }) =>
    z.object({ endpoint: z.string().url() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdminRole } = await import("./push-admin.server");
    await assertAdminRole(context as never);
    await context.supabase.from("push_subscriptions").delete().eq("endpoint", data.endpoint);
    return { ok: true };
  });

export const sendTestPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdminRole } = await import("./push-admin.server");
    await assertAdminRole(context as never);
    const { broadcastAdminPush } = await import("./push-broadcast.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await broadcastAdminPush(supabaseAdmin as never, {
      title: "Test notification",
      message: "Push notifications are working on this device.",
      url: "/admin/orders",
    });
    return { ok: true };
  });
