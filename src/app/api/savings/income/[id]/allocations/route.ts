import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { guard } from "@/lib/savings/auth";
import { parseAllocations } from "@/lib/savings/validate";

export const runtime = "nodejs";

/** Replaces a row's destinations wholesale, in one statement. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Bad id." }, { status: 400 });
  }

  const b = await req.json().catch(() => null);
  const allocations = parseAllocations(b?.allocations);
  if (!allocations) {
    return NextResponse.json({ error: "Invalid destination." }, { status: 400 });
  }

  const payload = JSON.stringify(
    allocations.map((a) => ({ bucket: a.bucket, amount: a.amount.toFixed(2) })),
  );

  await db.execute(sql`
    with cleared as (
      delete from allocations where income_id = ${id} returning 1
    )
    insert into allocations (income_id, bucket, amount)
    select ${id}, (e->>'bucket')::cash_bucket, (e->>'amount')::numeric
    from jsonb_array_elements(${payload}::jsonb) e
    where exists (select 1 from income where id = ${id})
  `);

  return NextResponse.json({ ok: true });
}
