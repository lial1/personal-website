"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { href: "/", label: "Home" },
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
    <nav className="sticky top-0 z-40 -mx-3 mb-8 flex items-center justify-between border-b border-line bg-sand/90 px-3 py-3 backdrop-blur">
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
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
