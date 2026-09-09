import { NextResponse } from "next/server";
import { guard } from "@/lib/savings/auth";
import { deleteIncome, updateIncome } from "@/lib/savings/income";
import { isIsoDate } from "@/lib/savings/validate";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Bad id." }, { status: 400 });
  }
  await deleteIncome(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Bad id." }, { status: 400 });
  }

  const b = await req.json().catch(() => null);
  const sourceId = Number(b?.sourceId);
  const gross = Number(b?.gross);
  const taxRate = Number(b?.taxRate);
  const note = typeof b?.note === "string" && b.note.trim() ? b.note.trim() : null;

  if (!isIsoDate(b?.date)) {
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

  await updateIncome(id, { date: b.date, sourceId, gross, taxRate, note });
  return NextResponse.json({ ok: true });
}
