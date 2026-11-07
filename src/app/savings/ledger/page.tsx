import { listAdjustments, listTrades } from "@/lib/savings/balances";
import { listAllSources, listIncome } from "@/lib/savings/income";
import { ACCOUNT_LABEL, BUCKET_LABEL } from "@/lib/savings/constants";
import { shares as fmtShares, shortDate, signedUsd, usd } from "@/lib/savings/format";
import { Card, SectionTitle } from "@/components/savings/ui";
import AddPanel from "@/components/savings/AddPanel";

export const dynamic = "force-dynamic";

type Line = {
  key: string;
  date: string;
  order: number;
  description: string;
  detail: string;
  /** Signed: positive is money in, negative is money out. */
  amount: number;
  balance: number;
};

const monthLabel = (key: string) =>
  new Date(`${key}-01T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });

/**
 * A plain ledger. Income comes in at gross (the tax share stays in the tax set-aside),
 * a buy sends cash out into an investment, a sell brings it back, adjustments are signed.
 * Balance is the running cash total across every bucket.
 */
export default async function LedgerPage() {
  const [income, trades, adjustments, sources] = await Promise.all([
    listIncome(),
    listTrades(100000),
    listAdjustments(),
    listAllSources(),
  ]);

  const lines: Omit<Line, "balance">[] = [
    ...income.map((r) => ({
      key: `i-${r.id}`,
      date: r.date,
      order: 0,
      description: r.source,
      detail: [
        r.taxWithheld > 0 ? `tax ${usd(r.taxWithheld)}` : "",
        ...r.allocations.map((a) => `${BUCKET_LABEL[a.bucket]} ${usd(a.amount)}`),
        Math.abs(r.unallocated) > 0.005 ? `${usd(r.unallocated)} not assigned` : "",
        r.note ?? "",
      ]
        .filter(Boolean)
        .join(", "),
      amount: r.gross,
    })),
    ...trades.map((t) => ({
      key: `t-${t.id}`,
      date: t.date,
      order: 1,
      description: `${t.side === "buy" ? "Bought" : "Sold"} ${fmtShares(t.shares)} ${t.ticker}`,
      detail: `${ACCOUNT_LABEL[t.account]} @ ${usd(t.price)}`,
      amount: (t.side === "buy" ? -1 : 1) * t.cost,
    })),
    ...adjustments.map((a) => ({
      key: `a-${a.id}`,
      date: a.date,
      order: 2,
      description: a.reason,
      detail: BUCKET_LABEL[a.bucket],
      amount: a.amount,
    })),
  ];

  // Running balance oldest first, then show newest first.
  lines.sort((a, b) => (a.date === b.date ? a.order - b.order : a.date < b.date ? -1 : 1));
  let running = 0;
  const ledger: Line[] = lines.map((l) => {
    running += l.amount;
    return { ...l, balance: running };
  });
  ledger.reverse();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Ledger</h1>

      <Card id="add">
        <SectionTitle>Add</SectionTitle>
        <AddPanel sources={sources.filter((s) => s.active)} />
      </Card>

      <Card>
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[32rem] text-sm [&_td:not(:first-child)]:pl-4 [&_th:not(:first-child)]:pl-4">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-offblack">
                <th className="pb-2 text-left font-normal">Date</th>
                <th className="pb-2 text-left font-normal">Description</th>
                <th className="pb-2 text-right font-normal">Amount</th>
                <th className="pb-2 text-right font-normal">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-muted">
                    Nothing logged yet.
                  </td>
                </tr>
              )}
              {ledger.map((l, i) => {
                const month = l.date.slice(0, 7);
                const newMonth = i === 0 || ledger[i - 1].date.slice(0, 7) !== month;
                return [
                  newMonth && (
                    <tr key={`m-${month}`}>
                      <td
                        colSpan={4}
                        className="pb-1 pt-5 text-xs uppercase tracking-wider text-offblack"
                      >
                        {monthLabel(month)}
                      </td>
                    </tr>
                  ),
                  <tr key={l.key} className="border-b border-line/60 align-top">
                    <td className="whitespace-nowrap py-2 text-muted">{shortDate(l.date)}</td>
                    <td className="py-2 text-ink">
                      {l.description}
                      {l.detail && <div className="text-xs text-muted">{l.detail}</div>}
                    </td>
                    <td
                      className={`py-2 text-right tabular-nums ${
                        l.amount < 0 ? "text-muted-red" : "text-ink"
                      }`}
                    >
                      {signedUsd(l.amount)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted">{usd(l.balance)}</td>
                  </tr>,
                ];
              })}
            </tbody>
            {ledger.length > 0 && (
              <tfoot>
                <tr className="font-medium">
                  <td className="pt-3 text-ink" colSpan={3}>
                    Balance
                  </td>
                  <td className="pt-3 text-right tabular-nums text-ink">{usd(running)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}
