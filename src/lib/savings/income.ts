import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { Bucket } from "./constants";

type Row = Record<string, unknown>;

async function rows(query: Parameters<typeof db.execute>[0]): Promise<Row[]> {
  const res = (await db.execute(query)) as unknown;
  if (Array.isArray(res)) return res as Row[];
  return ((res as { rows?: Row[] })?.rows ?? []) as Row[];
}

const num = (v: unknown): number => (v == null ? 0 : Number(v));

export type IncomeRow = {
  id: number;
  date: string;
  source: string;
  sourceId: number;
  gross: number;
  taxRate: number;
  taxWithheld: number;
  net: number;
  note: string | null;
  allocations: { bucket: Bucket; amount: number }[];
  allocated: number;
  /** net − allocated. Non-zero surfaces an "Unallocated" chip instead of hiding. */
  unallocated: number;
};

export async function listIncome(year?: number): Promise<IncomeRow[]> {
  const result = await rows(sql`
    select
      i.id, i.date, i.gross, i.tax_rate, i.tax_withheld, i.net, i.note,
      s.name as source, s.id as source_id,
      coalesce(
        (select json_agg(json_build_object('bucket', a.bucket, 'amount', a.amount)
                         order by a.id)
           from allocations a where a.income_id = i.id),
        '[]'::json
      ) as allocations
    from income i
    join sources s on s.id = i.source_id
    ${year ? sql`where extract(year from i.date) = ${year}` : sql``}
    order by i.date desc, i.id desc
  `);

  return result.map((r) => {
    const allocations = (
      (r.allocations as { bucket: Bucket; amount: string }[] | null) ?? []
    ).map((a) => ({ bucket: a.bucket, amount: num(a.amount) }));
    const net = num(r.net);
    const allocated = allocations.reduce((s, a) => s + a.amount, 0);
    return {
      id: Number(r.id),
      date: String(r.date),
      source: String(r.source),
      sourceId: Number(r.source_id),
      gross: num(r.gross),
      taxRate: num(r.tax_rate),
      taxWithheld: num(r.tax_withheld),
      net,
      note: (r.note as string) ?? null,
      allocations,
      allocated,
      unallocated: Math.round((net - allocated) * 100) / 100,
    };
  });
}

export type YearSummary = {
  year: number;
  gross: number;
  tax: number;
  net: number;
  count: number;
  /**
   * Calendar quarters. The workbook's quarter columns overlapped
   * (SUM(B18:B40) vs SUM(B24:B40)) and left rows 41-43 in no quarter at all;
   * bucketing by date makes both failures impossible.
   */
  quarters: { q: number; gross: number; tax: number; count: number }[];
};

export async function getYearSummary(year: number): Promise<YearSummary> {
  const result = await rows(sql`
    select
      extract(quarter from date)::int as q,
      sum(gross) as gross,
      sum(tax_withheld) as tax,
      count(*)::int as n
    from income
    where extract(year from date) = ${year}
    group by 1 order by 1
  `);

  const quarters = [1, 2, 3, 4].map((q) => {
    const r = result.find((x) => Number(x.q) === q);
    return { q, gross: num(r?.gross), tax: num(r?.tax), count: Number(r?.n ?? 0) };
  });

  const gross = quarters.reduce((s, q) => s + q.gross, 0);
  const tax = quarters.reduce((s, q) => s + q.tax, 0);
  return {
    year,
    gross,
    tax,
    net: gross - tax,
    count: quarters.reduce((s, q) => s + q.count, 0),
    quarters,
  };
}

export async function listYears(): Promise<number[]> {
  const result = await rows(
    sql`select distinct extract(year from date)::int as y from income order by y desc`,
  );
  return result.map((r) => Number(r.y));
}

export async function listSources() {
  // Most-used first: the form defaults to whichever source she actually logs most.
  const result = await rows(sql`
    select s.id, s.name, s.default_tax_rate, s.default_bucket,
           count(i.id) as uses
    from sources s
    left join income i on i.source_id = s.id
    where s.active
    group by s.id, s.name, s.default_tax_rate, s.default_bucket
    order by count(i.id) desc, s.name
  `);
  return result.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    defaultTaxRate: num(r.default_tax_rate),
    defaultBucket: (r.default_bucket as Bucket) ?? null,
  }));
}

/**
 * Income and its allocations are written in one statement, so a failure can
 * never leave an income row whose money went nowhere.
 */
export async function addIncome(input: {
  date: string;
  sourceId: number;
  gross: number;
  taxRate: number;
  note?: string | null;
  allocations: { bucket: Bucket; amount: number }[];
}): Promise<void> {
  const allocs = JSON.stringify(
    input.allocations.filter((a) => a.amount !== 0).map((a) => ({
      bucket: a.bucket,
      amount: a.amount.toFixed(2),
    })),
  );

  await db.execute(sql`
    with ins as (
      insert into income (date, source_id, gross, tax_rate, note)
      values (${input.date}, ${input.sourceId}, ${input.gross.toFixed(2)},
              ${input.taxRate.toFixed(4)}, ${input.note ?? null})
      returning id
    )
    insert into allocations (income_id, bucket, amount)
    select ins.id, (e->>'bucket')::cash_bucket, (e->>'amount')::numeric
    from ins, jsonb_array_elements(${allocs}::jsonb) e
  `);
}

/** Allocations cascade with the income row. */
export async function deleteIncome(id: number): Promise<void> {
  await db.execute(sql`delete from income where id = ${id}`);
}

/** Edit an existing row. Allocations are handled by their own endpoint. */
export async function updateIncome(
  id: number,
  input: {
    date: string;
    sourceId: number;
    gross: number;
    taxRate: number;
    note?: string | null;
  },
): Promise<void> {
  await db.execute(sql`
    update income set
      date = ${input.date},
      source_id = ${input.sourceId},
      gross = ${input.gross.toFixed(2)},
      tax_rate = ${input.taxRate.toFixed(4)},
      note = ${input.note ?? null}
    where id = ${id}
  `);
}

export type SourceRow = {
  id: number;
  name: string;
  defaultTaxRate: number;
  defaultBucket: Bucket | null;
  active: boolean;
  uses: number;
};

export async function listAllSources(): Promise<SourceRow[]> {
  const result = await rows(sql`
    select s.id, s.name, s.default_tax_rate, s.default_bucket, s.active,
           count(i.id) as uses
    from sources s
    left join income i on i.source_id = s.id
    group by s.id, s.name, s.default_tax_rate, s.default_bucket, s.active
    order by count(i.id) desc, s.name
  `);
  return result.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    defaultTaxRate: num(r.default_tax_rate),
    defaultBucket: (r.default_bucket as Bucket) ?? null,
    active: Boolean(r.active),
    uses: Number(r.uses ?? 0),
  }));
}

export async function addSource(input: {
  name: string;
  defaultTaxRate: number;
  defaultBucket: Bucket | null;
}): Promise<void> {
  await db.execute(sql`
    insert into sources (name, default_tax_rate, default_bucket)
    values (${input.name}, ${input.defaultTaxRate.toFixed(4)}, ${input.defaultBucket})
    on conflict (name) do update
      set default_tax_rate = excluded.default_tax_rate,
          default_bucket = excluded.default_bucket,
          active = true
  `);
}

export async function updateSource(
  id: number,
  input: {
    name: string;
    defaultTaxRate: number;
    defaultBucket: Bucket | null;
    active: boolean;
  },
): Promise<void> {
  await db.execute(sql`
    update sources set
      name = ${input.name},
      default_tax_rate = ${input.defaultTaxRate.toFixed(4)},
      default_bucket = ${input.defaultBucket},
      active = ${input.active}
    where id = ${id}
  `);
}

/** Only safe when nothing references it; the UI offers deactivate instead. */
export async function deleteSourceIfUnused(id: number): Promise<boolean> {
  const check = await rows(sql`select count(*)::int as n from income where source_id = ${id}`);
  if (Number(check[0]?.n ?? 0) > 0) return false;
  await db.execute(sql`delete from sources where id = ${id}`);
  return true;
}

/** Monthly gross split into what was kept and what went to tax. */
export async function getMonthlyIncome(
  months = 14,
): Promise<{ month: string; kept: number; tax: number; gross: number }[]> {
  const result = await rows(sql`
    select to_char(date_trunc('month', date), 'YYYY-MM') as month,
           sum(gross) as gross,
           sum(tax_withheld) as tax
    from income
    where date >= (date_trunc('month', current_date) - make_interval(months => ${months - 1}))
    group by 1 order by 1
  `);
  return result.map((r) => {
    const gross = num(r.gross);
    const tax = num(r.tax);
    return { month: String(r.month), gross, tax, kept: Math.round((gross - tax) * 100) / 100 };
  });
}

/** Biggest earners, for a "where does the money come from" bar. */
export async function getSourceTotals(
  year?: number,
): Promise<{ source: string; gross: number }[]> {
  const result = await rows(sql`
    select s.name as source, sum(i.gross) as gross
    from income i join sources s on s.id = i.source_id
    ${year ? sql`where extract(year from i.date) = ${year}` : sql``}
    group by s.name order by sum(i.gross) desc
  `);
  return result.map((r) => ({ source: String(r.source), gross: num(r.gross) }));
}

/**
 * Cumulative money put into savings, straight from the ledger.
 *
 * This is what the daily snapshot series cannot give until it has run for
 * months: a real curve over the whole history. It deliberately counts
 * allocations only, so money that merely passed through checking is excluded,
 * and it is contributions rather than market value.
 */
export async function getCumulativeSaved(): Promise<{ date: string; total: number }[]> {
  const result = await rows(sql`
    with daily as (
      select i.date, sum(a.amount) as amt
      from allocations a
      join income i on i.id = a.income_id
      where a.bucket <> 'checking'
      group by i.date
    )
    select date, sum(amt) over (order by date) as running
    from daily order by date
  `);
  return result.map((r) => ({ date: String(r.date), total: num(r.running) }));
}
