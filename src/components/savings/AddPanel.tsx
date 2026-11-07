"use client";

import { useState } from "react";
import type { Bucket } from "@/lib/savings/constants";
import IncomeForm from "./IncomeForm";
import TradeForm from "./TradeForm";
import AdjustmentManager from "./AdjustmentManager";

type Source = { id: number; name: string; defaultTaxRate: number; defaultBucket: Bucket | null };

const KINDS = [
  { key: "income", label: "Income" },
  { key: "trade", label: "Investment" },
  { key: "adjustment", label: "Adjustment" },
] as const;

/** One add box for everything that moves money, so the activity page is the only stop. */
export default function AddPanel({ sources }: { sources: Source[] }) {
  const [kind, setKind] = useState<(typeof KINDS)[number]["key"]>("income");

  return (
    <div className="space-y-4">
      <div className="flex gap-5 text-sm">
        {KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => setKind(k.key)}
            className="nav-link"
            data-active={kind === k.key}
          >
            {k.label}
          </button>
        ))}
      </div>
      {kind === "income" && <IncomeForm sources={sources} />}
      {kind === "trade" && <TradeForm />}
      {kind === "adjustment" && <AdjustmentManager adjustments={[]} showList={false} />}
    </div>
  );
}
