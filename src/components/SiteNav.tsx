"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "projects" },
  { href: "/about", label: "about" },
  { href: "/extras", label: "extras" },
];

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-end text-xs uppercase tracking-[0.3em]">
      <nav className="flex items-center gap-7">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              data-active={isActive}
              className="nav-link"
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
