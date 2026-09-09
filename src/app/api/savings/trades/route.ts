import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { guard } from "@/lib/savings/auth";
import { ACCOUNTS } from "@/lib/savings/constants";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const b = await req.json().catch(() => null);
  const date = typeof b?.date === "string" ? b.date : "";
  const account = typeof b?.account === "string" ? b.account : "";
  const ticker = typeof b?.ticker === "string" ? b.ticker.trim().toUpperCase() : "";
  const side = b?.side === "sell" ? "sell" : "buy";
  const shares = Number(b?.shares);
  const price = Number(b?.price);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }
  if (!(ACCOUNTS as readonly string[]).includes(account)) {
    return NextResponse.json({ error: "Unknown account." }, { status: 400 });
  }
  if (!/^[A-Z0-9.\-]{1,12}$/.test(ticker)) {
    return NextResponse.json({ error: "Invalid ticker." }, { status: 400 });
  }
  if (!Number.isFinite(shares) || shares <= 0 || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: "Shares and price must be positive." }, { status: 400 });
  }

  await db.execute(sql`
    insert into trades (date, account, ticker, side, shares, price)
    values (${date}, ${account}::account, ${ticker}, ${side}::trade_side,
            ${String(shares)}, ${String(price)})
  `);

  return NextResponse.json({ ok: true });
}
