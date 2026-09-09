# Changelog

## 2026-09-09 (visuals)
- `/savings` is charts-first now: allocation donut, income by month split into kept vs tax,
  a saved-to-date curve built from the ledger, income by source, a tax-coverage comparison,
  and every position on one scale. Prose cut throughout.
- The public site's nav bar no longer renders on `/savings`; its links are anchors into the
  one-pager and had nothing to scroll to. Savings nav is Home / Dashboard / Portfolio / Income.
- Chart colours validated with the dataviz palette checker (all-pairs CVD separation,
  chroma floor and 3:1 contrast against the card surface).

## 2026-09-09
- Added a private, password-gated savings tracker at `/savings`, replacing the spreadsheet that preceded it.
- The income ledger is now the single source of truth: balances are derived from it
  (tax withheld, allocations, trades, adjustments), never typed a second time.
- Neon Postgres + Drizzle (`src/db/`), scrypt password + JWT cookie (`src/lib/savings/`),
  live prices from Finnhub + CoinGecko on a daily Vercel cron.
- Migrated `src/middleware.ts` to Next 16's `src/proxy.ts` convention.
- Everything is editable on the site: income rows (date, source, amount, tax rate, note,
  destinations), sources, adjustments, trades and the milestone target.
- The password now lives in the database, not a Vercel variable: it can be set with
  `npx tsx scripts/set-password.ts '<password>'` or changed from the dashboard, with no
  redeploy. `SAVINGS_PASSWORD_HASH` remains a fallback.
- No financial data lives in this repo: it is all in Neon, `/savings` is noindex, and the
  section is deliberately absent from `SiteNav`.

## 2025-01-18
- Scaffolded Next.js app with App Router, TypeScript, and Tailwind.
- Recreated `project_details.md` and added project runbook.
- Built initial layout, navigation, and routes.
- Added project landing page styled after the reference layout.
- Updated projects/about content using resume details.
- Adjusted layout widths and typography to match the reference centering.
