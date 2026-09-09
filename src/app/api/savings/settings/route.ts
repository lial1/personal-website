import { NextResponse } from "next/server";
import { guard } from "@/lib/savings/auth";
import { setMilestoneTarget } from "@/lib/savings/balances";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const b = await req.json().catch(() => null);
  const target = Number(b?.milestoneTarget);
  if (!Number.isFinite(target) || target <= 0 || target > 100_000_000) {
    return NextResponse.json({ error: "Target must be a positive number." }, { status: 400 });
  }

  await setMilestoneTarget(target);
  return NextResponse.json({ ok: true });
}
