import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionSubject } from "@/lib/session";
import { hashPassword, validateNewPassword, verifyPassword } from "@/lib/password";
import { recordAdminAction } from "@/lib/audit";

export async function PUT(request: NextRequest) {
  try {
    const actor = await getSessionSubject(request.cookies.get("razor_admin_session")?.value);
    if (!actor) return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    const { currentPassword, newPassword } = await request.json() as Record<string, unknown>;
    const admin = await prisma.adminUser.findUnique({ where: { username: actor } });
    if (!admin || typeof currentPassword !== "string" || !verifyPassword(currentPassword, admin.passwordHash)) {
      return NextResponse.json({ success: false, message: "La contraseña actual no es correcta." }, { status: 400 });
    }
    validateNewPassword(newPassword);
    if (verifyPassword(newPassword, admin.passwordHash)) {
      return NextResponse.json({ success: false, message: "La nueva contraseña debe ser diferente de la actual." }, { status: 400 });
    }
    await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash: hashPassword(newPassword) } });
    await recordAdminAction(request, { action: "PASSWORD_CHANGE", entityType: "AUTH", entityId: admin.id, summary: "Contraseña cambiada desde Seguridad" });
    return NextResponse.json({ success: true, message: "Contraseña actualizada correctamente." });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "No se pudo cambiar la contraseña." }, { status: 400 });
  }
}
