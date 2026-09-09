import { SignJWT, jwtVerify } from "jose";

/**
 * Edge-safe half of auth: JWT only, no node:crypto. `src/middleware.ts` runs on
 * the edge runtime and may import this; it must never import ./password.
 */

export const SESSION_COOKIE = "savings_session";
const SESSION_DAYS = 30;
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

function secret(): Uint8Array {
  const s = process.env.SAVINGS_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SAVINGS_SESSION_SECRET is missing or shorter than 32 chars");
  }
  return new TextEncoder().encode(s);
}

export async function signSession(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("lia")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

/** True only for a signed, unexpired token. Any failure is a false, never a throw. */
export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return payload.sub === "lia";
  } catch {
    return false;
  }
}
