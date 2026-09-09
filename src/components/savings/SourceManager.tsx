"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SourceRow } from "@/lib/savings/income";
import { ALLOCATABLE_BUCKETS, BUCKET_LABEL, type Bucket } from "@/lib/savings/constants";
import { pct } from "@/lib/savings/format";

const input =
  "rounded-md border border-line bg-sand px-2 py-1.5 text-sm text-ink outline-none focus:border-accent";

export default function SourceManager({ sources }: { sources: SourceRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      <div className="-mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[32rem] text-sm [&_td:not(:first-child)]:pl-4 [&_th:not(:first-child)]:pl-4">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-offblack">
              <th className="pb-2 text-left font-normal">Source</th>
              <th className="pb-2 text-right font-normal">Tax</th>
              <th className="pb-2 text-left font-normal">Usually goes to</th>
              <th className="pb-2 text-right font-normal">Rows</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {sources.map((s) =>
              editing === s.id ? (
                <tr key={s.id} className="border-b border-line/60">
                  <td colSpan={5} className="py-3">
                    <SourceEditor source={s} onDone={() => setEditing(null)} />
                  </td>
                </tr>
              ) : (
                <tr key={s.id} className="border-b border-line/60">
                  <td className="py-2 text-ink">
                    {s.name}
                    {!s.active && <span className="ml-2 text-xs text-muted">off</span>}
                  </td>
                  <td className="py-2 text-right tabular-nums text-muted">
                    {pct(s.defaultTaxRate, 0)}
                  </td>
                  <td className="py-2 text-muted">
                    {s.defaultBucket ? BUCKET_LABEL[s.defaultBucket] : "--"}
                  </td>
                  <td className="py-2 text-right tabular-nums text-muted">{s.uses}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => setEditing(s.id)}
                      className="text-xs text-muted hover:text-ink"
                    >
                      edit
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {adding ? (
        <SourceEditor
          onDone={() => {
            setAdding(false);
            router.refresh();
          }}
        />
      ) : (
        <button onClick={() => setAdding(true)} className="text-xs text-muted hover:text-ink">
          + add a source
        </button>
      )}
    </div>
  );
}

function SourceEditor({ source, onDone }: { source?: SourceRow; onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(source?.name ?? "");
  const [ratePct, setRatePct] = useState(String((source?.defaultTaxRate ?? 0) * 100));
  const [bucket, setBucket] = useState<Bucket | "">(source?.defaultBucket ?? "");
  const [active, setActive] = useState(source?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const body = {
      name: name.trim(),
      defaultTaxRate: (Number(ratePct) || 0) / 100,
      defaultBucket: bucket === "" ? null : bucket,
      active,
    };
    const res = await fetch(
      source ? `/api/savings/sources/${source.id}` : "/api/savings/sources",
      {
        method: source ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    setBusy(false);
    if (res.ok) {
      onDone();
      router.refresh();
    } else {
      setError((await res.json().catch(() => ({}))).error ?? "Could not save.");
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-line bg-sand p-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-offblack">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New client"
            className={input}
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
        <label className="flex flex-col gap-1 text-xs text-offblack">
          Usually goes to
          <select
            value={bucket}
            onChange={(e) => setBucket(e.target.value as Bucket | "")}
            className={input}
          >
            <option value="">No default</option>
            {ALLOCATABLE_BUCKETS.map((b) => (
              <option key={b} value={b}>
                {BUCKET_LABEL[b]}
              </option>
            ))}
          </select>
        </label>
        {source && (
          <label className="flex items-center gap-2 pb-2 text-xs text-offblack">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Offer in the form
          </label>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs">
        <button
          onClick={save}
          disabled={busy || !name.trim()}
          className="rounded bg-ink px-3 py-1.5 text-sand disabled:opacity-40"
        >
          {busy ? "Saving..." : "Save"}
        </button>
        <button onClick={onDone} className="text-muted hover:text-ink">
          cancel
        </button>
        {error && <span className="text-muted-red">{error}</span>}
      </div>
    </div>
  );
}
