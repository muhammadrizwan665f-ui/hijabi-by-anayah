import { sendWebPush } from "./push.server";

/** Sends a notification to every registered admin device. Never throws. */
export async function broadcastAdminPush(
  admin: { from: (t: string) => any },
  data: { title: string; message: string; url?: string },
) {
  try {
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");
    if (!subs?.length) return;

    const dead: string[] = [];
    await Promise.all(
      subs.map(async (s: any) => {
        try {
          const r = await sendWebPush(
            { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
            data,
          );
          if (r.gone) dead.push(s.id);
        } catch {
          /* ignore individual device failures */
        }
      }),
    );
    if (dead.length) await admin.from("push_subscriptions").delete().in("id", dead);
  } catch {
    /* push must never block the order flow */
  }
}
