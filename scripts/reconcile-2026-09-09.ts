/**
 * One-off: reconcile holdings and cash to the broker/bank statements of
 * 2026-09-09 (Schwab Individual + Roth, Marcus savings + CD, Coinbase).
 *
 * Holdings are derived from trades, so bringing a position to its true size
 * means logging the delta as a trade. Cash is set with adjustments, which is
 * exactly what that table is for.
 *
 *   npx tsx scripts/reconcile-2026-09-09.ts            # dry run
 *   npx tsx scripts/reconcile-2026-09-09.ts --commit
 */
import { sql } from "drizzle-orm";
import { db } from "../src/db";
import type { Account, Bucket } from "../src/lib/savings/constants";

const COMMIT = process.argv.includes("--commit");
const DATE = "2026-09-09";
const NOTE = "Reconciled to statement 2026-09-09";

/** Shares and last price as shown in each app. */
const TARGET_HOLDINGS: { account: Account; ticker: string; shares: number; price: number }[] = [
  // Schwab Roth Contributory IRA - account value 2,328.78
  { account: "roth_ira", ticker: "QQQ", shares: 1, price: 718.36 },
  { account: "roth_ira", ticker: "VOO", shares: 2, price: 704.07 },
  // Schwab Individual - account value 15,912.94
  { account: "brokerage", ticker: "AMPH", shares: 5, price: 22.93 },
  { account: "brokerage", ticker: "AAPL", shares: 4, price: 316.22 },
  { account: "brokerage", ticker: "INTC", shares: 5, price: 104.47 },
  { account: "brokerage", ticker: "NVO", shares: 9, price: 45.16 },
  { account: "brokerage", ticker: "NVDA", shares: 3, price: 225.73 },
  { account: "brokerage", ticker: "RKLB", shares: 2, price: 65.87 },
  { account: "brokerage", ticker: "FXY", shares: 2, price: 59.56 },
  { account: "brokerage", ticker: "VOO", shares: 18, price: 704.07 },
  // Coinbase - 908.73
  { account: "coinbase", ticker: "BTC", shares: 0.01147716, price: 908.73 / 0.01147716 },
];

/** Cash as shown. HYSA is Marcus: Online Savings 3,838.64 + CD 5,099.93. */
const MARCUS_TOTAL = 3838.64 + 5099.93;
const EMERGENCY = 2000;

const TARGET_CASH: Partial<Record<Bucket, number>> = {
  roth_cash: 202.28,
  brokerage_cash: 3.31,
  coinbase_cash: 0,
  hysa_emergency: EMERGENCY,
};

type Row = Record<string, unknown>;
const rows = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  const r = (await db.execute(q)) as unknown;
  return (Array.isArray(r) ? r : ((r as { rows?: Row[] }).rows ?? [])) as Row[];
};
const num = (v: unknown) => (v == null ? 0 : Number(v));
const money = (x: number) => Math.round(x * 100) / 100;
const fmt = (x: number) =>
  (x < 0 ? "-" : "") + Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function main() {
  console.log(`\nReconcile to ${DATE}  (${COMMIT ? "COMMIT" : "DRY RUN"})`);
  console.log("-".repeat(72));

  // ---- holdings -------------------------------------------------------
  const current = await rows(sql`
    select account, ticker,
           sum(case when side = 'buy' then shares else -shares end) as shares
    from trades group by account, ticker
  `);
  const held = new Map<string, number>();
  for (const r of current) held.set(`${r.account}|${r.ticker}`, num(r.shares));

  const trades: { account: Account; ticker: string; side: "buy" | "sell"; shares: number; price: number }[] = [];

  for (const t of TARGET_HOLDINGS) {
    const key = `${t.account}|${t.ticker}`;
    const now = held.get(key) ?? 0;
    held.delete(key);
    const delta = t.shares - now;
    if (Math.abs(delta) < 1e-9) continue;
    trades.push({
      account: t.account,
      ticker: t.ticker,
      side: delta > 0 ? "buy" : "sell",
      // Rounded: float subtraction leaves artefacts like 0.0074671600000000005.
      shares: Math.round(Math.abs(delta) * 1e8) / 1e8,
      price: t.price,
    });
  }
  // Anything still in the map is a position that no longer exists: sell it off.
  for (const [key, shares] of held) {
    if (Math.abs(shares) < 1e-9) continue;
    const [account, ticker] = key.split("|");
    const priced = await rows(sql`select price from prices where ticker = ${ticker}`);
    trades.push({
      account: account as Account,
      ticker,
      side: "sell",
      shares,
      price: num(priced[0]?.price) || 0.01,
    });
  }

  console.log("\nHOLDING CHANGES");
  for (const t of trades) {
    console.log(
      `  ${t.side === "buy" ? "BUY " : "SELL"} ${String(t.shares).padStart(12)} ${t.ticker.padEnd(5)} ` +
        `@ ${fmt(t.price).padStart(11)}  (${t.account})`,
    );
  }
  if (!trades.length) console.log("  none");

  // ---- cash -----------------------------------------------------------
  const bucketNow = async (b: Bucket): Promise<number> => {
    const r = await rows(sql`
      with parts as (
        select coalesce(sum(amount), 0) as amt from allocations where bucket = ${b}::cash_bucket
        union all
        select coalesce(sum(amount), 0) from adjustments where bucket = ${b}::cash_bucket
        union all
        select coalesce(sum(case when side = 'buy' then -(shares * price) else (shares * price) end), 0)
          from trades where (case account
            when 'brokerage' then 'brokerage_cash' when 'roth_ira' then 'roth_cash'
            when 'coinbase' then 'coinbase_cash' when 'hysa' then 'hysa_excess'
            else 'checking' end)::cash_bucket = ${b}::cash_bucket
      )
      select round(sum(amt), 2) as amt from parts
    `);
    return num(r[0]?.amt);
  };

  // Trades logged above move investing cash too, so account for them here.
  const tradeCashDelta: Partial<Record<Bucket, number>> = {};
  const bucketOf: Record<string, Bucket> = {
    brokerage: "brokerage_cash",
    roth_ira: "roth_cash",
    coinbase: "coinbase_cash",
  };
  for (const t of trades) {
    const b = bucketOf[t.account];
    if (!b) continue;
    tradeCashDelta[b] = money((tradeCashDelta[b] ?? 0) + (t.side === "buy" ? -1 : 1) * t.shares * t.price);
  }

  const taxRow = await rows(sql`select coalesce(sum(tax_withheld), 0) as t from income`);
  const taxWithheld = money(num(taxRow[0]?.t));
  // Marcus total must land on the statement, so Excess absorbs the remainder.
  const targetExcess = money(MARCUS_TOTAL - taxWithheld - EMERGENCY);
  const targets = { ...TARGET_CASH, hysa_excess: targetExcess } as Record<Bucket, number>;

  console.log("\nCASH ADJUSTMENTS");
  const adjustments: { bucket: Bucket; amount: number }[] = [];
  for (const [bucket, target] of Object.entries(targets) as [Bucket, number][]) {
    const after = money((await bucketNow(bucket)) + (tradeCashDelta[bucket] ?? 0));
    const delta = money(target - after);
    console.log(`  ${bucket.padEnd(16)} now ${fmt(after).padStart(11)} -> ${fmt(target).padStart(11)}   adj ${fmt(delta).padStart(11)}`);
    if (delta !== 0) adjustments.push({ bucket, amount: delta });
  }

  console.log("\nRESULT");
  console.log(`  HYSA (Marcus: savings + CD)   ${fmt(MARCUS_TOTAL).padStart(11)}`);
  console.log(`  Tax withheld to date          ${fmt(taxWithheld).padStart(11)}`);
  console.log(`  Available against it          ${fmt(taxWithheld + targetExcess).padStart(11)}`);

  if (!COMMIT) {
    console.log("\nDry run. Re-run with --commit to write.\n");
    return;
  }

  for (const t of trades) {
    await db.execute(sql`
      insert into trades (date, account, ticker, side, shares, price, note)
      values (${DATE}, ${t.account}::account, ${t.ticker}, ${t.side}::trade_side,
              ${String(t.shares)}, ${String(t.price)}, ${NOTE})
    `);
  }
  for (const a of adjustments) {
    await db.execute(sql`
      insert into adjustments (date, bucket, amount, reason)
      values (${DATE}, ${a.bucket}::cash_bucket, ${a.amount.toFixed(2)},
              ${a.bucket === "hysa_excess" ? `${NOTE} (Marcus savings 3,838.64 + CD 5,099.93)` : NOTE})
    `);
  }
  console.log("\nCommitted.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
