import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Node-only half of auth. scrypt is unavailable on the edge runtime, so anything
 * importing this must declare `export const runtime = "nodejs"`.
 *
 * Stored format: scrypt:<saltHex>:<hashHex>. Colon-separated, not "$":
 * Next.js expands $VAR references inside .env files, which would eat the salt.
 */

const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize("NFKC"), salt, KEYLEN);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false;
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (salt.length === 0 || expected.length !== KEYLEN) return false;

  const actual = scryptSync(password.normalize("NFKC"), salt, KEYLEN);
  return timingSafeEqual(actual, expected);
}
