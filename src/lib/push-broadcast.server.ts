
import { getDB } from "./cloudflare-db.server";
import { sendWebPush } from "./push.server";

export type PushReport = {
  devices: number;
  sent: number;
  details: string[];
};

/** Sends a notification to every registered admin device. Never throws. */
export async function broadcastAdminPush(
  data: { title: string; message: string; url?: string },
): Promise<PushReport> {
  const report: PushReport = {
    devices: 0,
    sent: 0,
    details: [],
  };

  try {
    const db = getDB();

    const result = await db
      .prepare(
        "SELECT id, endpoint, p256dh, auth FROM push_subscriptions",
      )
      .all<{
        id: string;
        endpoint: string;
        p256dh: string;
        auth: string;
      }>();

    const subs = result.results ?? [];

    if (!subs.length) return report;

    report.devices = subs.length;

    const dead: string[] = [];

    await Promise.all(
      subs.map(async (subscription) => {
        try {
          const response = await sendWebPush(
            {
              endpoint: subscription.endpoint,
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
            data,
          );

          if (response.ok) {
            report.sent += 1;
          } else {
            report.details.push(
              "Push service replied " + response.status,
            );
          }

          if (response.gone) {
            dead.push(subscription.id);
          }
        } catch (error) {
          report.details.push(
            "Send error: " +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      }),
    );

    if (dead.length) {
      const placeholders = dead.map(() => "?").join(", ");

      await db
        .prepare(
          `DELETE FROM push_subscriptions WHERE id IN (${placeholders})`,
        )
        .bind(...dead)
        .run();
    }
  } catch (error) {
    report.details.push(
      "Error: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  return report;
}
