import { prisma } from "@/lib/prisma";
import { getSessionSubject } from "@/lib/session";
import { getClientIp, hashIdentifier } from "@/lib/request-security";

export async function recordAdminAction(request: Request, entry: {
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  const cookie = request.headers.get("cookie")?.match(/(?:^|;\s*)razor_admin_session=([^;]+)/)?.[1];
  const actor = await getSessionSubject(cookie ? decodeURIComponent(cookie) : undefined) ?? "Administrador";
  const admin = await prisma.adminUser.findUnique({ where: { username: actor }, select: { id: true } });
  return prisma.adminAuditLog.create({
    data: {
      adminId: admin?.id,
      actor,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      summary: entry.summary,
      metadata: entry.metadata as never,
      ipHash: hashIdentifier(getClientIp(request.headers)),
    },
  });
}
