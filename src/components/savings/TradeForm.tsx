"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ACCOUNTS, ACCOUNT_LABEL } from "@/lib/savings/constants";

const today = () => new Date().toISOString().slice(0, 10);

export default function TradeForm() {
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [account, setAccount] = useState<string>("brokerage");
  const [ticker, setTicker] = useState("");
  const [side, setSide] = useState("buy");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/savings/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        account,
        ticker: ticker.trim().toUpperCase(),
        side,
        shares: Number(shares),
        price: Number(price),
      }),
    });
    if (res.ok) {
      setTicker("");
      setShares("");
      setPrice("");
      router.refresh();
    } else {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Could not save.");
    }
    setBusy(false);
  }

  const input =
    "rounded-md border border-line bg-sand px-2 py-1.5 text-sm text-ink outline-none focus:border-accent";

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-offblack">
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-offblack">
        Account
        <select value={account} onChange={(e) => setAccount(e.target.value)} className={input}>
          {ACCOUNTS.filter((a) => a !== "checking" && a !== "hysa").map((a) => (
            <option key={a} value={a}>
              {ACCOUNT_LABEL[a]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-offblack">
        Side
        <select value={side} onChange={(e) => setSide(e.target.value)} className={input}>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-offblack">
        Ticker
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="VOO"
          className={`${input} w-24`}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-offblack">
        Shares
        <input
          type="number"
          step="any"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          className={`${input} w-28`}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-offblack">
        Price
        <input
          type="number"
          step="any"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className={`${input} w-28`}
        />
      </label>
      <button
        type="submit"
        disabled={busy || !ticker || !shares || !price}
        className="rounded-md bg-ink px-3 py-1.5 text-sm text-sand disabled:opacity-40"
      >
        {busy ? "Saving..." : "Log"}
      </button>
      {error && <p className="w-full text-sm text-muted-red">{error}</p>}
    </form>
  );
}
