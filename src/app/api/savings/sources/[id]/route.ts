import { NextResponse } from "next/server";
import { guard } from "@/lib/savings/auth";
import { deleteSourceIfUnused, updateSource } from "@/lib/savings/income";
import { parseSourceBody } from "@/lib/savings/validate";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Bad id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = parseSourceBody(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  await updateSource(id, { ...parsed, active: body?.active !== false });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Bad id." }, { status: 400 });
  }

  // Refused when income references it, so history can never be orphaned.
  const removed = await deleteSourceIfUnused(id);
  if (!removed) {
    return NextResponse.json(
      { error: "That source is used by income rows. Turn it off instead." },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
