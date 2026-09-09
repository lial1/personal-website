"use client";

import { usd } from "@/lib/savings/format";
import { KEPT } from "./chartTheme";

/**
 * Plain CSS bars rather than a chart library: one measure, already sorted, and
 * the value sits beside each row, so a plotted axis would add nothing.
 */
export default function SourceBars({
  data,
  limit = 6,
}: {
  data: { source: string; gross: number }[];
  limit?: number;
}) {
  const shown = data.slice(0, limit);
  const rest = data.slice(limit);
  const restTotal = rest.reduce((s, d) => s + d.gross, 0);
  const rows = restTotal > 0 ? [...shown, { source: `${rest.length} others`, gross: restTotal }] : shown;
  const max = Math.max(...rows.map((r) => r.gross), 1);

  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.source} className="grid grid-cols-[9rem_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-ink" title={r.source}>
            {r.source}
          </span>
          <span className="h-2 w-full overflow-hidden rounded-full bg-line">
            <span
              className="block h-full rounded-full"
              style={{ width: `${(r.gross / max) * 100}%`, background: KEPT }}
            />
          </span>
          <span className="tabular-nums text-muted">{usd(r.gross, false)}</span>
        </li>
      ))}
    </ul>
  );
}
