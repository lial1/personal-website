import { NextResponse } from "next/server";
import { guard } from "@/lib/savings/auth";
import { getPasswordHash, hashPassword, setPasswordHash, verifyPassword } from "@/lib/savings/password";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const b = await req.json().catch(() => null);
  const current = typeof b?.current === "string" ? b.current : "";
  const next = typeof b?.next === "string" ? b.next : "";

  // A valid session is not enough: knowing the current password is still required.
  if (!verifyPassword(current, await getPasswordHash())) {
    return NextResponse.json({ error: "Current password is wrong." }, { status: 401 });
  }
  if (next.length < 8) {
    return NextResponse.json({ error: "Use at least 8 characters." }, { status: 400 });
  }

  await setPasswordHash(hashPassword(next));
  return NextResponse.json({ ok: true });
}
