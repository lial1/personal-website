"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TradeRow } from "@/lib/savings/balances";
import { ACCOUNT_LABEL } from "@/lib/savings/constants";
import { shares as fmtShares, shortDate, usd } from "@/lib/savings/format";

/** Deleting a trade puts its cash back and removes its shares, both derived. */
export default function TradeList({ trades }: { trades: TradeRow[] }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  async function remove(id: number) {
    setBusy(id);
    const res = await fetch(`/api/savings/trades/${id}`, { method: "DELETE" });
    setBusy(null);
    setConfirming(null);
    if (res.ok) router.refresh();
  }

  if (!trades.length) return <p className="text-sm text-muted">No trades logged yet.</p>;

  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[34rem] text-sm [&_td:not(:first-child)]:pl-4 [&_th:not(:first-child)]:pl-4">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-offblack">
            <th className="pb-2 text-left font-normal">Date</th>
            <th className="pb-2 text-left font-normal">Account</th>
            <th className="pb-2 text-left font-normal">Trade</th>
            <th className="pb-2 text-right font-normal">Cost</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.id} className="border-b border-line/60">
              <td className="whitespace-nowrap py-2 text-muted">{shortDate(t.date)}</td>
              <td className="py-2 text-muted">{ACCOUNT_LABEL[t.account]}</td>
              <td className="py-2 text-ink">
                {t.side === "buy" ? "Buy" : "Sell"} {fmtShares(t.shares)} {t.ticker} @{" "}
                {usd(t.price)}
                {t.note && <span className="ml-2 text-xs text-muted">{t.note}</span>}
              </td>
              <td className="py-2 text-right tabular-nums text-muted">{usd(t.cost)}</td>
              <td className="py-2 pl-2 text-right text-xs">
                {confirming === t.id ? (
                  <span className="flex justify-end gap-2 whitespace-nowrap">
                    <button
                      onClick={() => remove(t.id)}
                      disabled={busy === t.id}
                      className="text-muted-red hover:underline disabled:opacity-40"
                    >
                      really delete
                    </button>
                    <button onClick={() => setConfirming(null)} className="text-muted hover:text-ink">
                      cancel
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirming(t.id)}
                    className="text-muted hover:text-muted-red"
                  >
                    delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
