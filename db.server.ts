/**
 * Legacy compatibility shim.
 * Application data now uses Cloudflare D1/R2 through cloudflare-db.server.ts.
 */
export { newOrderNo } from "@/lib/cloudflare-db.server";

/**
 * These legacy helpers intentionally fail loudly rather than silently
 * connecting to the retired Supabase project.
 */
export function getPublicClient(): never {
  throw new Error("Supabase has been removed. Use Cloudflare D1 server functions.");
}

export async function getAdminClient(): Promise<never> {
  throw new Error("Supabase has been removed. Use Cloudflare D1 server functions.");
}
