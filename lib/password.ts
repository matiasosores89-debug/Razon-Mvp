import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algorithm, saltHex, hashHex] = stored.split(":");
  if (algorithm !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const supplied = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function validateNewPassword(password: unknown): asserts password is string {
  if (typeof password !== "string" || password.length < 12 || password.length > 128 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new Error("La contraseña debe tener entre 12 y 128 caracteres e incluir mayúscula, minúscula y número.");
  }
}
