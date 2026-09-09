import type { Metadata } from "next";
import SavingsNav from "@/components/savings/SavingsNav";

// Private. Kept out of search indexes and out of SiteNav; reachable by URL only.
export const metadata: Metadata = {
  title: "Savings",
  robots: { index: false, follow: false, nocache: true },
};

export default function SavingsLayout({ children }: { children: React.ReactNode }) {
  return (
    // The site column is max-w-3xl, which clips the ledger. Break out of it for
    // this section only, leaving every public page's width untouched.
    <div className="relative left-1/2 w-[min(64rem,calc(100vw-3rem))] -translate-x-1/2 pt-4">
      <SavingsNav />
      {children}
    </div>
  );
}
