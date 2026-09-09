"use client";

import { useState } from "react";

const input =
  "rounded-md border border-line bg-sand px-2 py-1.5 text-sm text-ink outline-none focus:border-accent";

export default function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/savings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    setBusy(false);
    if (res.ok) {
      setOk(true);
      setMsg("Password changed. It works everywhere straight away.");
      setCurrent("");
      setNext("");
    } else {
      setOk(false);
      setMsg((await res.json().catch(() => ({}))).error ?? "Could not change it.");
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-muted hover:text-ink">
        Change password
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-offblack">
        Current
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          className={input}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-offblack">
        New
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          className={input}
        />
      </label>
      <button
        type="submit"
        disabled={busy || !current || !next}
        className="rounded-md bg-ink px-3 py-1.5 text-sm text-sand disabled:opacity-40"
      >
        {busy ? "Saving..." : "Save"}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setMsg(null);
        }}
        className="pb-2 text-xs text-muted hover:text-ink"
      >
        cancel
      </button>
      {msg && (
        <p className={`w-full text-sm ${ok ? "text-muted" : "text-muted-red"}`}>{msg}</p>
      )}
    </form>
  );
}
