import { sendWebPush } from "./push.server";

export type PushReport = { devices: number; sent: number; details: string[] };

/** Sends a notification to every registered admin device. Never throws. */
export async function broadcastAdminPush(
  admin: { from: (t: string) => any },
  data: { title: string; message: string; url?: string },
): Promise<PushReport> {
  const report: PushReport = { devices: 0, sent: 0, details: [] };
  try {
    const { data: subs, error } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");
    if (error) report.details.push("read subscriptions failed: " + error.message);
    if (!subs?.length) return report;
    report.devices = subs.length;

    const dead: string[] = [];
    await Promise.all(
      subs.map(async (s: any) => {
        try {
          const r = await sendWebPush(
            { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
            data,
          );
          if (r.ok) report.sent += 1;
          else report.details.push("push service replied " + r.status);
          if (r.gone) dead.push(s.id);
        } catch (e) {
          report.details.push("send error: " + (e instanceof Error ? e.message : String(e)));
        }
      }),
    );
    if (dead.length) await admin.from("push_subscriptions").delete().in("id", dead);
  } catch (e) {
    report.details.push("error: " + (e instanceof Error ? e.message : String(e)));
  }
  return report;
}
