"use client";

import { ALLOCATABLE_BUCKETS, BUCKET_LABEL, type Bucket } from "@/lib/savings/constants";
import { usd } from "@/lib/savings/format";

export type Split = { bucket: Bucket; amount: string };

const input =
  "rounded-md border border-line bg-sand px-2 py-1.5 text-sm text-ink outline-none focus:border-accent";

/** Shared splitter: the remainder is always visible, so a split can't silently not add up. */
export default function AllocationRows({
  splits,
  setSplits,
  net,
}: {
  splits: Split[];
  setSplits: (s: Split[]) => void;
  net: number;
}) {
  const allocated = splits.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const remainder = Math.round((net - allocated) * 100) / 100;

  const update = (i: number, patch: Partial<Split>) =>
    setSplits(splits.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <div className="w-full space-y-2">
      {splits.map((s, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <select
            value={s.bucket}
            onChange={(e) => update(i, { bucket: e.target.value as Bucket })}
            className={input}
          >
            {ALLOCATABLE_BUCKETS.map((b) => (
              <option key={b} value={b}>
                {BUCKET_LABEL[b]}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            value={s.amount}
            onChange={(e) => update(i, { amount: e.target.value })}
            className={`${input} w-32`}
            placeholder="0.00"
          />
          {splits.length > 1 && (
            <button
              type="button"
              onClick={() => setSplits(splits.filter((_, j) => j !== i))}
              className="text-xs text-muted hover:text-muted-red"
            >
              remove
            </button>
          )}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() =>
            setSplits([
              ...splits,
              { bucket: "hysa_excess", amount: remainder > 0 ? remainder.toFixed(2) : "" },
            ])
          }
          className="text-muted hover:text-ink"
        >
          + split
        </button>
        {splits.length === 1 && (
          <button
            type="button"
            onClick={() => update(0, { amount: net.toFixed(2) })}
            className="text-muted hover:text-ink"
          >
            use full net
          </button>
        )}
        <span className={Math.abs(remainder) > 0.005 ? "text-muted-red" : "text-muted"}>
          {Math.abs(remainder) < 0.005
            ? "Fully allocated"
            : `${remainder > 0 ? "Left to assign" : "Over by"} ${usd(Math.abs(remainder))}`}
        </span>
      </div>
    </div>
  );
}
