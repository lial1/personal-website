import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Accounts and cash buckets are enums, not free text. The spreadsheet this
 * replaces silently dropped rows from its SUMIFs because "Roth IRA " had a
 * trailing space; that class of bug is not expressible here.
 */
export const accountEnum = pgEnum("account", [
  "roth_ira",
  "brokerage",
  "hysa",
  "coinbase",
  "checking",
]);

export const bucketEnum = pgEnum("cash_bucket", [
  "hysa_tax",
  "hysa_emergency",
  "hysa_excess",
  "brokerage_cash",
  "roth_cash",
  "coinbase_cash",
  "checking",
]);

export const sideEnum = pgEnum("trade_side", ["buy", "sell"]);

/** Where money comes from, and how much of it is spoken for by taxes. */
export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // 0.3000 for 1099 contract work, 0.0000 for gifts / W-2 / reimbursements.
  defaultTaxRate: numeric("default_tax_rate", { precision: 5, scale: 4 })
    .notNull()
    .default("0"),
  defaultBucket: bucketEnum("default_bucket"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * The ledger. This is the only thing that gets typed by hand; every balance in
 * the app is derived from it. tax_withheld and net are generated columns, so
 * they cannot drift out of step with gross the way the workbook's did.
 */
export const income = pgTable(
  "income",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    sourceId: integer("source_id")
      .notNull()
      .references(() => sources.id),
    gross: numeric("gross", { precision: 12, scale: 2 }).notNull(),
    taxRate: numeric("tax_rate", { precision: 5, scale: 4 }).notNull().default("0"),
    taxWithheld: numeric("tax_withheld", { precision: 12, scale: 2 }).generatedAlwaysAs(
      sql`round(gross * tax_rate, 2)`,
    ),
    net: numeric("net", { precision: 12, scale: 2 }).generatedAlwaysAs(
      sql`gross - round(gross * tax_rate, 2)`,
    ),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("income_date_idx").on(t.date)],
);

/**
 * Where each income row's net actually landed. One income row can split across
 * several buckets, which is what the workbook's "Brokerage, HYSA" cells meant
 * without ever saying how much went to each.
 */
export const allocations = pgTable(
  "allocations",
  {
    id: serial("id").primaryKey(),
    incomeId: integer("income_id")
      .notNull()
      .references(() => income.id, { onDelete: "cascade" }),
    bucket: bucketEnum("bucket").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  },
  (t) => [index("allocations_income_idx").on(t.incomeId)],
);

/** Buys and sells. A buy moves cash into shares; holdings are never typed. */
export const trades = pgTable(
  "trades",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    account: accountEnum("account").notNull(),
    ticker: text("ticker").notNull(),
    side: sideEnum("side").notNull(),
    shares: numeric("shares", { precision: 18, scale: 8 }).notNull(),
    price: numeric("price", { precision: 18, scale: 8 }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("trades_account_ticker_idx").on(t.account, t.ticker)],
);

/**
 * Escape hatch: opening balances, HYSA interest, fees, tax payments, manual
 * reconciliation. Signed. Without this the derived model becomes a cage.
 */
export const adjustments = pgTable(
  "adjustments",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    bucket: bucketEnum("bucket").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("adjustments_bucket_idx").on(t.bucket)],
);

/** Last known quote per ticker. Written by cron, read by every page. */
export const prices = pgTable("prices", {
  ticker: text("ticker").primaryKey(),
  price: numeric("price", { precision: 18, scale: 8 }).notNull(),
  prevClose: numeric("prev_close", { precision: 18, scale: 8 }),
  currency: text("currency").notNull().default("USD"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
});

/** Daily net worth, so the trend line exists at all. A spreadsheet only knows today. */
export const snapshots = pgTable(
  "snapshots",
  {
    date: date("date").primaryKey(),
    totalValue: numeric("total_value", { precision: 14, scale: 2 }).notNull(),
    byAccount: jsonb("by_account").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("snapshots_date_idx").on(t.date)],
);

/** Rate limiting. In-memory counters do not survive serverless invocations. */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    ip: text("ip").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_attempts_ip_at_idx").on(t.ip, t.at)],
);

/** Small key/value bag: milestone target, and whatever else resists a table. */
export const settings = pgTable(
  "settings",
  {
    key: text("key").primaryKey(),
    value: jsonb("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("settings_key_idx").on(t.key)],
);
