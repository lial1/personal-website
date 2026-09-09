"use client";

import { usd } from "@/lib/savings/format";
import { KEPT, TAX } from "./chartTheme";

/**
 * Withholding against what HYSA actually holds for it. A short stacked bar
 * says in one glance what a paragraph was saying in five lines.
 */
export default function TaxBar({
  owed,
  covered,
}: {
  owed: number;
  covered: number;
}) {
  const short = Math.max(0, owed - covered);
  const scale = Math.max(owed, covered, 1);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-offblack">Withheld on paper</span>
          <span className="tabular-nums text-ink">{usd(owed)}</span>
        </div>
        <span className="block h-2.5 w-full overflow-hidden rounded-full bg-line">
          <span
            className="block h-full rounded-full"
            style={{ width: `${(owed / scale) * 100}%`, background: TAX }}
          />
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-offblack">Sitting in HYSA for it</span>
          <span className="tabular-nums text-ink">{usd(covered)}</span>
        </div>
        <span className="block h-2.5 w-full overflow-hidden rounded-full bg-line">
          <span
            className="block h-full rounded-full"
            style={{ width: `${(Math.max(0, covered) / scale) * 100}%`, background: KEPT }}
          />
        </span>
      </div>

      {short > 0 ? (
        <p className="text-sm text-muted-red">Short {usd(short)}, assuming none is paid yet.</p>
      ) : (
        <p className="text-sm text-muted">Covered.</p>
      )}
    </div>
  );
}
