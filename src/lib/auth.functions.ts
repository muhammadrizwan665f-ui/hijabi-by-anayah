
import { createServerFn } from "@tanstack/react-start";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { requireAdminAuth } from "@/integrations/supabase/auth-middleware";
import { getDB, newId } from "@/lib/cloudflare-db.server";

const SESSION_COOKIE = "__Host-anayah-admin";
const SESSION_DAYS = 7;
// Cloudflare Workers' Web Crypto rejects PBKDF2 with more than 100,000
// iterations ("NotSupportedError ... iteration counts above 100000"), so this
// must not exceed 100_000. scripts/create-admin-sql.mjs uses the same value.
const PBKDF2_ITERATIONS = 100_000;

type AdminEnv = {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
};

function getAdminEnv(): AdminEnv {
  return env as unknown as AdminEnv;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );

  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(new Uint8Array(bits))}`;
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  try {
    const [algorithm, iterationsText, saltText, expectedText] =
      stored.split("$");

    if (
      algorithm !== "pbkdf2" ||
      !iterationsText ||
      !saltText ||
      !expectedText
    ) {
      return false;
    }

    const iterations = Number(iterationsText);
    if (
      !Number.isSafeInteger(iterations) ||
      iterations < 100_000 ||
      iterations > 1_000_000
    ) {
      return false;
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );

    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: fromBase64(saltText),
        iterations,
        hash: "SHA-256",
      },
      key,
      256,
    );

    const actual = new Uint8Array(bits);
    const expected = fromBase64(expectedText);

    if (actual.length !== expected.length) return false;

    let difference = 0;
    for (let i = 0; i < actual.length; i++) {
      difference |= actual[i]! ^ expected[i]!;
    }

    return difference === 0;
  } catch {
    return false;
  }
}

async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return toBase64(new Uint8Array(digest));
}

async function getCurrentAdmin() {
  const token = getCookie(SESSION_COOKIE);
  if (!token) throw new Error("Admin login required.");

  const tokenHash = await hashSessionToken(token);

  const admin = await getDB()
    .prepare(
      `SELECT a.id, a.email, a.password_hash, s.id AS session_id
       FROM admin_sessions s
       INNER JOIN admin_users a ON a.id = s.admin_id
       WHERE s.id = ?
         AND s.expires_at > ?
         AND a.active = 1
       LIMIT 1`,
    )
    .bind(tokenHash, new Date().toISOString())
    .first<{
      id: string;
      email: string;
      password_hash: string;
      session_id: string;
    }>();

  if (!admin) throw new Error("Admin session expired. Please sign in again.");

  return admin;
}

/** Creates the first admin account from Cloudflare secrets. */
export const ensureAdminUser = createServerFn({ method: "POST" }).handler(
  async () => {
    const config = getAdminEnv();
    const email = config.ADMIN_EMAIL?.trim().toLowerCase();
    const password = config.ADMIN_PASSWORD;

    const db = getDB();

    const existing = await db
      .prepare("SELECT id FROM admin_users LIMIT 1")
      .first<{ id: string }>();

    if (existing) return { ready: true as const };

    // No admin yet and no secrets to create one from.
    if (!email || !password) {
      console.error(
        "[admin] No admin exists and ADMIN_EMAIL / ADMIN_PASSWORD secrets are not set. " +
          "Run scripts/create-admin-sql.mjs and apply the SQL with wrangler d1 execute.",
      );
      return { ready: false as const, reason: "missing_secrets" as const };
    }

    const passwordHash = await hashPassword(password);

    try {
      await db
        .prepare(
          `INSERT INTO admin_users (id, email, password_hash, full_name, active)
           VALUES (?, ?, ?, ?, 1)`,
        )
        .bind(newId(), email, passwordHash, "Anayah Admin")
        .run();
    } catch {
      const created = await db
        .prepare("SELECT id FROM admin_users LIMIT 1")
        .first<{ id: string }>();

      if (!created) throw new Error("Could not initialize the admin account.");
    }

    return { ready: true as const };
  },
);

/** Admin login using D1 credentials. */
export const loginAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().trim().email().max(254),
      password: z.string().min(1).max(256),
    }),
  )
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const db = getDB();

    const admin = await db
      .prepare(
        `SELECT id, email, password_hash
         FROM admin_users
         WHERE email = ? COLLATE NOCASE AND active = 1
         LIMIT 1`,
      )
      .bind(email)
      .first<{
        id: string;
        email: string;
        password_hash: string;
      }>();

    if (!admin || !(await verifyPassword(data.password, admin.password_hash))) {
      return { success: false as const };
    }

    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = toBase64(tokenBytes)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

    const tokenHash = await hashSessionToken(token);
    const expiresAt = new Date(
      Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    await db
      .prepare(
        `INSERT INTO admin_sessions (id, admin_id, expires_at)
         VALUES (?, ?, ?)`,
      )
      .bind(tokenHash, admin.id, expiresAt)
      .run();

    setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });

    return { success: true as const, email: admin.email };
  });

/** Read the current D1 admin session. */
export const getAdminSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const token = getCookie(SESSION_COOKIE);
    if (!token) return null;

    const tokenHash = await hashSessionToken(token);

    const session = await getDB()
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

    return session ? { id: session.id, email: session.email } : null;
  },
);

/** Change the current admin password after verifying the old password. */
export const updateAdminPassword = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator(
    z.object({
      currentPassword: z.string().min(1).max(256),
      newPassword: z.string().min(8).max(256),
    }),
  )
  .handler(async ({ data }) => {
    const admin = await getCurrentAdmin();

    if (!(await verifyPassword(data.currentPassword, admin.password_hash))) {
      return { success: false as const, reason: "wrong_password" as const };
    }

    const newHash = await hashPassword(data.newPassword);

    await getDB()
      .prepare(
        `UPDATE admin_users
         SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(newHash, admin.id)
      .run();

    // Keep the current session active; revoke other sessions.
    await getDB()
      .prepare("DELETE FROM admin_sessions WHERE admin_id = ? AND id != ?")
      .bind(admin.id, admin.session_id)
      .run();

    return { success: true as const };
  });

/** Change the current admin login email after verifying the password. */
export const updateAdminEmail = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator(
    z.object({
      currentPassword: z.string().min(1).max(256),
      newEmail: z.string().trim().email().max(254),
    }),
  )
  .handler(async ({ data }) => {
    const admin = await getCurrentAdmin();
    const newEmail = data.newEmail.trim().toLowerCase();

    if (!(await verifyPassword(data.currentPassword, admin.password_hash))) {
      return { success: false as const, reason: "wrong_password" as const };
    }

    if (newEmail === admin.email.toLowerCase()) {
      return { success: false as const, reason: "same_email" as const };
    }

    const existing = await getDB()
      .prepare("SELECT id FROM admin_users WHERE email = ? COLLATE NOCASE LIMIT 1")
      .bind(newEmail)
      .first<{ id: string }>();

    if (existing) {
      return { success: false as const, reason: "email_in_use" as const };
    }

    await getDB()
      .prepare(
        `UPDATE admin_users
         SET email = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(newEmail, admin.id)
      .run();

    return { success: true as const, email: newEmail };
  });

/** Revoke the current session and clear the login cookie. */
export const logoutAdmin = createServerFn({ method: "POST" }).handler(
  async () => {
    const token = getCookie(SESSION_COOKIE);

    if (token) {
      const tokenHash = await hashSessionToken(token);
      await getDB()
        .prepare("DELETE FROM admin_sessions WHERE id = ?")
        .bind(tokenHash)
        .run();
    }

    deleteCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });

    return { success: true as const };
  },
);
