import Link from "next/link";
import { getYearSummary, listAllSources, listIncome, listYears } from "@/lib/savings/income";
import { pct, usd } from "@/lib/savings/format";
import { Card, SectionTitle } from "@/components/savings/ui";
import IncomeForm from "@/components/savings/IncomeForm";
import IncomeLedger from "@/components/savings/IncomeLedger";
import SourceManager from "@/components/savings/SourceManager";

export const dynamic = "force-dynamic";

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const years = await listYears();
  const requested = Number((await searchParams).year);
  const year = years.includes(requested) ? requested : (years[0] ?? new Date().getFullYear());

  const [rows, summary, sources] = await Promise.all([
    listIncome(year),
    getYearSummary(year),
    listAllSources(),
  ]);

  const unallocated = rows.filter((r) => Math.abs(r.unallocated) > 0.005);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Income</h1>
        <div className="flex gap-3 text-sm">
          {years.map((y) => (
            <Link
              key={y}
              href={`/savings/income?year=${y}`}
              className="nav-link"
              data-active={y === year}
            >
              {y}
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <SectionTitle>Add income</SectionTitle>
        <p className="mb-4 text-sm text-muted">
          Pick a source and the tax rate fills itself in. Whatever you allocate moves the
          matching balance straight away, so nothing else needs touching.
        </p>
        <IncomeForm sources={sources.filter((s) => s.active)} />
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Earned", value: summary.gross },
          { label: "Tax withheld", value: summary.tax },
          { label: "Kept", value: summary.net },
        ].map((s) => (
          <Card key={s.label}>
            <p className="text-xs text-offblack">{s.label}</p>
            <p className="mt-1 font-display text-xl text-ink">{usd(s.value)}</p>
          </Card>
        ))}
        <Card>
          <p className="text-xs text-offblack">Effective tax</p>
          <p className="mt-1 font-display text-xl text-ink">
            {summary.gross ? pct(summary.tax / summary.gross) : "--"}
          </p>
        </Card>
      </div>

      <Card>
        <SectionTitle>{year} by quarter</SectionTitle>
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[26rem] text-sm [&_td:not(:first-child)]:pl-4 [&_th:not(:first-child)]:pl-4">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-offblack">
                <th className="pb-2 text-left font-normal">Quarter</th>
                <th className="pb-2 text-right font-normal">Rows</th>
                <th className="pb-2 text-right font-normal">Earned</th>
                <th className="pb-2 text-right font-normal">Tax</th>
              </tr>
            </thead>
            <tbody>
              {summary.quarters.map((q) => (
                <tr key={q.q} className="border-b border-line/60">
                  <td className="py-2 text-ink">Q{q.q}</td>
                  <td className="py-2 text-right tabular-nums text-muted">{q.count}</td>
                  <td className="py-2 text-right tabular-nums text-ink">{usd(q.gross)}</td>
                  <td className="py-2 text-right tabular-nums text-muted">{usd(q.tax)}</td>
                </tr>
              ))}
              <tr className="font-medium">
                <td className="py-2 text-ink">Total</td>
                <td className="py-2 text-right tabular-nums text-muted">{summary.count}</td>
                <td className="py-2 text-right tabular-nums text-ink">{usd(summary.gross)}</td>
                <td className="py-2 text-right tabular-nums text-muted">{usd(summary.tax)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          Quarters are cut from the dates themselves, so they always add to the total.
        </p>
      </Card>

      {unallocated.length > 0 && (
        <Card>
          <SectionTitle>{unallocated.length} rows need a destination</SectionTitle>
          <p className="text-sm text-muted">
            These came across from the workbook without one, or with a split whose amounts
            were never written down. Until they are assigned, their money is not counted in
            any balance.
          </p>
        </Card>
      )}

      <Card>
        <SectionTitle>Ledger</SectionTitle>
        <p className="mb-4 text-sm text-muted">
          Every field is editable here: click edit on any row to change its date, source,
          amount, tax rate, note or destinations. Saving re-derives every balance.
        </p>
        <IncomeLedger rows={rows} sources={sources.filter((s) => s.active)} />
      </Card>

      <Card>
        <SectionTitle>Sources</SectionTitle>
        <p className="mb-4 text-sm text-muted">
          Add a client here and its tax rate and usual destination fill themselves in
          whenever you log income from it.
        </p>
        <SourceManager sources={sources} />
      </Card>

    </div>
  );
}
