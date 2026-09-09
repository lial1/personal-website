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
import { usd, shortDate } from "@/lib/savings/format";

const LINE = "#c36a3f";

/**
 * One series, so no legend: the heading names it. This is the view a spreadsheet
 * cannot produce, since it only ever holds today's balances.
 */
export default function NetWorthTrend({
  data,
}: {
  data: { date: string; total: number }[];
}) {
  if (data.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center text-center text-sm text-muted">
        {data.length === 0
          ? "No snapshots yet. The first one is written by tonight's price refresh."
          : "One snapshot so far. The trend line starts once there are two."}
      </div>
    );
  }

  const values = data.map((d) => d.total);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.12 || max * 0.05;

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={LINE} stopOpacity={0.22} />
              <stop offset="100%" stopColor={LINE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e2ddd4" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => shortDate(d).replace(/, \d{4}$/, "")}
            tick={{ fill: "#8a847e", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#e2ddd4" }}
            minTickGap={28}
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tickFormatter={(v: number) => usd(v, false)}
            tick={{ fill: "#8a847e", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip
            cursor={{ stroke: "#8a847e", strokeWidth: 1 }}
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e2ddd4",
              borderRadius: 6,
              fontSize: 13,
            }}
            labelFormatter={(d) => shortDate(String(d))}
            formatter={(v) => [usd(Number(v)), "Net worth"]}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke={LINE}
            strokeWidth={2}
            fill="url(#nw)"
            dot={false}
            activeDot={{ r: 4, stroke: "#fbfaf7", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
