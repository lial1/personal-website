"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { shortDate, usd } from "@/lib/savings/format";
import { ACCENT, GRID, SURFACE, axisTick, tooltipStyle } from "./chartTheme";

/**
 * Cumulative money moved into savings, straight from the ledger, so the curve
 * covers the whole history instead of waiting for daily snapshots to pile up.
 * One series, so the heading is the legend.
 */
export default function SavedOverTime({ data }: { data: { date: string; total: number }[] }) {
  if (data.length < 2) {
    return <p className="py-8 text-center text-sm text-muted">Not enough history yet.</p>;
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="saved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.22} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => shortDate(d).replace(/, \d{4}$/, "")}
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            minTickGap={36}
          />
          <YAxis
            tickFormatter={(v: number) => usd(v, false)}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip
            cursor={{ stroke: "#8a847e", strokeWidth: 1 }}
            contentStyle={tooltipStyle}
            labelFormatter={(d) => shortDate(String(d))}
            formatter={(v) => [usd(Number(v)), "Saved to date"]}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke={ACCENT}
            strokeWidth={2}
            fill="url(#saved)"
            dot={false}
            activeDot={{ r: 4, stroke: SURFACE, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
