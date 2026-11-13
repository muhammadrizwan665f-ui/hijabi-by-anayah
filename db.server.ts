/**
 * Legacy compatibility module.
 * All database access now uses Cloudflare D1 through cloudflare-db.server.ts.
 */
export { newOrderNo } from "./cloudflare-db.server";
