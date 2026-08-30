import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validateNewPassword } from "@/lib/password";
import { enforceRateLimit, getClientIp } from "@/lib/request-security";
import { recordAdminAction } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit({ scope: "reset-password", identifier: getClientIp(request.headers), limit: 5, windowSeconds: 30 * 60 });
    const { token, password } = await request.json() as { token?: unknown; password?: unknown };
    if (typeof token !== "string" || token.length !== 64) throw new Error();
    validateNewPassword(password);
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash }, include: { admin: true } });
    if (!reset || reset.usedAt || reset.expiresAt <= new Date() || !reset.admin.isActive) throw new Error();
    await prisma.$transaction([
      prisma.adminUser.update({ where: { id: reset.adminId }, data: { passwordHash: hashPassword(password) } }),
      prisma.passwordResetToken.updateMany({ where: { adminId: reset.adminId, usedAt: null }, data: { usedAt: new Date() } }),
    ]);
    await recordAdminAction(request, { action: "PASSWORD_RESET", entityType: "AUTH", entityId: reset.adminId, summary: "Contraseña restablecida mediante enlace seguro" });
    return NextResponse.json({ success: true, message: "Contraseña actualizada. Ya podés iniciar sesión." });
  } catch {
    return NextResponse.json({ success: false, message: "El enlace venció, ya fue utilizado o la contraseña no cumple los requisitos." }, { status: 400 });
  }
}
