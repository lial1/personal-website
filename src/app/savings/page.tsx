import { getMilestoneTarget, getPortfolio, getSnapshots } from "@/lib/savings/balances";
import {
  getCumulativeSaved,
  getMonthlyIncome,
  getSourceTotals,
  getYearSummary,
} from "@/lib/savings/income";
import { ACCOUNT_COLOR, NET_WORTH_ACCOUNTS } from "@/lib/savings/constants";
import { pct, relativeTime, signedUsd, usd } from "@/lib/savings/format";
import { Card, SectionTitle } from "@/components/savings/ui";
import NetWorthTrend from "@/components/savings/NetWorthTrend";
import AllocationDonut from "@/components/savings/AllocationDonut";
import IncomeByMonth from "@/components/savings/IncomeByMonth";
import SavedOverTime from "@/components/savings/SavedOverTime";
import SourceBars from "@/components/savings/SourceBars";
import TaxBar from "@/components/savings/TaxBar";
import RefreshPrices from "@/components/savings/RefreshPrices";
import MilestoneTarget from "@/components/savings/MilestoneTarget";
import ChangePassword from "@/components/savings/ChangePassword";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const year = new Date().getFullYear();
  const [portfolio, target, snapshots, monthly, saved, sources, fy] = await Promise.all([
    getPortfolio(),
    getMilestoneTarget(),
    getSnapshots(),
    getMonthlyIncome(),
    getCumulativeSaved(),
    getSourceTotals(year),
    getYearSummary(year),
  ]);

  const progress = Math.min(1, portfolio.netWorth / target);
  const accounts = portfolio.accounts.filter((a) => NET_WORTH_ACCOUNTS.includes(a.account));
  const taxOwed = portfolio.buckets.hysa_tax;
  const taxCovered = portfolio.buckets.hysa_tax + portfolio.buckets.hysa_excess;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div>
        <p className="text-xs uppercase tracking-wider text-offblack">Net worth</p>
        <p className="font-display text-5xl text-ink">{usd(portfolio.netWorth)}</p>
        <p className="mt-1 text-sm text-muted">
          {portfolio.dayChange !== 0 && <>{signedUsd(portfolio.dayChange)} today &middot; </>}
          {usd(portfolio.checking)} in checking, not counted
        </p>
      </div>

      {/* Milestone */}
      <Card>
        <div className="flex items-baseline justify-between">
          <SectionTitle>Next milestone</SectionTitle>
          <span className="flex items-center gap-1 text-xs text-muted">
            <span className="mb-4">{usd(portfolio.netWorth, false)}</span>
            <MilestoneTarget target={target} />
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-line"
          role="meter"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress toward ${usd(target, false)}`}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${progress * 100}%`, background: "#c36a3f" }}
          />
        </div>
        <p className="mt-2 text-sm text-muted">
          {portfolio.netWorth >= target ? (
            <>Passed it by {usd(portfolio.netWorth - target)}. Set a new one above.</>
          ) : (
            <>
              {pct(progress, 0)} there &middot; {usd(target - portfolio.netWorth)} to go
            </>
          )}
        </p>
      </Card>

      {/* Where it sits */}
      <Card>
        <SectionTitle>Where it sits</SectionTitle>
        <AllocationDonut data={accounts} />
      </Card>

      {/* Two charts side by side on wide screens */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>Income by month</SectionTitle>
          <IncomeByMonth data={monthly} />
        </Card>
        <Card>
          <SectionTitle>Saved to date</SectionTitle>
          <SavedOverTime data={saved} />
        </Card>
      </div>

      {/* Accounts */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {accounts.map((a) => (
          <Card key={a.account}>
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: ACCOUNT_COLOR[a.account] }}
              />
              <span className="text-sm text-ink">{a.label}</span>
            </div>
            <p className="mt-2 font-display text-xl text-ink">{usd(a.total)}</p>
            <p className="mt-1 text-xs text-muted">
              {a.dayChange !== 0 ? `${signedUsd(a.dayChange)} today` : pct(a.pct, 0)}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>Tax set-aside</SectionTitle>
          <TaxBar owed={taxOwed} covered={taxCovered} />
        </Card>
        <Card>
          <SectionTitle>{year} by source</SectionTitle>
          <SourceBars data={sources} />
        </Card>
      </div>

      {/* This year */}
      <Card>
        <SectionTitle>{year} so far</SectionTitle>
        <dl className="grid grid-cols-3 gap-3">
          {[
            { label: "Earned", value: fy.gross },
            { label: "Tax withheld", value: fy.tax },
            { label: "Kept", value: fy.net },
          ].map((s) => (
            <div key={s.label}>
              <dt className="text-xs text-offblack">{s.label}</dt>
              <dd className="font-display text-xl text-ink">{usd(s.value)}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* Snapshot-based net worth, which fills in as the cron runs */}
      <Card>
        <SectionTitle>Net worth over time</SectionTitle>
        <NetWorthTrend data={snapshots} />
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span className="flex flex-wrap items-center gap-3">
          {portfolio.pricesAsOf ? (
            <span>Prices {relativeTime(portfolio.pricesAsOf)}</span>
          ) : (
            <span>No prices yet</span>
          )}
          <RefreshPrices />
          {portfolio.hasStalePrices && <span className="text-muted-red">Some are stale.</span>}
        </span>
        <ChangePassword />
      </div>
    </div>
  );
}
