"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/savings/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/savings");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
      setPassword("");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        autoComplete="current-password"
        className="w-full rounded-md border border-line bg-card px-3 py-2 text-ink
                   outline-none focus:border-accent"
        placeholder="Password"
      />
      <button
        type="submit"
        disabled={busy || !password}
        className="mt-3 w-full rounded-md bg-ink px-3 py-2 text-sm text-sand
                   disabled:opacity-40"
      >
        {busy ? "Checking..." : "Sign in"}
      </button>
      {error && <p className="mt-3 text-sm text-muted-red">{error}</p>}
    </form>
  );
}
