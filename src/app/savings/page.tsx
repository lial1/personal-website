import { getMilestoneTarget, getPortfolio, getSnapshots } from "@/lib/savings/balances";
import { getYearSummary } from "@/lib/savings/income";
import { ACCOUNT_COLOR, BUCKET_LABEL, NET_WORTH_ACCOUNTS } from "@/lib/savings/constants";
import { pct, relativeTime, signedUsd, usd } from "@/lib/savings/format";
import { Card, Note, SectionTitle } from "@/components/savings/ui";
import NetWorthTrend from "@/components/savings/NetWorthTrend";
import RefreshPrices from "@/components/savings/RefreshPrices";
import MilestoneTarget from "@/components/savings/MilestoneTarget";
import ChangePassword from "@/components/savings/ChangePassword";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [portfolio, target, snapshots] = await Promise.all([
    getPortfolio(),
    getMilestoneTarget(),
    getSnapshots(),
  ]);
  const fy = await getYearSummary(new Date().getFullYear());

  const progress = Math.min(1, portfolio.netWorth / target);
  const accounts = portfolio.accounts.filter((a) => NET_WORTH_ACCOUNTS.includes(a.account));
  const taxShortfall = portfolio.buckets.hysa_excess < 0 ? -portfolio.buckets.hysa_excess : 0;

  return (
    <div className="space-y-6">
      {/* Hero. One number, stated plainly, with the day's move under it. */}
      <div>
        <p className="text-xs uppercase tracking-wider text-offblack">Net worth</p>
        <p className="font-display text-5xl text-ink">{usd(portfolio.netWorth)}</p>
        <p className="mt-1 text-sm text-muted">
          {portfolio.dayChange !== 0 ? (
            <>
              {signedUsd(portfolio.dayChange)} today &middot;{" "}
            </>
          ) : null}
          {usd(portfolio.checking)} sat in checking, counted separately
        </p>
      </div>

      {/* Milestone meter */}
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
          {pct(progress, 0)} there, {usd(Math.max(0, target - portfolio.netWorth))} to go.
        </p>
      </Card>

      {/* The thing the spreadsheet could never show */}
      <Card>
        <SectionTitle>Net worth over time</SectionTitle>
        <NetWorthTrend data={snapshots} />
      </Card>

      {/* Accounts */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {accounts.map((a) => (
          <Card key={a.account}>
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: ACCOUNT_COLOR[a.account] }}
              />
              <span className="text-sm text-ink">{a.label}</span>
              <span className="ml-auto text-xs text-muted">{pct(a.pct, 0)}</span>
            </div>
            <p className="mt-2 font-display text-2xl text-ink">{usd(a.total)}</p>
            <p className="mt-1 text-xs text-muted">
              {usd(a.holdingsValue)} invested &middot; {usd(a.cash)} cash
              {a.dayChange !== 0 && <> &middot; {signedUsd(a.dayChange)} today</>}
            </p>
          </Card>
        ))}
      </div>

      {/* Tax set-aside: the check the workbook was silently failing */}
      <Card>
        <SectionTitle>Tax set-aside</SectionTitle>
        {taxShortfall > 0 ? (
          <>
            <p className="text-sm text-ink">
              You have withheld{" "}
              <strong className="font-medium">{usd(portfolio.buckets.hysa_tax)}</strong> for
              taxes across every income row. After the{" "}
              {usd(portfolio.buckets.hysa_emergency)} emergency fund, HYSA holds{" "}
              {usd(
                portfolio.buckets.hysa_tax +
                  portfolio.buckets.hysa_excess,
              )}{" "}
              against it.
            </p>
            <p className="mt-2 text-sm text-muted-red">
              Short by {usd(taxShortfall)}.
            </p>
            <Note>
              <span className="mt-2 block">
                This assumes none of it has been paid yet, and it does not move any money;
                it only reports what the ledger says you owe against what HYSA holds. Once
                a bill is actually paid, log it as an adjustment on the tax bucket and this
                clears.
              </span>
            </Note>
          </>
        ) : (
          <p className="text-sm text-ink">
            {usd(portfolio.buckets.hysa_tax)} withheld and covered.{" "}
            {usd(portfolio.buckets.hysa_excess)} spare in HYSA.
          </p>
        )}
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3 text-sm">
          {(["hysa_tax", "hysa_emergency", "hysa_excess"] as const).map((b) => (
            <div key={b}>
              <dt className="text-xs text-offblack">{BUCKET_LABEL[b]}</dt>
              <dd className={portfolio.buckets[b] < 0 ? "text-muted-red" : "text-ink"}>
                {usd(portfolio.buckets[b])}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* This year */}
      <Card>
        <SectionTitle>{fy.year} so far</SectionTitle>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-offblack">Earned</dt>
            <dd className="font-display text-xl text-ink">{usd(fy.gross)}</dd>
          </div>
          <div>
            <dt className="text-xs text-offblack">Tax withheld</dt>
            <dd className="font-display text-xl text-ink">{usd(fy.tax)}</dd>
          </div>
          <div>
            <dt className="text-xs text-offblack">Kept</dt>
            <dd className="font-display text-xl text-ink">{usd(fy.net)}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <SectionTitle>Password</SectionTitle>
        <ChangePassword />
      </Card>

      <p className="flex flex-wrap items-center gap-3 text-xs text-muted">
        {portfolio.pricesAsOf ? (
          <span>Prices as of {relativeTime(portfolio.pricesAsOf)}</span>
        ) : (
          <span>No prices fetched yet</span>
        )}
        <RefreshPrices />
        {portfolio.hasStalePrices && (
          <span className="text-muted-red">Some quotes are stale.</span>
        )}
      </p>
    </div>
  );
}
