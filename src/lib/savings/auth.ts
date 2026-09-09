import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { and, gte, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";
import { SESSION_COOKIE, verifySession } from "./session";

/**
 * Middleware gates the routes, but middleware is not an authorization boundary:
 * every /api/savings handler re-checks the session itself.
 */
export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Returns a 401 response to bail out with, or null when the caller may proceed. */
export async function guard(): Promise<NextResponse | null> {
  if (await isAuthed()) return null;
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

const MAX_ATTEMPTS = 10;
const WINDOW_MINUTES = 15;

export async function isRateLimited(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.ip, ip), gte(loginAttempts.at, since)));
  return (row?.n ?? 0) >= MAX_ATTEMPTS;
}

export async function recordFailedAttempt(ip: string): Promise<void> {
  await db.insert(loginAttempts).values({ ip });
}

/** Clear the record on success so a good login resets the window. */
export async function clearAttempts(ip: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.ip, ip));
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
