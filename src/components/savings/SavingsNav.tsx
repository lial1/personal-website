"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { href: "/savings", label: "Dashboard" },
  { href: "/savings/portfolio", label: "Portfolio" },
  { href: "/savings/income", label: "Income" },
];

export default function SavingsNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/savings/login") return null;

  async function logout() {
    await fetch("/api/savings/logout", { method: "POST" });
    router.push("/savings/login");
    router.refresh();
  }

  return (
    <nav className="mb-8 flex items-center justify-between border-b border-line pb-3">
      <div className="flex gap-5 text-sm">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="nav-link"
            data-active={pathname === t.href}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <button onClick={logout} className="text-xs text-offblack hover:text-ink">
        Sign out
      </button>
    </nav>
  );
}
