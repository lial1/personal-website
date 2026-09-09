import { NextResponse } from "next/server";
import { getPasswordHash, verifyPassword } from "@/lib/savings/password";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/savings/session";
import {
  clearAttempts,
  clientIp,
  isRateLimited,
  recordFailedAttempt,
} from "@/lib/savings/auth";

// scrypt is not available on the edge runtime.
export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIp(req);

  if (await isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 },
    );
  }

  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    // fall through to the generic failure below
  }

  if (!verifyPassword(password, await getPasswordHash())) {
    await recordFailedAttempt(ip);
    // Deliberately vague: never distinguish "wrong password" from "not configured".
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  await clearAttempts(ip);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await signSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
