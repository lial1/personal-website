"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ACCOUNT_COLOR, type Account } from "@/lib/savings/constants";
import { pct, usd } from "@/lib/savings/format";
import { SURFACE, tooltipStyle } from "./chartTheme";

type Slice = { account: Account; label: string; total: number; pct: number };

/** Where the money sits. Direct-labelled beside the ring, so identity is never colour alone. */
export default function AllocationDonut({ data }: { data: Slice[] }) {
  const slices = data.filter((d) => d.total > 0);
  if (!slices.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="total"
              nameKey="label"
              innerRadius="58%"
              outerRadius="100%"
              paddingAngle={2}
              stroke={SURFACE}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((s) => (
                <Cell key={s.account} fill={ACCOUNT_COLOR[s.account]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v, n) => [usd(Number(v)), String(n)]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex-1 space-y-2 text-sm">
        {slices.map((s) => (
          <li key={s.account} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: ACCOUNT_COLOR[s.account] }}
            />
            <span className="text-ink">{s.label}</span>
            <span className="ml-auto tabular-nums text-muted">{usd(s.total)}</span>
            <span className="w-10 text-right tabular-nums text-offblack">{pct(s.pct, 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
