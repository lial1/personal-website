"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usd } from "@/lib/savings/format";

export default function MilestoneTarget({ target }: { target: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(target));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await fetch("/api/savings/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestoneTarget: Number(value) }),
    });
    setBusy(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="mb-4 text-xs text-muted hover:text-ink"
        title="Change the target"
      >
        of {usd(target, false)}
      </button>
    );
  }

  return (
    <span className="mb-4 flex items-center gap-2 text-xs">
      <input
        type="number"
        step="500"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        className="w-28 rounded-md border border-line bg-sand px-2 py-1 text-sm
                   text-ink outline-none focus:border-accent"
      />
      <button
        onClick={save}
        disabled={busy}
        className="rounded bg-ink px-2 py-1 text-sand disabled:opacity-40"
      >
        {busy ? "..." : "Save"}
      </button>
      <button onClick={() => setEditing(false)} className="text-muted hover:text-ink">
        cancel
      </button>
    </span>
  );
}
