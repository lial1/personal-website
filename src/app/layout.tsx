import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Lia Li — Projects",
  description: "Personal site with projects, about, and extras.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <div className="min-h-screen bg-sand text-ink">
          <SiteNav />
          <div className="mx-auto flex w-full max-w-3xl flex-col px-6 pb-24 pt-16 sm:px-8">
            <main className="mt-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
