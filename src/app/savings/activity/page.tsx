import { listAdjustments, listTrades } from "@/lib/savings/balances";
import { listAllSources, listIncome } from "@/lib/savings/income";
import {
  ACCOUNT_COLOR,
  ACCOUNT_LABEL,
  BUCKET_ACCOUNT,
  BUCKET_LABEL,
} from "@/lib/savings/constants";
import { shares as fmtShares, shortDate, signedUsd, usd } from "@/lib/savings/format";
import { Card, Chip, JumpLinks, SectionTitle } from "@/components/savings/ui";
import AddPanel from "@/components/savings/AddPanel";

export const dynamic = "force-dynamic";

type IncomeRow = Awaited<ReturnType<typeof listIncome>>[number];
type TradeRow = Awaited<ReturnType<typeof listTrades>>[number];
type AdjustmentRow = Awaited<ReturnType<typeof listAdjustments>>[number];

type Entry =
  | { kind: "income"; date: string; order: number; data: IncomeRow }
  | { kind: "trade"; date: string; order: number; data: TradeRow }
  | { kind: "adjustment"; date: string; order: number; data: AdjustmentRow };

const monthLabel = (key: string) =>
  new Date(`${key}-01T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });

const monthShort = (key: string) =>
  new Date(`${key}-01T12:00:00`).toLocaleDateString("en-US", { month: "short", year: "2-digit" });

/** Every paycheck, where it went, and every trade, month by month, with one add box on top. */
export default async function ActivityPage() {
  const [income, trades, adjustments, sources] = await Promise.all([
    listIncome(),
    listTrades(100000),
    listAdjustments(),
    listAllSources(),
  ]);

  const entries: Entry[] = [
    ...income.map((d) => ({ kind: "income" as const, date: d.date, order: 0, data: d })),
    ...trades.map((d) => ({ kind: "trade" as const, date: d.date, order: 1, data: d })),
    ...adjustments.map((d) => ({ kind: "adjustment" as const, date: d.date, order: 2, data: d })),
  ].sort((a, b) => (a.date === b.date ? a.order - b.order : a.date < b.date ? 1 : -1));

  const months = new Map<string, Entry[]>();
  for (const e of entries) {
    const key = e.date.slice(0, 7);
    if (!months.has(key)) months.set(key, []);
    months.get(key)!.push(e);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Activity</h1>

      <Card id="add">
        <SectionTitle>Add</SectionTitle>
        <AddPanel sources={sources.filter((s) => s.active)} />
      </Card>

      {months.size > 1 && (
        <JumpLinks links={[...months.keys()].map((k) => ({ id: `m-${k}`, label: monthShort(k) }))} />
      )}

      {months.size === 0 && <p className="text-sm text-muted">Nothing logged yet.</p>}

      {[...months.entries()].map(([key, list]) => {
        let earned = 0;
        let tax = 0;
        let invested = 0;
        for (const e of list) {
          if (e.kind === "income") {
            earned += e.data.gross;
            tax += e.data.taxWithheld;
          } else if (e.kind === "trade") {
            invested += (e.data.side === "buy" ? 1 : -1) * e.data.cost;
          }
        }

        return (
          <Card key={key} id={`m-${key}`}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h2 className="font-display text-xl text-ink">{monthLabel(key)}</h2>
              <p className="flex flex-wrap gap-x-4 text-xs text-muted">
                <span>
                  Earned <span className="text-ink">{usd(earned)}</span>
                </span>
                <span>Tax {usd(tax)}</span>
                <span>
                  Invested <span className="text-ink">{usd(invested)}</span>
                </span>
              </p>
            </div>

            <ul className="divide-y divide-line/60">
              {list.map((e) => (
                <li
                  key={`${e.kind}-${e.data.id}`}
                  className="grid grid-cols-[4.5rem_1fr_auto] gap-x-3 gap-y-1.5 py-2.5 text-sm"
                >
                  <span className="whitespace-nowrap text-muted">{shortDate(e.date)}</span>

                  {e.kind === "income" && (
                    <>
                      <span className="text-ink">
                        {e.data.source}
                        {e.data.note && (
                          <span className="ml-2 text-xs text-muted">{e.data.note}</span>
                        )}
                      </span>
                      <span className="text-right tabular-nums text-ink">{usd(e.data.gross)}</span>
                      <span className="col-start-2 col-end-4 flex flex-wrap items-center gap-1.5">
                        {e.data.taxWithheld > 0 && (
                          <Chip color={ACCOUNT_COLOR.hysa}>Tax {usd(e.data.taxWithheld)}</Chip>
                        )}
                        {e.data.allocations.map((a, i) => (
                          <Chip key={i} color={ACCOUNT_COLOR[BUCKET_ACCOUNT[a.bucket]]}>
                            {BUCKET_LABEL[a.bucket]} {usd(a.amount)}
                          </Chip>
                        ))}
                        {Math.abs(e.data.unallocated) > 0.005 && (
                          <span className="text-xs text-muted-red">
                            {usd(e.data.unallocated)} not assigned
                          </span>
                        )}
                      </span>
                    </>
                  )}

                  {e.kind === "trade" && (
                    <>
                      <span className="flex flex-wrap items-center gap-2 text-ink">
                        <span
                          aria-hidden
                          className="h-2 w-2 rounded-full"
                          style={{ background: ACCOUNT_COLOR[e.data.account] }}
                        />
                        {e.data.side === "buy" ? "Bought" : "Sold"} {fmtShares(e.data.shares)}{" "}
                        {e.data.ticker}
                        <span className="text-xs text-muted">
                          {ACCOUNT_LABEL[e.data.account]} @ {usd(e.data.price)}
                        </span>
                      </span>
                      <span className="text-right tabular-nums text-muted">{usd(e.data.cost)}</span>
                    </>
                  )}

                  {e.kind === "adjustment" && (
                    <>
                      <span className="text-ink">
                        {e.data.reason}
                        <span className="ml-2 text-xs text-muted">
                          {BUCKET_LABEL[e.data.bucket]}
                        </span>
                      </span>
                      <span
                        className={`text-right tabular-nums ${
                          e.data.amount < 0 ? "text-muted-red" : "text-muted"
                        }`}
                      >
                        {signedUsd(e.data.amount)}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
