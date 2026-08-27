import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, getLoginRateLimitKey, verifyAdminCredentials } from "@/lib/auth-config";
import { createSessionToken } from "@/lib/session";

export const runtime = "nodejs";
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function jsonError(message: string, status: number, retryAfter?: number) {
  const response = NextResponse.json({ success: false, message }, { status });
  response.headers.set("Cache-Control", "no-store");
  if (retryAfter) response.headers.set("Retry-After", String(retryAfter));
  return response;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const key = getLoginRateLimitKey(ip);
  const now = Date.now();
  const current = attempts.get(key);
  if (current && current.resetAt > now && current.count >= MAX_ATTEMPTS) {
    return jsonError("Demasiados intentos. Intenta nuevamente en 15 minutos.", 429, Math.ceil((current.resetAt - now) / 1000));
  }
  if (current && current.resetAt <= now) attempts.delete(key);

  let body: unknown;
  try { body = await request.json(); } catch { return jsonError("Solicitud invalida.", 400); }
  const { username, password } = (body ?? {}) as Record<string, unknown>;
  if (typeof username !== "string" || typeof password !== "string" || username.length > 100 || password.length > 200) {
    return jsonError("Usuario o contraseña incorrectos.", 401);
  }
  if (!verifyAdminCredentials(username, password)) {
    const latest = attempts.get(key);
    attempts.set(key, { count: (latest?.resetAt && latest.resetAt > now ? latest.count : 0) + 1, resetAt: latest?.resetAt && latest.resetAt > now ? latest.resetAt : now + WINDOW_MS });
    return jsonError("Usuario o contraseña incorrectos.", 401);
  }

  attempts.delete(key);
  const response = NextResponse.json({ success: true });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set({ name: ADMIN_SESSION_COOKIE, value: await createSessionToken(username), httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: ADMIN_SESSION_MAX_AGE });
  return response;
}
