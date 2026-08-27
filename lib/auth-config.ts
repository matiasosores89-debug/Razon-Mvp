import { createHash, scryptSync, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "razor_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

export function verifyAdminCredentials(username: string, password: string): boolean {
  const configuredUsername = Buffer.from(process.env.ADMIN_USERNAME ?? "Admin");
  const suppliedUsername = Buffer.from(username);
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) throw new Error("Falta configurar ADMIN_PASSWORD_HASH");
  const [algorithm, saltHex, hashHex] = stored.split(":");
  if (algorithm !== "scrypt" || !saltHex || !hashHex) throw new Error("ADMIN_PASSWORD_HASH tiene un formato invalido");
  const expectedHash = Buffer.from(hashHex, "hex");
  const suppliedHash = scryptSync(password, Buffer.from(saltHex, "hex"), expectedHash.length);
  const usernameMatches = suppliedUsername.length === configuredUsername.length && timingSafeEqual(suppliedUsername, configuredUsername);
  return usernameMatches && timingSafeEqual(suppliedHash, expectedHash);
}

export function getLoginRateLimitKey(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}
