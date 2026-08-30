import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const ADMIN_SESSION_COOKIE = "razor_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

export async function verifyAdminCredentials(username: string, password: string) {
  let admin = await prisma.adminUser.findUnique({ where: { username } });

  // Backwards-compatible bootstrap: the existing environment credential is
  // persisted once, so future password changes survive deploys and restarts.
  if (!admin && username === (process.env.ADMIN_USERNAME ?? "Admin")) {
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    const email = process.env.ADMIN_EMAIL ?? "admin@razor.local";
    if (!passwordHash) throw new Error("Falta configurar ADMIN_PASSWORD_HASH");
    if (!verifyPassword(password, passwordHash)) return null;
    admin = await prisma.adminUser.create({ data: { username, email: email.toLowerCase(), passwordHash } });
  }

  if (!admin?.isActive || !verifyPassword(password, admin.passwordHash)) return null;
  return admin;
}
