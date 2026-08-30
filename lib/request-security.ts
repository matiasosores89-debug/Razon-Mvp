import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/app-error";

export function getClientIp(headers: Headers): string {
  return headers.get("cf-connecting-ip")
    || headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || headers.get("x-real-ip")
    || "unknown";
}

export function hashIdentifier(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function enforceRateLimit(input: {
  scope: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
}) {
  const now = new Date();
  const key = hashIdentifier(`${input.scope}:${input.identifier}`);
  const resetAt = new Date(now.getTime() + input.windowSeconds * 1000);

  const bucket = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
    const current = await tx.rateLimitBucket.findUnique({ where: { key } });
    if (!current || current.resetAt <= now) {
      return tx.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
    }
    return tx.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
  });

  if (bucket.count > input.limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000));
    throw new AppError("Demasiadas solicitudes. Esperá unos minutos antes de volver a intentar.", 429, "RATE_LIMITED", { retryAfter });
  }
  return { remaining: Math.max(0, input.limit - bucket.count), resetAt: bucket.resetAt };
}

export const consumeRateLimit = enforceRateLimit;

export async function checkRateLimit(input: { scope: string; identifier: string; limit: number }) {
  const key = hashIdentifier(`${input.scope}:${input.identifier}`);
  const bucket = await prisma.rateLimitBucket.findUnique({ where: { key } });
  if (!bucket) return;
  if (bucket.resetAt <= new Date()) {
    await prisma.rateLimitBucket.delete({ where: { key } }).catch(() => undefined);
    return;
  }
  if (bucket.count >= input.limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt.getTime() - Date.now()) / 1000));
    throw new AppError("Demasiados intentos fallidos. Esperá unos minutos antes de volver a intentar.", 429, "RATE_LIMITED", { retryAfter });
  }
}

export async function resetRateLimit(scope: string, identifier: string) {
  const key = hashIdentifier(`${scope}:${identifier}`);
  await prisma.rateLimitBucket.delete({ where: { key } }).catch(() => undefined);
}

export async function verifyTurnstile(token: unknown, ip: string, expectedAction: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new AppError("La protección anti-spam no está configurada.", 503, "ANTISPAM_UNAVAILABLE");
    }
    return;
  }
  if (typeof token !== "string" || token.length < 10 || token.length > 2048) {
    throw new AppError("Completá la verificación de seguridad para continuar.", 400, "CAPTCHA_REQUIRED");
  }

  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const result = await response.json() as { success?: boolean; action?: string; hostname?: string; "error-codes"?: string[] };
  if (!response.ok || !result.success || (result.action && result.action !== expectedAction)) {
    throw new AppError("La verificación de seguridad venció o no pudo validarse. Intentá nuevamente.", 400, "CAPTCHA_INVALID");
  }
}
