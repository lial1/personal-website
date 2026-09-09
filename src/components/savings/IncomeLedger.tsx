"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { IncomeRow } from "@/lib/savings/income";
import { BUCKET_LABEL, type Bucket } from "@/lib/savings/constants";
import { shortDate, usd } from "@/lib/savings/format";
import { Chip } from "./ui";
import AllocationRows, { type Split } from "./AllocationRows";

type Source = { id: number; name: string; defaultTaxRate: number; defaultBucket: Bucket | null };

const input =
  "rounded-md border border-line bg-sand px-2 py-1.5 text-sm text-ink outline-none focus:border-accent";

/**
 * Every field on a row is editable in place: date, source, amount, tax rate, note
 * and where the money went. Saving re-derives every balance downstream.
 */
export default function IncomeLedger({
  rows,
  sources,
}: {
  rows: IncomeRow[];
  sources: Source[];
}) {
  const [editing, setEditing] = useState<number | null>(null);

  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[46rem] text-sm [&_td:not(:first-child)]:pl-4 [&_th:not(:first-child)]:pl-4">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-offblack">
            <th className="pb-2 text-left font-normal">Date</th>
            <th className="pb-2 text-left font-normal">Source</th>
            <th className="pb-2 text-right font-normal">Gross</th>
            <th className="pb-2 text-right font-normal">Tax</th>
            <th className="pb-2 text-right font-normal">Net</th>
            <th className="pb-2 text-left font-normal">Went to</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) =>
            editing === row.id ? (
              <tr key={row.id} className="border-b border-line/60">
                <td colSpan={7} className="py-3">
                  <RowEditor
                    row={row}
                    sources={sources}
                    onDone={() => setEditing(null)}
                  />
                </td>
              </tr>
            ) : (
              <DisplayRow key={row.id} row={row} onEdit={() => setEditing(row.id)} />
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}

function DisplayRow({ row, onEdit }: { row: IncomeRow; onEdit: () => void }) {
  return (
    <tr className="border-b border-line/60 align-top">
      <td className="whitespace-nowrap py-2 text-muted">{shortDate(row.date)}</td>
      <td className="py-2 text-ink">
        {row.source}
        {row.note && <span className="ml-2 text-xs text-muted">{row.note}</span>}
      </td>
      <td className="py-2 text-right tabular-nums text-ink">{usd(row.gross)}</td>
      <td className="py-2 text-right tabular-nums text-muted">
        {row.taxWithheld ? usd(row.taxWithheld) : "--"}
      </td>
      <td className="py-2 text-right tabular-nums text-ink">{usd(row.net)}</td>
      <td className="py-2">
        <span className="flex flex-wrap gap-1">
          {row.allocations.map((a, i) => (
            <Chip key={i}>
              {BUCKET_LABEL[a.bucket]} {usd(a.amount)}
            </Chip>
          ))}
          {Math.abs(row.unallocated) > 0.005 && (
            <span className="inline-flex items-center rounded border border-muted-red px-1.5 py-0.5 text-xs text-muted-red">
              {row.unallocated > 0 ? "Unallocated" : "Over-allocated"}{" "}
              {usd(Math.abs(row.unallocated))}
            </span>
          )}
        </span>
      </td>
      <td className="py-2 text-right">
        <button onClick={onEdit} className="text-xs text-muted hover:text-ink">
          edit
        </button>
      </td>
    </tr>
  );
}

function RowEditor({
  row,
  sources,
  onDone,
}: {
  row: IncomeRow;
  sources: Source[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [date, setDate] = useState(row.date.slice(0, 10));
  const [sourceId, setSourceId] = useState(row.sourceId);
  const [gross, setGross] = useState(String(row.gross));
  const [ratePct, setRatePct] = useState(String(row.taxRate * 100));
  const [note, setNote] = useState(row.note ?? "");
  const [splits, setSplits] = useState<Split[]>(
    row.allocations.length
      ? row.allocations.map((a) => ({ bucket: a.bucket, amount: a.amount.toFixed(2) }))
      : [{ bucket: "hysa_excess", amount: row.net.toFixed(2) }],
  );
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grossNum = Number(gross) || 0;
  const rate = (Number(ratePct) || 0) / 100;
  const tax = Math.round(grossNum * rate * 100) / 100;
  const net = Math.round((grossNum - tax) * 100) / 100;

  async function save() {
    setBusy(true);
    setError(null);
    const patch = await fetch(`/api/savings/income/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, sourceId, gross: grossNum, taxRate: rate, note }),
    });
    if (!patch.ok) {
      setError((await patch.json().catch(() => ({}))).error ?? "Could not save.");
      setBusy(false);
      return;
    }
    const put = await fetch(`/api/savings/income/${row.id}/allocations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allocations: splits
          .map((s) => ({ bucket: s.bucket, amount: Number(s.amount) || 0 }))
          .filter((s) => s.amount !== 0),
      }),
    });
    setBusy(false);
    if (!put.ok) {
      setError("Saved the row, but its destinations did not save.");
      return;
    }
    onDone();
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/savings/income/${row.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      onDone();
      router.refresh();
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-line bg-sand p-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-offblack">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-offblack">
          Source
          <select
            value={sourceId}
            onChange={(e) => setSourceId(Number(e.target.value))}
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
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs text-offblack">
          Note
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional"
            className={input}
          />
        </label>
      </div>

      <p className="text-sm text-muted">
        {usd(tax)} set aside for tax, <span className="text-ink">{usd(net)}</span> to allocate.
      </p>

      <AllocationRows splits={splits} setSplits={setSplits} net={net} />

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <button
          onClick={save}
          disabled={busy || !grossNum}
          className="rounded bg-ink px-3 py-1.5 text-sand disabled:opacity-40"
        >
          {busy ? "Saving..." : "Save"}
        </button>
        <button onClick={onDone} className="text-muted hover:text-ink">
          cancel
        </button>
        <span className="ml-auto">
          {confirming ? (
            <span className="flex gap-2">
              <button
                onClick={remove}
                disabled={busy}
                className="text-muted-red hover:underline disabled:opacity-40"
              >
                really delete
              </button>
              <button onClick={() => setConfirming(false)} className="text-muted hover:text-ink">
                keep
              </button>
            </span>
          ) : (
            <button onClick={() => setConfirming(true)} className="text-muted hover:text-muted-red">
              delete row
            </button>
          )}
        </span>
      </div>
      {error && <p className="text-sm text-muted-red">{error}</p>}
    </div>
  );
}
