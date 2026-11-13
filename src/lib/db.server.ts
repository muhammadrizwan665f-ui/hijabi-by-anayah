/**
 * Legacy compatibility shim.
 * Application data now uses Cloudflare D1/R2.
 */
export { newOrderNo } from "@/lib/cloudflare-db.server";

export function getPublicClient(): never {
  throw new Error(
    "Supabase has been removed. Use Cloudflare D1 server functions.",
  );
}

export async function getAdminClient(): Promise<never> {
  throw new Error(
    "Supabase has been removed. Use Cloudflare D1 server functions.",
  );
}
