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

/**
 * The live hash: the settings table wins, the env var is the fallback.
 *
 * Keeping it in the database means the password can be changed from the site
 * itself, with no redeploy and no copy-pasting a hash into Vercel (where a
 * mangled paste locks you out with no way to tell).
 */
export async function getPasswordHash(): Promise<string | undefined> {
  const { sql } = await import("drizzle-orm");
  const { db } = await import("@/db");
  try {
    const res = (await db.execute(
      sql`select value from settings where key = 'password_hash'`,
    )) as unknown;
    const list = Array.isArray(res) ? res : ((res as { rows?: unknown[] })?.rows ?? []);
    const stored = (list as { value?: unknown }[])[0]?.value;
    if (typeof stored === "string" && stored.startsWith("scrypt:")) return stored;
  } catch {
    // Table unreachable: fall through to the env var rather than locking the door.
  }
  return process.env.SAVINGS_PASSWORD_HASH;
}

export async function setPasswordHash(hash: string): Promise<void> {
  const { sql } = await import("drizzle-orm");
  const { db } = await import("@/db");
  await db.execute(sql`
    insert into settings (key, value) values ('password_hash', ${JSON.stringify(hash)}::jsonb)
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `);
}
