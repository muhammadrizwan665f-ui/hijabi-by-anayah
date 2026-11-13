
import { env } from "cloudflare:workers";

interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta?: Record<string, unknown>;
}

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

interface D1Database {
  prepare(query: string): D1Statement;
  batch<T extends D1Statement[]>(statements: T): Promise<unknown[]>;
  exec(query: string): Promise<unknown>;
}

interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | string,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  get(key: string): Promise<{
    body: ReadableStream;
    arrayBuffer(): Promise<ArrayBuffer>;
    httpMetadata?: { contentType?: string };
  } | null>;
  delete(key: string): Promise<void>;
}

interface CloudflareBindings {
  DB: D1Database;
  MEDIA: R2Bucket;
}

function getBindings(): CloudflareBindings {
  const bindings = env as unknown as Partial<CloudflareBindings>;

  if (!bindings.DB) {
    throw new Error("Cloudflare D1 binding DB is not configured.");
  }

  if (!bindings.MEDIA) {
    throw new Error("Cloudflare R2 binding MEDIA is not configured.");
  }

  return bindings as CloudflareBindings;
}

export function getDB(): D1Database {
  return getBindings().DB;
}

export function getMedia(): R2Bucket {
  return getBindings().MEDIA;
}

export function newOrderNo(): string {
  return "AG-" + Date.now().toString(36).toUpperCase().slice(-6);
}

export function newId(): string {
  return crypto.randomUUID();
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") {
    return (value as T) ?? fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function dataUrlToBytes(dataUrl: string): {
  contentType: string;
  bytes: Uint8Array;
} | null {
  const match = /^data:(image\/[a-z0-9.+-]+|application\/pdf);base64,(.+)$/i.exec(
    dataUrl,
  );

  if (!match) return null;

  const contentType = match[1]!;
  const binary = atob(match[2]!);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return { contentType, bytes };
}
