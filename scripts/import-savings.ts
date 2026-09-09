/**
 * One-off migration: the savings workbook -> Neon.
 *
 *   npx tsx scripts/import-savings.ts "/path/to/workbook.xlsx"            # dry run
 *   npx tsx scripts/import-savings.ts "/path/to/workbook.xlsx" --commit   # write
 *
 * The workbook path is an argument and is never stored in the repo. Nothing here
 * hardcodes a figure from it.
 */
import { sql } from "drizzle-orm";
import { db } from "../src/db";
import { readWorkbook, serialToISO } from "./lib/xlsx";
import type { Bucket } from "../src/lib/savings/constants";

const PATH = process.argv[2];
const COMMIT = process.argv.includes("--commit");
if (!PATH) {
  console.error('usage: npx tsx scripts/import-savings.ts "<workbook.xlsx>" [--commit]');
  process.exit(1);
}

const S_PORT = "Portfolio";
const S_2025 = "2025 Income Tracker";
const S_2026 = "2026 Income Tracker ";

const wb = readWorkbook(PATH);

const n = (v: string): number => {
  const x = Number(String(v).trim());
  return Number.isFinite(x) ? x : 0;
};
const money = (x: number) => Math.round(x * 100) / 100;
const fmt = (x: number) =>
  (x < 0 ? "-" : "") +
  Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---------------------------------------------------------------- portfolio

const ACCOUNT_OF: Record<string, string> = {
  "roth ira": "roth_ira",
  brokerage: "brokerage",
  hysa: "hysa",
  coinbase: "coinbase",
};

/** The workbook writes Apple as "APPL" and Bitcoin by name; neither resolves. */
const TICKER_FIX: Record<string, string> = { APPL: "AAPL", BITCOIN: "BTC" };

type Opening = { account: string; ticker: string; shares: number; price: number };
const openings: Opening[] = [];
const statedCash: Partial<Record<Bucket, number>> = {};

{
  let account = "";
  for (const row of wb.rowNumbers(S_PORT)) {
    if (row === 1) continue;
    const a = wb.get(S_PORT, `A${row}`).trim().toLowerCase();
    if (a && ACCOUNT_OF[a]) account = ACCOUNT_OF[a];
    if (!account) continue;

    const label = wb.get(S_PORT, `B${row}`).trim();
    const shares = wb.get(S_PORT, `C${row}`).trim();
    const price = wb.get(S_PORT, `D${row}`).trim();
    const value = wb.get(S_PORT, `E${row}`).trim();
    if (!label) continue;

    const key = label.toLowerCase();
    // Cash-like lines carry a value but no share/price pair.
    if (key === "cash" && account === "roth_ira") statedCash.roth_cash = n(value);
    else if (key === "cash" && account === "brokerage") statedCash.brokerage_cash = n(value);
    else if (key === "cash" && account === "coinbase") statedCash.coinbase_cash = n(value);
    else if (account === "hysa" && key.startsWith("tax")) statedCash.hysa_tax = n(value);
    else if (account === "hysa" && key.startsWith("emergency")) statedCash.hysa_emergency = n(value);
    else if (account === "hysa" && key.startsWith("excess")) statedCash.hysa_excess = n(value);
    else if (shares && price) {
      const t = label.toUpperCase();
      openings.push({
        account,
        ticker: TICKER_FIX[t] ?? t,
        shares: n(shares),
        price: n(price),
      });
    }
  }
}

// ------------------------------------------------------------------- income

type Parsed = {
  sheet: string;
  row: number;
  date: string;
  serial: number;
  gross: number;
  source: string;
  taxWithheld: number;
  allocations: { bucket: Bucket; amount: number }[];
  allocNote: string | null;
};

const ALLOC_TEXT: Record<string, Bucket> = {
  "stayed in checking": "checking",
  checking: "checking",
  brokerage: "brokerage_cash",
  hysa: "hysa_excess",
  "coinbase (btc)": "coinbase_cash",
  coinbase: "coinbase_cash",
  "roth ira": "roth_cash",
};

const parsed: Parsed[] = [];
const needsSplit: Parsed[] = [];

// 2026 sheet: allocation is a text label in column E.
for (const row of wb.rowNumbers(S_2026)) {
  if (row === 1) continue;
  const serial = n(wb.get(S_2026, `A${row}`));
  const gross = n(wb.get(S_2026, `B${row}`));
  const source = wb.get(S_2026, `C${row}`).trim();
  if (!serial || !gross || !source) continue;

  const label = wb.get(S_2026, `E${row}`).trim();
  const key = label.toLowerCase().replace(/\s+/g, " ").trim();
  const net = money(gross - n(wb.get(S_2026, `D${row}`)));

  let allocations: { bucket: Bucket; amount: number }[] = [];
  let allocNote: string | null = null;
  if (!label) allocNote = "no destination recorded in the workbook";
  else if (key.includes(",")) allocNote = `split across "${label}" with no amounts given`;
  else if (ALLOC_TEXT[key]) allocations = [{ bucket: ALLOC_TEXT[key], amount: net }];
  else allocNote = `unrecognised destination "${label}"`;

  const p: Parsed = {
    sheet: "2026",
    row,
    date: serialToISO(serial),
    serial,
    gross,
    source,
    taxWithheld: n(wb.get(S_2026, `D${row}`)),
    allocations,
    allocNote,
  };
  parsed.push(p);
  if (allocNote) needsSplit.push(p);
}

// 2025 sheet rows 2-12: destinations are real amounts in columns F/G/H/I.
const COL_BUCKET: [string, Bucket][] = [
  ["F", "brokerage_cash"],
  ["G", "coinbase_cash"],
  ["H", "hysa_excess"],
  ["I", "checking"],
];

for (const row of wb.rowNumbers(S_2025)) {
  if (row < 2 || row > 12) continue;
  const serial = n(wb.get(S_2025, `A${row}`));
  const gross = n(wb.get(S_2025, `B${row}`));
  const source = wb.get(S_2025, `C${row}`).trim();
  if (!serial || !gross || !source) continue;

  const allocations = COL_BUCKET.map(([col, bucket]) => ({
    bucket,
    amount: n(wb.get(S_2025, `${col}${row}`)),
  })).filter((a) => a.amount !== 0);

  const p: Parsed = {
    sheet: "2025",
    row,
    date: serialToISO(serial),
    serial,
    gross,
    source,
    taxWithheld: n(wb.get(S_2025, `D${row}`)),
    allocations,
    allocNote: allocations.length ? null : "no destination recorded in the workbook",
  };
  parsed.push(p);
  if (!allocations.length) needsSplit.push(p);
}

// 2025 rows 14-26 restate FY26 transactions that already live on the 2026 sheet,
// with conflicting dates and source labels. Skipped, but reported.
type Conflict = { amount: number; a: string; b: string };
const conflicts: Conflict[] = [];
for (const row of wb.rowNumbers(S_2025)) {
  if (row < 14) continue;
  const serial = n(wb.get(S_2025, `A${row}`));
  const gross = n(wb.get(S_2025, `B${row}`));
  const source = wb.get(S_2025, `C${row}`).trim();
  if (!serial || !gross || !source) continue;

  const twin = parsed.find(
    (p) => p.sheet === "2026" && Math.abs(p.gross - gross) < 0.005,
  );
  if (twin && (twin.date !== serialToISO(serial) || twin.source !== source)) {
    conflicts.push({
      amount: gross,
      a: `2025 sheet row ${row}: ${serialToISO(serial)}, ${source}`,
      b: `2026 sheet row ${twin.row}: ${twin.date}, ${twin.source}`,
    });
  }
}

// ------------------------------------------------------------------ sources

const sourceRates = new Map<string, number[]>();
for (const p of parsed) {
  const rate = p.gross === 0 ? 0 : money(p.taxWithheld / p.gross * 10000) / 10000;
  sourceRates.set(p.source, [...(sourceRates.get(p.source) ?? []), rate]);
}
/** Default rate per source = the rate that source is charged most often. */
const sourceDefault = new Map<string, number>();
for (const [name, rates] of sourceRates) {
  const counts = new Map<number, number>();
  for (const r of rates) counts.set(r, (counts.get(r) ?? 0) + 1);
  sourceDefault.set(name, [...counts].sort((x, y) => y[1] - x[1])[0][0]);
}

// ------------------------------------------------------------------- plugs

const openingDate = parsed.map((p) => p.date).sort()[0] ?? "2025-01-01";

const tradeCostByBucket: Partial<Record<Bucket, number>> = {};
for (const o of openings) {
  const b = (
    { roth_ira: "roth_cash", brokerage: "brokerage_cash", coinbase: "coinbase_cash" } as const
  )[o.account as "roth_ira" | "brokerage" | "coinbase"];
  tradeCostByBucket[b] = money((tradeCostByBucket[b] ?? 0) + o.shares * o.price);
}

const allocByBucket: Partial<Record<Bucket, number>> = {};
for (const p of parsed)
  for (const a of p.allocations)
    allocByBucket[a.bucket] = money((allocByBucket[a.bucket] ?? 0) + a.amount);

const totalTaxWithheld = money(parsed.reduce((s, p) => s + p.taxWithheld, 0));

/** ledger-only balance, before any opening adjustment */
const fromLedger = (b: Bucket) =>
  money(
    (b === "hysa_tax" ? totalTaxWithheld : 0) +
      (allocByBucket[b] ?? 0) -
      (tradeCostByBucket[b] ?? 0),
  );

const statedHysaTotal = money(
  (statedCash.hysa_tax ?? 0) + (statedCash.hysa_emergency ?? 0) + (statedCash.hysa_excess ?? 0),
);

const plugs: { bucket: Bucket; amount: number; reason: string }[] = [];
const addPlug = (bucket: Bucket, target: number, reason: string) => {
  const amount = money(target - fromLedger(bucket));
  if (amount !== 0) plugs.push({ bucket, amount, reason });
};

for (const b of ["roth_cash", "brokerage_cash", "coinbase_cash"] as Bucket[]) {
  addPlug(b, statedCash[b] ?? 0, `Opening balance / transfers the ledger never recorded, as of ${openingDate}`);
}
// hysa_tax gets no plug: it is the sum of withheld taxes, which is its definition.
addPlug("hysa_emergency", statedCash.hysa_emergency ?? 0, `Opening balance from workbook`);
// Total HYSA is a real bank balance, so it is preserved even though the split changes.
addPlug(
  "hysa_excess",
  money(statedHysaTotal - totalTaxWithheld - (statedCash.hysa_emergency ?? 0)),
  `Opening balance / unrecorded outflows; keeps total HYSA at the workbook figure`,
);

// ------------------------------------------------------------------- report

const line = (s = "") => console.log(s);
const rule = () => line("-".repeat(74));

line();
line(`Savings Tracker import  (${COMMIT ? "COMMIT" : "DRY RUN"})`);
rule();
line(`income rows      ${parsed.length}  (${parsed.filter((p) => p.sheet === "2025").length} FY25, ${parsed.filter((p) => p.sheet === "2026").length} FY26)`);
line(`sources          ${sourceDefault.size}`);
line(`opening holdings ${openings.length}`);
line(`opening date     ${openingDate}`);
line();

line("SOURCES (default tax rate inferred from how the workbook actually taxed each)");
rule();
for (const [name, rate] of [...sourceDefault].sort())
  line(`  ${name.padEnd(24)} ${(rate * 100).toFixed(1).padStart(5)}%`);
line();

line("OPENING HOLDINGS");
rule();
for (const o of openings)
  line(
    `  ${o.account.padEnd(11)} ${o.ticker.padEnd(6)} ${String(o.shares).padStart(10)} sh @ ${fmt(o.price).padStart(10)}  = ${fmt(o.shares * o.price).padStart(11)}`,
  );
line();

line("OPENING BALANCE PLUGS  (what the ledger alone does not explain)");
rule();
for (const p of plugs) line(`  ${p.bucket.padEnd(16)} ${fmt(p.amount).padStart(11)}   ${p.reason}`);
line();
line(`  A large negative plug is money that entered a bucket in the ledger and then`);
line(`  left again without ever being written down (spending, or a transfer between`);
line(`  accounts). It is the price of starting from a snapshot rather than a full`);
line(`  history. From here on, every movement is recorded, so plugs stop appearing.`);
line();

line("FIXES APPLIED  (each of these is a workbook bug, not an import error)");
rule();
line(`  Portfolio!E18 labels ${fmt(statedCash.hysa_tax ?? 0)} as the HYSA tax set-aside,`);
line(`  but its formula sums the 2025 sheet's *Brokerage* column, not its tax column.`);
line(`  Sum of tax actually withheld across all income: ${fmt(totalTaxWithheld)}`);
line(`  Total HYSA is preserved at ${fmt(statedHysaTotal)}; only the split changes.`);
line();
line(`  "APPL" renamed to AAPL and "Bitcoin" to BTC, so both resolve against a price API.`);
line();
line(`  Every holding gets a value from shares x price. The workbook left the value`);
line(`  formula off OMC and IAU, so they were absent from every total it produced.`);
line();

if (conflicts.length) {
  line(`NEEDS YOUR CALL: ${conflicts.length} transactions recorded twice, inconsistently`);
  rule();
  for (const c of conflicts) {
    line(`  ${fmt(c.amount)}`);
    line(`     kept:    ${c.b}`);
    line(`     skipped: ${c.a}`);
  }
  line(`  The 2026 sheet's version was kept. Fix any that are wrong in the app.`);
  line();
}

const over = parsed.filter(
  (p) =>
    p.allocations.length &&
    Math.abs(
      p.allocations.reduce((s, a) => s + a.amount, 0) - money(p.gross - p.taxWithheld),
    ) > 0.01,
);
if (over.length) {
  line(`NEEDS YOUR CALL: ${over.length} rows whose destinations do not sum to net`);
  rule();
  for (const p of over) {
    const alloc = p.allocations.reduce((s, a) => s + a.amount, 0);
    line(
      `  ${p.date}  ${p.source.padEnd(20)} net ${fmt(money(p.gross - p.taxWithheld)).padStart(9)}  allocated ${fmt(alloc).padStart(9)}`,
    );
  }
  line();
}

if (needsSplit.length) {
  line(`UNALLOCATED: ${needsSplit.length} rows imported with no destination`);
  rule();
  for (const p of needsSplit)
    line(`  ${p.date}  ${p.source.padEnd(20)} ${fmt(p.gross).padStart(9)}   ${p.allocNote}`);
  line(`  These show an "Unallocated" chip in the app; assign them there.`);
  line();
}

// ------------------------------------------------------------------- write

if (!COMMIT) {
  line("Dry run only. Re-run with --commit to write.");
  process.exit(0);
}

async function commit() {
  const sourceIds = new Map<string, number>();
  for (const [name, rate] of sourceDefault) {
    const res = (await db.execute(sql`
      insert into sources (name, default_tax_rate) values (${name}, ${rate.toFixed(4)})
      on conflict (name) do update set default_tax_rate = excluded.default_tax_rate
      returning id
    `)) as unknown;
    const list = Array.isArray(res) ? res : ((res as { rows?: unknown[] }).rows ?? []);
    sourceIds.set(name, Number((list as { id: number }[])[0].id));
  }

  for (const o of openings) {
    await db.execute(sql`
      insert into trades (date, account, ticker, side, shares, price, note)
      values (${openingDate}, ${o.account}::account, ${o.ticker}, 'buy',
              ${String(o.shares)}, ${String(o.price)},
              'Opening position imported from workbook')
    `);
  }

  for (const p of parsed) {
    const rate = p.gross === 0 ? 0 : p.taxWithheld / p.gross;
    const allocs = JSON.stringify(
      p.allocations.map((a) => ({ bucket: a.bucket, amount: a.amount.toFixed(2) })),
    );
    await db.execute(sql`
      with ins as (
        insert into income (date, source_id, gross, tax_rate, note)
        values (${p.date}, ${sourceIds.get(p.source)!}, ${p.gross.toFixed(2)},
                ${rate.toFixed(4)}, ${p.allocNote ? `imported: ${p.allocNote}` : null})
        returning id
      )
      insert into allocations (income_id, bucket, amount)
      select ins.id, (e->>'bucket')::cash_bucket, (e->>'amount')::numeric
      from ins, jsonb_array_elements(${allocs}::jsonb) e
    `);
  }

  for (const p of plugs) {
    await db.execute(sql`
      insert into adjustments (date, bucket, amount, reason)
      values (${openingDate}, ${p.bucket}::cash_bucket, ${p.amount.toFixed(2)}, ${p.reason})
    `);
  }

  // Seed the frozen workbook prices so the app has something to show before the
  // first cron run; fetched_at is backdated so they display as stale, not current.
  for (const o of openings) {
    await db.execute(sql`
      insert into prices (ticker, price, prev_close, currency, fetched_at)
      values (${o.ticker}, ${String(o.price)}, null, 'USD', ${`${openingDate}T00:00:00Z`})
      on conflict (ticker) do nothing
    `);
  }
}

commit()
  .then(() => line("Committed."))
  .catch((err) => {
    console.error("\nImport failed, nothing further was written:", err);
    process.exit(1);
  });
