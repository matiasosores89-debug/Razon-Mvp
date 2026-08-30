import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, verifyAdminCredentials } from "@/lib/auth-config";
import { createSessionToken } from "@/lib/session";
import { checkRateLimit, consumeRateLimit, getClientIp, resetRateLimit } from "@/lib/request-security";
import { handleApiError } from "@/lib/api-response";
import { recordAdminAction } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    await checkRateLimit({ scope: "admin-login", identifier: ip, limit: 5 });
    const body = await request.json() as Record<string, unknown>;
    const { username, password } = body;
    if (typeof username !== "string" || typeof password !== "string" || username.length > 100 || password.length > 200) {
      return NextResponse.json({ success: false, message: "Usuario o contraseña incorrectos." }, { status: 401 });
    }
    const admin = await verifyAdminCredentials(username, password);
    if (!admin) {
      await consumeRateLimit({ scope: "admin-login", identifier: ip, limit: 5, windowSeconds: 15 * 60 });
      await recordAdminAction(request, { action: "LOGIN_FAILED", entityType: "AUTH", summary: `Intento de acceso fallido para ${username.slice(0, 100)}` });
      return NextResponse.json({ success: false, message: "Usuario o contraseña incorrectos." }, { status: 401 });
    }
    await resetRateLimit("admin-login", ip);
    const response = NextResponse.json({ success: true });
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set({ name: ADMIN_SESSION_COOKIE, value: await createSessionToken(admin.username), httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: ADMIN_SESSION_MAX_AGE });
    await recordAdminAction(request, { action: "LOGIN", entityType: "AUTH", entityId: admin.id, summary: "Inicio de sesión administrativo" });
    return response;
  } catch (error) {
    const response = handleApiError(error);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
