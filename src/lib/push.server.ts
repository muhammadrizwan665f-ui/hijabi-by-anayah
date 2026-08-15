/**
 * Minimal Web Push (RFC 8291 / aes128gcm + RFC 8292 VAPID) implementation
 * using only Web Crypto — safe for the edge/Worker runtime.
 */

const enc = new TextEncoder();

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = pad + "=".repeat((4 - (pad.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm as unknown as ArrayBuffer, "HKDF", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: salt as unknown as BufferSource, info: info as unknown as BufferSource },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

function vapidJwk(publicKey: string, privateKey: string) {
  const pub = b64urlToBytes(publicKey); // 0x04 || X || Y
  return {
    kty: "EC",
    crv: "P-256",
    x: bytesToB64url(pub.slice(1, 33)),
    y: bytesToB64url(pub.slice(33, 65)),
    d: privateKey,
    ext: true,
  };
}

async function vapidHeader(audience: string, subject: string, pub: string, priv: string) {
  const header = bytesToB64url(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = bytesToB64url(
    enc.encode(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: subject,
      }),
    ),
  );
  const unsigned = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "jwk",
    vapidJwk(pub, priv),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(unsigned) as unknown as BufferSource,
  );
  return `vapid t=${unsigned}.${bytesToB64url(new Uint8Array(sig))}, k=${pub}`;
}

async function encryptPayload(payload: string, p256dh: string, authSecret: string) {
  const clientPub = b64urlToBytes(p256dh);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const local = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ]);
  const localPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", local.publicKey));

  const importedClient = await crypto.subtle.importKey(
    "raw",
    clientPub as unknown as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: importedClient }, local.privateKey, 256),
  );

  const prkInfo = concat(enc.encode("WebPush: info\0"), clientPub, localPubRaw);
  const ikm = await hkdf(b64urlToBytes(authSecret), shared, prkInfo, 32);

  const cekBytes = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);

  const cek = await crypto.subtle.importKey("raw", cekBytes as unknown as ArrayBuffer, "AES-GCM", false, [
    "encrypt",
  ]);
  const plaintext = concat(enc.encode(payload), new Uint8Array([2]));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce as unknown as BufferSource },
      cek,
      plaintext as unknown as BufferSource,
    ),
  );

  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);

  return concat(salt, rs, new Uint8Array([localPubRaw.length]), localPubRaw, ciphertext);
}

export interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Sends one push message. Returns the HTTP status from the push service. */
export async function sendWebPush(
  sub: PushSub,
  data: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; gone: boolean }> {
  const pub = process.env["VAPID_PUBLIC_KEY"];
  const priv = process.env["VAPID_PRIVATE_KEY"];
  const subject = process.env["VAPID_SUBJECT"] ?? "mailto:admin@example.com";
  if (!pub || !priv) return { ok: false, status: 0, gone: false };

  const url = new URL(sub.endpoint);
  const body = await encryptPayload(JSON.stringify(data), sub.p256dh, sub.auth);
  const auth = await vapidHeader(url.origin, subject, pub, priv);

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
    },
    body: body as unknown as BodyInit,
  });

  return { ok: res.ok, status: res.status, gone: res.status === 404 || res.status === 410 };
}
