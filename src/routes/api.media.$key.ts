
import { createFileRoute } from "@tanstack/react-router";
import { getDB, getMedia } from "@/lib/cloudflare-db.server";

const SESSION_COOKIE = "__Host-anayah-admin";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return toBase64(new Uint8Array(digest));
}

function getCookieValue(request: Request, name: string): string | null {
  const cookies = request.headers.get("cookie") ?? "";

  for (const part of cookies.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;

    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }

  return null;
}

async function isAdmin(request: Request): Promise<boolean> {
  const token = getCookieValue(request, SESSION_COOKIE);
  if (!token) return false;

  const tokenHash = await hashSessionToken(token);

  const admin = await getDB()
    .prepare(
      `SELECT a.id
       FROM admin_sessions s
       INNER JOIN admin_users a ON a.id = s.admin_id
       WHERE s.id = ?
         AND s.expires_at > ?
         AND a.active = 1
       LIMIT 1`,
    )
    .bind(tokenHash, new Date().toISOString())
    .first<{ id: string }>();

  return !!admin;
}

export const Route = createFileRoute("/api/media/$key")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        let key: string;

        try {
          key = decodeURIComponent(params.key);
        } catch {
          return new Response("Not found", { status: 404 });
        }

        const isProductImage =
          /^p_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif|avif)$/i.test(
            key,
          );

        const isPaymentProof =
          /^AG-[A-Z0-9]+\/proof\.(jpg|png|webp|gif|avif|pdf)$/i.test(key);

        if (!isProductImage && !isPaymentProof) {
          return new Response("Not found", { status: 404 });
        }

        if (isPaymentProof && !(await isAdmin(request))) {
          return new Response("Unauthorized", {
            status: 401,
            headers: { "Cache-Control": "no-store" },
          });
        }

        const object = await getMedia().get(key);

        if (!object) {
          return new Response("Not found", { status: 404 });
        }

        const extension = key.split(".").pop()?.toLowerCase();

        const contentType =
          object.httpMetadata?.contentType ??
          (extension === "jpg"
            ? "image/jpeg"
            : extension === "png"
              ? "image/png"
              : extension === "webp"
                ? "image/webp"
                : extension === "gif"
                  ? "image/gif"
                  : extension === "avif"
                    ? "image/avif"
                    : extension === "pdf"
                      ? "application/pdf"
                      : "application/octet-stream");

        return new Response(object.body, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": isPaymentProof
              ? "private, no-store"
              : "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
