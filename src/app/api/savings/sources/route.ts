import { NextResponse } from "next/server";
import { guard } from "@/lib/savings/auth";
import { addSource } from "@/lib/savings/income";
import { parseSourceBody } from "@/lib/savings/validate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const parsed = parseSourceBody(await req.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  await addSource(parsed);
  return NextResponse.json({ ok: true });
}
