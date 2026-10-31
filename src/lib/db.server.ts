import { createClient } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "https://finobtknhqpzvinlfcsj.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_i6Uro7O3XbCVPUodA1KWlQ__inMqrr9";

/** Publishable-key client for public reads (RLS applies as anon). Server-only. */
export function getPublicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || FALLBACK_SUPABASE_PUBLISHABLE_KEY;
  const url = process.env["SUPABASE_URL"] || FALLBACK_SUPABASE_URL;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export async function getAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export function newOrderNo(): string {
  return "AG-" + Date.now().toString(36).toUpperCase().slice(-6);
}
