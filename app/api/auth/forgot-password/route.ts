import { randomBytes, createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, getClientIp, verifyTurnstile } from "@/lib/request-security";
import { sendPasswordResetEmail } from "@/lib/email";

const GENERIC_MESSAGE = "Si el correo está registrado, recibirás un enlace para restablecer la contraseña.";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    await enforceRateLimit({ scope: "forgot-password", identifier: ip, limit: 3, windowSeconds: 30 * 60 });
    const body = await request.json() as { email?: unknown; turnstileToken?: unknown };
    await verifyTurnstile(body.turnstileToken, ip, "forgot_password");
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const admin = email ? await prisma.adminUser.findUnique({ where: { email } }) : null;
    let developmentResetUrl: string | undefined;
    if (admin?.isActive) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      await prisma.$transaction([
        prisma.passwordResetToken.updateMany({ where: { adminId: admin.id, usedAt: null }, data: { usedAt: new Date() } }),
        prisma.passwordResetToken.create({ data: { adminId: admin.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } }),
      ]);
      const baseUrl = process.env.APP_URL || request.nextUrl.origin;
      const resetUrl = `${baseUrl}/admin/reset-password?token=${token}`;
      const sent = await sendPasswordResetEmail({ to: admin.email, resetUrl });
      if (!sent && process.env.NODE_ENV !== "production") developmentResetUrl = resetUrl;
    }
    return NextResponse.json({ success: true, message: GENERIC_MESSAGE, ...(developmentResetUrl ? { developmentResetUrl } : {}) });
  } catch {
    // Do not disclose account or mail-provider state.
    return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
  }
}
