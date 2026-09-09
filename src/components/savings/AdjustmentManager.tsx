"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdjustmentRow } from "@/lib/savings/balances";
import { BUCKETS, BUCKET_LABEL, type Bucket } from "@/lib/savings/constants";
import { shortDate, signedUsd } from "@/lib/savings/format";

const input =
  "rounded-md border border-line bg-sand px-2 py-1.5 text-sm text-ink outline-none focus:border-accent";
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Anything the ledger cannot infer: HYSA interest, fees, a tax payment, a transfer
 * between accounts, or a correction. Amounts are signed.
 */
export default function AdjustmentManager({ adjustments }: { adjustments: AdjustmentRow[] }) {
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [bucket, setBucket] = useState<Bucket>("hysa_excess");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/savings/adjustments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, bucket, amount: Number(amount), reason }),
    });
    setBusy(false);
    if (res.ok) {
      setAmount("");
      setReason("");
      router.refresh();
    } else {
      setError((await res.json().catch(() => ({}))).error ?? "Could not save.");
    }
  }

  async function remove(id: number) {
    setBusy(true);
    const res = await fetch(`/api/savings/adjustments/${id}`, { method: "DELETE" });
    setBusy(false);
    setConfirming(null);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-offblack">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-offblack">
          Bucket
          <select
            value={bucket}
            onChange={(e) => setBucket(e.target.value as Bucket)}
            className={input}
          >
            {BUCKETS.map((b) => (
              <option key={b} value={b}>
                {BUCKET_LABEL[b]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-offblack">
          Amount
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="-500.00"
            className={`${input} w-32`}
          />
        </label>
        <label className="flex min-w-[14rem] flex-1 flex-col gap-1 text-xs text-offblack">
          What was it
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Paid 2025 taxes"
            className={input}
          />
        </label>
        <button
          type="submit"
          disabled={busy || !amount || !reason.trim()}
          className="rounded-md bg-ink px-3 py-1.5 text-sm text-sand disabled:opacity-40"
        >
          {busy ? "Saving..." : "Log"}
        </button>
        {error && <p className="w-full text-sm text-muted-red">{error}</p>}
      </form>

      <p className="text-xs text-muted">
        Use a negative amount for money leaving a bucket, positive for money arriving.
      </p>

      {adjustments.length > 0 && (
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[32rem] text-sm [&_td:not(:first-child)]:pl-4 [&_th:not(:first-child)]:pl-4">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-offblack">
                <th className="pb-2 text-left font-normal">Date</th>
                <th className="pb-2 text-left font-normal">Bucket</th>
                <th className="pb-2 text-right font-normal">Amount</th>
                <th className="pb-2 text-left font-normal">Reason</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {adjustments.map((a) => (
                <tr key={a.id} className="border-b border-line/60">
                  <td className="whitespace-nowrap py-2 text-muted">{shortDate(a.date)}</td>
                  <td className="py-2 text-muted">{BUCKET_LABEL[a.bucket]}</td>
                  <td
                    className={`py-2 text-right tabular-nums ${
                      a.amount < 0 ? "text-muted-red" : "text-ink"
                    }`}
                  >
                    {signedUsd(a.amount)}
                  </td>
                  <td className="py-2 text-muted">{a.reason}</td>
                  <td className="py-2 text-right text-xs">
                    {confirming === a.id ? (
                      <span className="flex justify-end gap-2 whitespace-nowrap">
                        <button
                          onClick={() => remove(a.id)}
                          disabled={busy}
                          className="text-muted-red hover:underline disabled:opacity-40"
                        >
                          really delete
                        </button>
                        <button
                          onClick={() => setConfirming(null)}
                          className="text-muted hover:text-ink"
                        >
                          keep
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirming(a.id)}
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
      )}
    </div>
  );
}
