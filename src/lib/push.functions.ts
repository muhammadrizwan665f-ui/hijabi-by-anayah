
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { requireAdminAuth } from "@/integrations/supabase/auth-middleware";
import { getDB, newId } from "./cloudflare-db.server";
import { z } from "zod";

export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(
  async () => {
    const bindings = env as unknown as {
      VAPID_PUBLIC_KEY?: string;
    };

    return { key: bindings.VAPID_PUBLIC_KEY ?? "" };
  },
);

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: unknown) =>
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
    const db = getDB();

    await db
      .prepare(
        `INSERT INTO push_subscriptions
          (id, user_id, endpoint, p256dh, auth)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(endpoint) DO UPDATE SET
           user_id = excluded.user_id,
           p256dh = excluded.p256dh,
           auth = excluded.auth`,
      )
      .bind(
        newId(),
        context.adminId,
        data.endpoint,
        data.p256dh,
        data.auth,
      )
      .run();

    return { ok: true };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: unknown) =>
    z.object({ endpoint: z.string().url() }).parse(input),
  )
  .handler(async ({ data }) => {
    await getDB()
      .prepare("DELETE FROM push_subscriptions WHERE endpoint = ?")
      .bind(data.endpoint)
      .run();

    return { ok: true };
  });

export const sendTestPush = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    const { broadcastAdminPush } = await import("./push-broadcast.server");

    const report = await broadcastAdminPush({
      title: "Test notification",
      message: "Push notifications are working on this device.",
      url: "/admin/orders",
    });

    return { ok: true, ...report };
  });
