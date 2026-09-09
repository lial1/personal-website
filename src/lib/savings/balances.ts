import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  ACCOUNTS,
  ACCOUNT_LABEL,
  BUCKETS,
  BUCKET_ACCOUNT,
  DEFAULT_MILESTONE_TARGET,
  NET_WORTH_ACCOUNTS,
  STALE_PRICE_HOURS,
  type Account,
  type Bucket,
} from "./constants";

/**
 * Every number the app shows is derived here from the ledger. Nothing is typed
 * twice, so nothing can disagree with itself the way the workbook's hand-wired
 * SUMIFs did. Summation happens in Postgres numeric (exact); values are only
 * converted to JS numbers at the display boundary.
 */

type Row = Record<string, unknown>;

async function rows(query: Parameters<typeof db.execute>[0]): Promise<Row[]> {
  const res = (await db.execute(query)) as unknown;
  if (Array.isArray(res)) return res as Row[];
  return ((res as { rows?: Row[] })?.rows ?? []) as Row[];
}

const num = (v: unknown): number => (v == null ? 0 : Number(v));

export type Holding = {
  account: Account;
  ticker: string;
  shares: number;
  price: number | null;
  prevClose: number | null;
  value: number;
  dayChange: number;
  fetchedAt: string | null;
  stale: boolean;
};

export type AccountTotal = {
  account: Account;
  label: string;
  cash: number;
  holdingsValue: number;
  total: number;
  dayChange: number;
  pct: number;
};

export type Portfolio = {
  buckets: Record<Bucket, number>;
  holdings: Holding[];
  accounts: AccountTotal[];
  netWorth: number;
  /** Flowed to checking. Reported beside net worth, never inside it. */
  checking: number;
  dayChange: number;
  pricesAsOf: string | null;
  hasStalePrices: boolean;
  negativeBuckets: Bucket[];
};

/**
 * Cash per bucket:
 *   hysa_tax        = Σ tax withheld            (what Portfolio!E18 did by hand)
 *   other buckets   = Σ allocations to it
 *   investing cash  = ... − Σ buys + Σ sells    (a trade converts cash to shares)
 *   all buckets     = ... + Σ adjustments       (opening balances, interest, fees)
 */
async function cashByBucket(): Promise<Record<Bucket, number>> {
  const result = await rows(sql`
    with parts as (
      select 'hysa_tax'::cash_bucket as bucket, coalesce(sum(tax_withheld), 0) as amt
        from income
      union all
      select bucket, sum(amount) from allocations group by bucket
      union all
      select bucket, sum(amount) from adjustments group by bucket
      union all
      select
        (case account
           when 'brokerage' then 'brokerage_cash'
           when 'roth_ira'  then 'roth_cash'
           when 'coinbase'  then 'coinbase_cash'
           when 'hysa'      then 'hysa_excess'
           else 'checking'
         end)::cash_bucket,
        sum(case when side = 'buy' then -(shares * price) else (shares * price) end)
        from trades group by 1
    )
    select bucket, round(sum(amt), 2) as amt from parts group by bucket
  `);

  const out = Object.fromEntries(BUCKETS.map((b) => [b, 0])) as Record<Bucket, number>;
  for (const r of result) out[r.bucket as Bucket] = num(r.amt);
  return out;
}

/** Shares are the signed sum of trades. Never typed, so never stale. */
async function holdings(): Promise<Holding[]> {
  const result = await rows(sql`
    select
      t.account,
      t.ticker,
      sum(case when t.side = 'buy' then t.shares else -t.shares end) as shares,
      p.price,
      p.prev_close,
      p.fetched_at
    from trades t
    left join prices p on p.ticker = t.ticker
    group by t.account, t.ticker, p.price, p.prev_close, p.fetched_at
    having sum(case when t.side = 'buy' then t.shares else -t.shares end) <> 0
    order by t.account, t.ticker
  `);

  const staleBefore = Date.now() - STALE_PRICE_HOURS * 3600 * 1000;

  return result.map((r) => {
    const shares = num(r.shares);
    const price = r.price == null ? null : num(r.price);
    const prevClose = r.prev_close == null ? null : num(r.prev_close);
    const fetchedAt = r.fetched_at ? new Date(r.fetched_at as string).toISOString() : null;
    const value = price == null ? 0 : shares * price;
    return {
      account: r.account as Account,
      ticker: r.ticker as string,
      shares,
      price,
      prevClose,
      value,
      dayChange: price != null && prevClose != null ? shares * (price - prevClose) : 0,
      fetchedAt,
      // No price, or a price too old to trust, is surfaced rather than read as zero.
      stale: price == null || !fetchedAt || new Date(fetchedAt).getTime() < staleBefore,
    };
  });
}

export async function getPortfolio(): Promise<Portfolio> {
  const [buckets, hs] = await Promise.all([cashByBucket(), holdings()]);

  const accounts: AccountTotal[] = ACCOUNTS.map((account) => {
    const cash = BUCKETS.filter((b) => BUCKET_ACCOUNT[b] === account).reduce(
      (sum, b) => sum + buckets[b],
      0,
    );
    const mine = hs.filter((h) => h.account === account);
    const holdingsValue = mine.reduce((s, h) => s + h.value, 0);
    return {
      account,
      label: ACCOUNT_LABEL[account],
      cash,
      holdingsValue,
      total: cash + holdingsValue,
      dayChange: mine.reduce((s, h) => s + h.dayChange, 0),
      pct: 0,
    };
  });

  // Checking is deliberately outside net worth; see NET_WORTH_ACCOUNTS.
  const counted = accounts.filter((a) => NET_WORTH_ACCOUNTS.includes(a.account));
  const netWorth = counted.reduce((s, a) => s + a.total, 0);
  for (const a of accounts) a.pct = netWorth === 0 ? 0 : a.total / netWorth;

  const stamps = hs.map((h) => h.fetchedAt).filter((v): v is string => !!v);

  return {
    buckets,
    holdings: hs,
    accounts,
    netWorth,
    checking: buckets.checking,
    dayChange: counted.reduce((s, a) => s + a.dayChange, 0),
    pricesAsOf: stamps.length ? stamps.sort().at(-1)! : null,
    hasStalePrices: hs.some((h) => h.stale),
    // A negative cash bucket means a trade or an allocation is missing. Flag, don't hide.
    negativeBuckets: BUCKETS.filter((b) => buckets[b] < -0.005),
  };
}

export async function setMilestoneTarget(value: number): Promise<void> {
  await db.execute(sql`
    insert into settings (key, value) values ('milestone_target', ${String(value)}::jsonb)
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `);
}

export async function getMilestoneTarget(): Promise<number> {
  const result = await rows(sql`select value from settings where key = 'milestone_target'`);
  const raw = result[0]?.value;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MILESTONE_TARGET;
}

export async function getSnapshots(limit = 365) {
  const result = await rows(sql`
    select date, total_value from snapshots order by date desc limit ${limit}
  `);
  return result
    .map((r) => ({ date: String(r.date), total: num(r.total_value) }))
    .reverse();
}

export type TradeRow = {
  id: number;
  date: string;
  account: Account;
  ticker: string;
  side: "buy" | "sell";
  shares: number;
  price: number;
  cost: number;
  note: string | null;
};

export async function listTrades(limit = 25): Promise<TradeRow[]> {
  const result = await rows(sql`
    select id, date, account, ticker, side, shares, price, note
    from trades order by date desc, id desc limit ${limit}
  `);
  return result.map((r) => ({
    id: Number(r.id),
    date: String(r.date),
    account: r.account as Account,
    ticker: String(r.ticker),
    side: r.side as "buy" | "sell",
    shares: num(r.shares),
    price: num(r.price),
    cost: num(r.shares) * num(r.price),
    note: (r.note as string) ?? null,
  }));
}

export type AdjustmentRow = {
  id: number;
  date: string;
  bucket: Bucket;
  amount: number;
  reason: string;
};

export async function listAdjustments(): Promise<AdjustmentRow[]> {
  const result = await rows(sql`
    select id, date, bucket, amount, reason
    from adjustments order by date desc, id desc
  `);
  return result.map((r) => ({
    id: Number(r.id),
    date: String(r.date),
    bucket: r.bucket as Bucket,
    amount: num(r.amount),
    reason: String(r.reason),
  }));
}
