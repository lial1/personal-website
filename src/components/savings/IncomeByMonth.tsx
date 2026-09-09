"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usd } from "@/lib/savings/format";
import { AXIS_TEXT, GRID, KEPT, SURFACE, TAX, axisTick, monthLabel, tooltipStyle } from "./chartTheme";

type Row = { month: string; kept: number; tax: number; gross: number };

/** Gross split into what you kept and what is reserved for tax. */
export default function IncomeByMonth({ data }: { data: Row[] }) {
  if (data.length < 2) {
    return <p className="py-8 text-center text-sm text-muted">Not enough months yet.</p>;
  }

  return (
    <>
      <div className="mb-3 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-sm" style={{ background: KEPT }} />
          Kept
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-sm" style={{ background: TAX }} />
          Tax set aside
        </span>
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={monthLabel}
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: GRID }}
            />
            <YAxis
              tickFormatter={(v: number) => usd(v, false)}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <Tooltip
              cursor={{ fill: AXIS_TEXT, fillOpacity: 0.06 }}
              contentStyle={tooltipStyle}
              labelFormatter={(m) => monthLabel(String(m))}
              formatter={(v, n) => [usd(Number(v)), n === "kept" ? "Kept" : "Tax set aside"]}
            />
            {/* 2px surface gap between segments keeps the stack readable. */}
            <Bar dataKey="kept" stackId="a" fill={KEPT} stroke={SURFACE} strokeWidth={2} />
            <Bar
              dataKey="tax"
              stackId="a"
              fill={TAX}
              stroke={SURFACE}
              strokeWidth={2}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
