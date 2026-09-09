import { NextResponse } from "next/server";
import { guard } from "@/lib/savings/auth";
import { refreshPrices, writeSnapshot } from "@/lib/savings/prices";
import { getPortfolio } from "@/lib/savings/balances";

export const runtime = "nodejs";

export async function POST() {
  const denied = await guard();
  if (denied) return denied;

  const report = await refreshPrices();
  const portfolio = await getPortfolio();
  await writeSnapshot(
    portfolio.netWorth,
    Object.fromEntries(portfolio.accounts.map((a) => [a.account, a.total])),
  );
  return NextResponse.json(report);
}
