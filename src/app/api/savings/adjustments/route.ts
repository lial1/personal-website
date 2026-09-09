import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { guard } from "@/lib/savings/auth";
import { BUCKETS, type Bucket } from "@/lib/savings/constants";
import { isIsoDate } from "@/lib/savings/validate";

export const runtime = "nodejs";

/**
 * The escape hatch: interest, fees, tax payments, transfers between accounts,
 * and anything else the ledger cannot infer. Signed.
 */
export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const b = await req.json().catch(() => null);
  const date = b?.date;
  const bucket = b?.bucket;
  const amount = Number(b?.amount);
  const reason = typeof b?.reason === "string" ? b.reason.trim() : "";

  if (!isIsoDate(date)) return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  if (typeof bucket !== "string" || !(BUCKETS as readonly string[]).includes(bucket)) {
    return NextResponse.json({ error: "Unknown bucket." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount === 0) {
    return NextResponse.json({ error: "Amount must be non-zero." }, { status: 400 });
  }
  if (!reason || reason.length > 200) {
    return NextResponse.json({ error: "Say what it was for (200 chars max)." }, { status: 400 });
  }

  await db.execute(sql`
    insert into adjustments (date, bucket, amount, reason)
    values (${date}, ${bucket as Bucket}::cash_bucket, ${amount.toFixed(2)}, ${reason})
  `);
  return NextResponse.json({ ok: true });
}
