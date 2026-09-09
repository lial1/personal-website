import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Replaces the workbook's GOOGLEFINANCE() calls, which only ever worked inside
 * Google Sheets and were frozen at their fallback values in the .xlsx.
 *
 * Equities/ETFs come from Finnhub (free tier, 60 req/min); BTC from CoinGecko,
 * which needs no key. A ticker that fails to fetch keeps its previous stored
 * price and is surfaced as stale, never written as zero.
 */

const CRYPTO: Record<string, string> = { BTC: "bitcoin" };

export type Quote = { ticker: string; price: number; prevClose: number | null };
export type RefreshReport = {
  updated: string[];
  failed: { ticker: string; reason: string }[];
};

async function fetchEquity(ticker: string, token: string): Promise<Quote> {
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${token}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`finnhub ${res.status}`);
  const j = (await res.json()) as { c?: number; pc?: number };
  // Finnhub answers unknown symbols with 200 and c === 0 rather than an error.
  if (!j.c || j.c <= 0) throw new Error("no quote (unknown symbol?)");
  return { ticker, price: j.c, prevClose: j.pc && j.pc > 0 ? j.pc : null };
}

async function fetchCrypto(ticker: string, id: string): Promise<Quote> {
  const url =
    `https://api.coingecko.com/api/v3/simple/price?ids=${id}` +
    `&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`coingecko ${res.status}`);
  const j = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
  const price = j[id]?.usd;
  if (!price || price <= 0) throw new Error("no quote");
  const pct = j[id]?.usd_24h_change;
  // CoinGecko gives 24h % change, so derive the reference close from it.
  const prevClose = typeof pct === "number" ? price / (1 + pct / 100) : null;
  return { ticker, price, prevClose };
}

/** Tickers actually held, so we never burn quota on positions that were sold off. */
export async function heldTickers(): Promise<string[]> {
  const res = (await db.execute(sql`
    select ticker
    from trades
    group by ticker
    having sum(case when side = 'buy' then shares else -shares end) <> 0
    order by ticker
  `)) as unknown;
  const list = Array.isArray(res) ? res : ((res as { rows?: unknown[] })?.rows ?? []);
  return (list as { ticker: string }[]).map((r) => r.ticker);
}

export async function refreshPrices(): Promise<RefreshReport> {
  const tickers = await heldTickers();
  const token = process.env.FINNHUB_API_KEY;

  const report: RefreshReport = { updated: [], failed: [] };
  const quotes: Quote[] = [];

  for (const ticker of tickers) {
    try {
      if (CRYPTO[ticker]) {
        quotes.push(await fetchCrypto(ticker, CRYPTO[ticker]));
      } else if (!token) {
        throw new Error("FINNHUB_API_KEY is not set");
      } else {
        quotes.push(await fetchEquity(ticker, token));
      }
      report.updated.push(ticker);
    } catch (err) {
      report.failed.push({ ticker, reason: err instanceof Error ? err.message : "failed" });
    }
  }

  if (quotes.length) {
    const payload = JSON.stringify(
      quotes.map((q) => ({
        ticker: q.ticker,
        price: String(q.price),
        prev_close: q.prevClose == null ? null : String(q.prevClose),
      })),
    );
    await db.execute(sql`
      insert into prices (ticker, price, prev_close, currency, fetched_at)
      select e->>'ticker', (e->>'price')::numeric, (e->>'prev_close')::numeric,
             'USD', now()
      from jsonb_array_elements(${payload}::jsonb) e
      on conflict (ticker) do update
        set price = excluded.price,
            prev_close = excluded.prev_close,
            fetched_at = excluded.fetched_at
    `);
  }

  return report;
}

/** One row per day; re-running on the same day overwrites rather than duplicates. */
export async function writeSnapshot(
  total: number,
  byAccount: Record<string, number>,
): Promise<void> {
  await db.execute(sql`
    insert into snapshots (date, total_value, by_account)
    values (current_date, ${total.toFixed(2)}, ${JSON.stringify(byAccount)}::jsonb)
    on conflict (date) do update
      set total_value = excluded.total_value,
          by_account = excluded.by_account
  `);
}
