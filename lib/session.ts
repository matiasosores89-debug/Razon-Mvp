type SessionPayload = { sub: string; exp: number };
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

function toBase64Url(value: string | ArrayBuffer): string {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

export async function createSessionToken(username: string): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Falta configurar ADMIN_SESSION_SECRET");
  const payload = toBase64Url(JSON.stringify({ sub: username, exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE }));
  return `${payload}.${await sign(payload, secret)}`;
}

export async function verifySessionToken(token?: string): Promise<boolean> {
  return Boolean(await getSessionSubject(token));
}

export async function getSessionSubject(token?: string): Promise<string | null> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = await sign(payload, secret);
  if (signature.length !== expected.length) return null;
  let difference = 0;
  for (let index = 0; index < signature.length; index += 1) difference |= signature.charCodeAt(index) ^ expected.charCodeAt(index);
  if (difference !== 0) return null;
  try {
    const decoded = JSON.parse(fromBase64Url(payload)) as SessionPayload;
    return typeof decoded.sub === "string" && decoded.sub.length > 0 && decoded.exp > Date.now() / 1000 ? decoded.sub : null;
  } catch {
    return null;
  }
}
