import { createServerFn } from "@tanstack/react-start";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { getDB, newId } from "@/lib/cloudflare-db.server";
import { requireAdminAuth } from "@/integrations/supabase/auth-middleware";

const SESSION_COOKIE = "__Host-anayah-admin";
const SESSION_DAYS = 7;
const PBKDF2_ITERATIONS = 310_000;

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
  const [algorithm, iterationsText, saltText, expectedText] = stored.split("$");

  if (
    algorithm !== "pbkdf2" ||
    !iterationsText ||
    !saltText ||
    !expectedText
  ) {
    return false;
  }

  const iterations = Number(iterationsText);
  if (!Number.isSafeInteger(iterations) || iterations < 100_000 || iterations > 1_000_000) {
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
}

async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return toBase64(new Uint8Array(digest));
}

/**
 * Creates the first admin account from Cloudflare secrets.
 * Existing admin accounts are never overwritten.
 */
export const ensureAdminUser = createServerFn({ method: "POST" }).handler(
  async () => {
    const config = getAdminEnv();
    const email = config.ADMIN_EMAIL?.trim().toLowerCase();
    const password = config.ADMIN_PASSWORD;

    if (!email || !password) return { ready: false as const };

    const db = getDB();
    const existing = await db
      .prepare("SELECT id FROM admin_users LIMIT 1")
      .first<{ id: string }>();

    if (existing) return { ready: true as const };

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

/** Signs in the store owner and creates a server-side session. */
export const loginAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!email || !data.password || data.password.length > 256) {
      return { success: false as const };
    }

    const db = getDB();
    const admin = await db
      .prepare(
        `SELECT id, email, password_hash
         FROM admin_users
         WHERE email = ? COLLATE NOCASE AND active = 1
         LIMIT 1`,
      )
      .bind(email)
      .first<{ id: string; email: string; password_hash: string }>();

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

/** Returns the currently authenticated admin, if the session is valid. */
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
  });

/** Changes the current admin password after verifying the existing password. */
export const updateAdminPassword = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator(
    (data: { currentPassword: string; newPassword: string }) => data,
  )
  .handler(async ({ data, context }) => {
    if (
      !data.currentPassword ||
      data.newPassword.length < 8 ||
      data.newPassword.length > 256
    ) {
      return { success: false as const, reason: "invalid_input" as const };
    }

    const db = getDB();
    const admin = await db
      .prepare("SELECT password_hash FROM admin_users WHERE id = ? AND active = 1")
      .bind(context.adminId)
      .first<{ password_hash: string }>();

    if (!admin || !(await verifyPassword(data.currentPassword, admin.password_hash))) {
      return { success: false as const, reason: "wrong_password" as const };
    }

    const passwordHash = await hashPassword(data.newPassword);
    await db
      .prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?")
      .bind(passwordHash, context.adminId)
      .run();

    return { success: true as const };
  });

/** Changes the current admin login email immediately after password verification. */
export const updateAdminEmail = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((data: { currentPassword: string; newEmail: string }) => data)
  .handler(async ({ data, context }) => {
    const newEmail = data.newEmail.trim().toLowerCase();
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) ||
      newEmail.length > 254 ||
      !data.currentPassword
    ) {
      return { success: false as const, reason: "invalid_input" as const };
    }

    const db = getDB();
    const admin = await db
      .prepare("SELECT password_hash, email FROM admin_users WHERE id = ? AND active = 1")
      .bind(context.adminId)
      .first<{ password_hash: string; email: string }>();

    if (!admin || !(await verifyPassword(data.currentPassword, admin.password_hash))) {
      return { success: false as const, reason: "wrong_password" as const };
    }

    if (admin.email.toLowerCase() === newEmail) {
      return { success: false as const, reason: "same_email" as const };
    }

    const existing = await db
      .prepare("SELECT id FROM admin_users WHERE email = ? COLLATE NOCASE AND id != ? LIMIT 1")
      .bind(newEmail, context.adminId)
      .first<{ id: string }>();

    if (existing) {
      return { success: false as const, reason: "email_in_use" as const };
    }

    await db
      .prepare("UPDATE admin_users SET email = ? WHERE id = ?")
      .bind(newEmail, context.adminId)
      .run();

    return { success: true as const, email: newEmail };
  });

/** Revokes the current server-side session and clears its cookie. */
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
