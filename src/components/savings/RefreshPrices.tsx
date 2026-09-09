"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RefreshPrices() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/savings/prices/refresh", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(body.error ?? "Refresh failed.");
      } else if (body.failed?.length) {
        setMsg(
          `Updated ${body.updated.length}. Failed: ` +
            body.failed.map((f: { ticker: string }) => f.ticker).join(", "),
        );
        router.refresh();
      } else {
        setMsg(`Updated ${body.updated.length} quotes.`);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={refresh}
        disabled={busy}
        className="rounded border border-line px-2 py-1 text-xs text-muted
                   hover:text-ink disabled:opacity-40"
      >
        {busy ? "Refreshing..." : "Refresh prices"}
      </button>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </span>
  );
}
