import { NextResponse } from "next/server";
import { guard } from "@/lib/savings/auth";
import { addIncome } from "@/lib/savings/income";
import { parseAllocations } from "@/lib/savings/validate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const b = await req.json().catch(() => null);
  const date = typeof b?.date === "string" ? b.date : "";
  const sourceId = Number(b?.sourceId);
  const gross = Number(b?.gross);
  const taxRate = Number(b?.taxRate);
  const allocations = parseAllocations(b?.allocations);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }
  if (!Number.isInteger(sourceId) || sourceId <= 0) {
    return NextResponse.json({ error: "Pick a source." }, { status: 400 });
  }
  if (!Number.isFinite(gross) || gross <= 0) {
    return NextResponse.json({ error: "Amount must be positive." }, { status: 400 });
  }
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) {
    return NextResponse.json({ error: "Tax rate must be between 0 and 100%." }, { status: 400 });
  }
  if (!allocations) {
    return NextResponse.json({ error: "Invalid destination." }, { status: 400 });
  }

  await addIncome({ date, sourceId, gross, taxRate, allocations });
  return NextResponse.json({ ok: true });
}
