import { getPortfolio, listAdjustments, listTrades } from "@/lib/savings/balances";
import {
  ACCOUNTS,
  ACCOUNT_COLOR,
  ACCOUNT_LABEL,
  BUCKETS,
  BUCKET_ACCOUNT,
  BUCKET_LABEL,
} from "@/lib/savings/constants";
import { pct, relativeTime, shares as fmtShares, signedUsd, usd } from "@/lib/savings/format";
import { Card, SectionTitle } from "@/components/savings/ui";
import RefreshPrices from "@/components/savings/RefreshPrices";
import TradeForm from "@/components/savings/TradeForm";
import HoldingsBars from "@/components/savings/HoldingsBars";
import TradeList from "@/components/savings/TradeList";
import AdjustmentManager from "@/components/savings/AdjustmentManager";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const [p, trades, adjustments] = await Promise.all([
    getPortfolio(),
    listTrades(),
    listAdjustments(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-2xl text-ink">Portfolio</h1>
        <p className="flex items-center gap-3 text-xs text-muted">
          {p.pricesAsOf ? `Prices ${relativeTime(p.pricesAsOf)}` : "No prices yet"}
          <RefreshPrices />
        </p>
      </div>

      <Card>
        <SectionTitle>Every position</SectionTitle>
        <HoldingsBars data={p.holdings} />
      </Card>

      {ACCOUNTS.map((account) => {
        const holdings = p.holdings.filter((h) => h.account === account);
        const cashBuckets = BUCKETS.filter((b) => BUCKET_ACCOUNT[b] === account);
        const total = p.accounts.find((a) => a.account === account)!.total;
        if (!holdings.length && cashBuckets.every((b) => p.buckets[b] === 0)) return null;

        return (
          <Card key={account}>
            <div className="mb-4 flex items-center gap-2">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: ACCOUNT_COLOR[account] }}
              />
              <SectionTitle>{ACCOUNT_LABEL[account]}</SectionTitle>
              <span className="mb-4 ml-auto font-display text-lg text-ink">{usd(total)}</span>
            </div>

            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[34rem] text-sm [&_td:not(:first-child)]:pl-4 [&_th:not(:first-child)]:pl-4">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-offblack">
                    <th className="pb-2 text-left font-normal">Holding</th>
                    <th className="pb-2 text-right font-normal">Shares</th>
                    <th className="pb-2 text-right font-normal">Price</th>
                    <th className="pb-2 text-right font-normal">Today</th>
                    <th className="pb-2 text-right font-normal">Value</th>
                    <th className="pb-2 text-right font-normal">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => (
                    <tr key={h.ticker} className="border-b border-line/60">
                      <td className="py-2 text-ink">
                        {h.ticker}
                        {h.stale && (
                          <span
                            className="ml-2 rounded border border-line px-1 text-[10px] text-muted-red"
                            title="Quote missing or older than 48 hours"
                          >
                            stale
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right tabular-nums text-muted">
                        {fmtShares(h.shares)}
                      </td>
                      <td className="py-2 text-right tabular-nums text-muted">
                        {h.price == null ? "--" : usd(h.price)}
                      </td>
                      <td className="py-2 text-right tabular-nums text-muted">
                        {h.dayChange === 0 ? "--" : signedUsd(h.dayChange)}
                      </td>
                      <td className="py-2 text-right tabular-nums text-ink">{usd(h.value)}</td>
                      <td className="py-2 text-right tabular-nums text-muted">
                        {total === 0 ? "--" : pct(h.value / total, 0)}
                      </td>
                    </tr>
                  ))}
                  {cashBuckets
                    .filter((b) => p.buckets[b] !== 0)
                    .map((b) => (
                      <tr key={b} className="border-b border-line/60">
                        <td className="py-2 text-muted">{BUCKET_LABEL[b]}</td>
                        <td colSpan={3} />
                        <td
                          className={`py-2 text-right tabular-nums ${
                            p.buckets[b] < 0 ? "text-muted-red" : "text-ink"
                          }`}
                        >
                          {usd(p.buckets[b])}
                        </td>
                        <td className="py-2 text-right tabular-nums text-muted">
                          {total === 0 ? "--" : pct(p.buckets[b] / total, 0)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}

      {p.negativeBuckets.length > 0 && (
        <Card>
          <SectionTitle>Needs attention</SectionTitle>
          <p className="text-sm text-muted-red">
            {p.negativeBuckets.map((b) => BUCKET_LABEL[b]).join(", ")} went negative.
          </p>
          <p className="mt-1 text-sm text-muted">
            Money left without a matching trade or allocation. Log it as an adjustment.
          </p>
        </Card>
      )}

      <Card>
        <SectionTitle>Log a trade</SectionTitle>
        <TradeForm />
      </Card>

      <Card>
        <SectionTitle>Recent trades</SectionTitle>
        <TradeList trades={trades} />
      </Card>

      <Card>
        <SectionTitle>Adjustments</SectionTitle>
        <p className="mb-4 text-sm text-muted">
          Interest, fees, a tax payment, or moving money between accounts.
        </p>
        <AdjustmentManager adjustments={adjustments} />
      </Card>
    </div>
  );
}
