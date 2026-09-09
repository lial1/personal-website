"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Bucket } from "@/lib/savings/constants";
import { usd } from "@/lib/savings/format";
import AllocationRows, { type Split } from "./AllocationRows";

type Source = {
  id: number;
  name: string;
  defaultTaxRate: number;
  defaultBucket: Bucket | null;
};

const today = () => new Date().toISOString().slice(0, 10);
const input =
  "rounded-md border border-line bg-sand px-2 py-1.5 text-sm text-ink outline-none focus:border-accent";

export default function IncomeForm({ sources }: { sources: Source[] }) {
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [sourceId, setSourceId] = useState<number>(sources[0]?.id ?? 0);
  const [gross, setGross] = useState("");
  const [ratePct, setRatePct] = useState(String((sources[0]?.defaultTaxRate ?? 0) * 100));
  const [splits, setSplits] = useState<Split[]>([
    { bucket: sources[0]?.defaultBucket ?? "hysa_excess", amount: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grossNum = Number(gross) || 0;
  const rate = (Number(ratePct) || 0) / 100;
  // Mirrors the generated columns in Postgres, so the preview matches what is stored.
  const tax = useMemo(() => Math.round(grossNum * rate * 100) / 100, [grossNum, rate]);
  const net = Math.round((grossNum - tax) * 100) / 100;

  function pickSource(id: number) {
    setSourceId(id);
    const s = sources.find((x) => x.id === id);
    if (!s) return;
    setRatePct(String(s.defaultTaxRate * 100));
    if (s.defaultBucket) setSplits([{ bucket: s.defaultBucket, amount: "" }]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/savings/income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        sourceId,
        gross: grossNum,
        taxRate: rate,
        allocations: splits
          .map((s) => ({ bucket: s.bucket, amount: Number(s.amount) || 0 }))
          .filter((s) => s.amount !== 0),
      }),
    });
    if (res.ok) {
      setGross("");
      setSplits([{ bucket: splits[0].bucket, amount: "" }]);
      router.refresh();
    } else {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Could not save.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-offblack">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-offblack">
          Source
          <select
            value={sourceId}
            onChange={(e) => pickSource(Number(e.target.value))}
            className={input}
          >
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-offblack">
          Amount
          <input
            type="number"
            step="0.01"
            value={gross}
            onChange={(e) => setGross(e.target.value)}
            className={`${input} w-32`}
            placeholder="0.00"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-offblack">
          Tax %
          <input
            type="number"
            step="0.1"
            value={ratePct}
            onChange={(e) => setRatePct(e.target.value)}
            className={`${input} w-20`}
          />
        </label>
      </div>

      <p className="text-sm text-muted">
        {usd(tax)} set aside for tax, <span className="text-ink">{usd(net)}</span> to allocate.
      </p>

      <AllocationRows splits={splits} setSplits={setSplits} net={net} />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy || !grossNum}
          className="rounded-md bg-ink px-3 py-1.5 text-sm text-sand disabled:opacity-40"
        >
          {busy ? "Saving..." : "Add income"}
        </button>
        {error && <p className="text-sm text-muted-red">{error}</p>}
      </div>
    </form>
  );
}
