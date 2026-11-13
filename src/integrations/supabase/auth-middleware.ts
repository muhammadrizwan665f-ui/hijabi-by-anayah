
import { createMiddleware } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { getDB } from "@/lib/cloudflare-db.server";

const SESSION_COOKIE = "__Host-anayah-admin";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );

  return toBase64(new Uint8Array(digest));
}

export const requireAdminAuth = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  const token = getCookie(SESSION_COOKIE);

  if (!token) {
    throw new Error("Unauthorized: Admin login required.");
  }

  const tokenHash = await hashSessionToken(token);
  const db = getDB();

  const admin = await db
    .prepare(
      `SELECT a.id, a.email
       FROM admin_sessions s
       INNER JOIN admin_users a ON a.id = s.admin_id
       WHERE s.id = ?
         AND s.expires_at > ?
         AND a.active = 1
       LIMIT 1`,
    )
    .bind(tokenHash, new Date().toISOString())
    .first<{ id: string; email: string }>();

  if (!admin) {
    throw new Error("Unauthorized: Admin session is invalid or expired.");
  }

  return next({
    context: {
      adminId: admin.id,
      email: admin.email,
    },
  });
});
