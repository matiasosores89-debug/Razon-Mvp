import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

function secure(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Content-Security-Policy", "frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  return response;
}

function hasSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname === "/api/admin" || pathname.startsWith("/api/admin/");
  const authenticated = await verifySessionToken(request.cookies.get("razor_admin_session")?.value);

  if (isLogin) return secure(authenticated ? NextResponse.redirect(new URL("/admin", request.url)) : NextResponse.next());
  if ((isAdminPage || isAdminApi) && !authenticated) {
    if (isAdminApi) return secure(NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 }));
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return secure(NextResponse.redirect(loginUrl));
  }
  if (isAdminApi && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    if (!hasSameOrigin(request)) return secure(NextResponse.json({ success: false, message: "Origen no permitido" }, { status: 403 }));
  }
  const response = NextResponse.next();
  if (isAdminPage || isAdminApi) response.headers.set("Cache-Control", "no-store");
  return secure(response);
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
