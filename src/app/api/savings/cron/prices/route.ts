import { NextResponse } from "next/server";
import { refreshPrices, writeSnapshot } from "@/lib/savings/prices";
import { getPortfolio } from "@/lib/savings/balances";

// Machine-to-machine: authenticated by CRON_SECRET, not the session cookie.
export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const report = await refreshPrices();
  const portfolio = await getPortfolio();
  await writeSnapshot(
    portfolio.netWorth,
    Object.fromEntries(portfolio.accounts.map((a) => [a.account, a.total])),
  );
  return NextResponse.json({ ...report, netWorth: portfolio.netWorth });
}
