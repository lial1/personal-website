"use client";

import { ACCOUNT_COLOR, ACCOUNT_LABEL, type Account } from "@/lib/savings/constants";
import { pct, usd } from "@/lib/savings/format";

type Row = { ticker: string; account: Account; value: number; stale: boolean };

/** Every position on one scale, coloured by the account that holds it. */
export default function HoldingsBars({ data }: { data: Row[] }) {
  const rows = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  if (!rows.length) return null;

  const max = Math.max(...rows.map((r) => r.value));
  const total = rows.reduce((s, r) => s + r.value, 0);
  const accounts = [...new Set(rows.map((r) => r.account))];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-xs text-muted">
        {accounts.map((a) => (
          <span key={a} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-2 w-2 rounded-sm"
              style={{ background: ACCOUNT_COLOR[a] }}
            />
            {ACCOUNT_LABEL[a]}
          </span>
        ))}
      </div>

      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li
            key={`${r.account}-${r.ticker}`}
            className="grid grid-cols-[5rem_1fr_auto_3rem] items-center gap-3 text-sm"
          >
            <span className="text-ink">
              {r.ticker}
              {r.stale && (
                <span className="ml-1 text-[10px] text-muted-red" title="Quote is stale">
                  •
                </span>
              )}
            </span>
            <span className="h-2 w-full overflow-hidden rounded-full bg-line">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${(r.value / max) * 100}%`,
                  background: ACCOUNT_COLOR[r.account],
                }}
              />
            </span>
            <span className="tabular-nums text-muted">{usd(r.value)}</span>
            <span className="text-right tabular-nums text-offblack">
              {pct(r.value / total, 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
