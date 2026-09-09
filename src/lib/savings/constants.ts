export const ACCOUNTS = ["roth_ira", "brokerage", "hysa", "coinbase", "checking"] as const;
export type Account = (typeof ACCOUNTS)[number];

export const BUCKETS = [
  "hysa_tax",
  "hysa_emergency",
  "hysa_excess",
  "brokerage_cash",
  "roth_cash",
  "coinbase_cash",
  "checking",
] as const;
export type Bucket = (typeof BUCKETS)[number];

export const ACCOUNT_LABEL: Record<Account, string> = {
  roth_ira: "Roth IRA",
  brokerage: "Brokerage",
  hysa: "HYSA",
  coinbase: "Coinbase",
  checking: "Checking",
};

export const BUCKET_LABEL: Record<Bucket, string> = {
  hysa_tax: "Tax set-aside",
  hysa_emergency: "Emergency fund",
  hysa_excess: "Excess",
  brokerage_cash: "Brokerage cash",
  roth_cash: "Roth cash",
  coinbase_cash: "Coinbase cash",
  checking: "Checking",
};

export const BUCKET_ACCOUNT: Record<Bucket, Account> = {
  hysa_tax: "hysa",
  hysa_emergency: "hysa",
  hysa_excess: "hysa",
  brokerage_cash: "brokerage",
  roth_cash: "roth_ira",
  coinbase_cash: "coinbase",
  checking: "checking",
};

/**
 * hysa_tax is computed from withheld taxes, never allocated to directly.
 * These are the buckets the income form offers.
 */
export const ALLOCATABLE_BUCKETS: Bucket[] = BUCKETS.filter((b) => b !== "hysa_tax");

/**
 * Checking is tracked but excluded from net worth: money that "stayed in
 * checking" is spending money, not savings. The workbook drew the same line,
 * totalling only Roth + Brokerage + HYSA + Coinbase.
 */
export const NET_WORTH_ACCOUNTS: Account[] = ACCOUNTS.filter((a) => a !== "checking");

/** Chart identity colors, in fixed account order. Validated with the dataviz
 * palette checker against the #fbfaf7 card surface: passes lightness band,
 * chroma floor, all-pairs CVD separation, normal-vision floor and 3:1 contrast. */
export const ACCOUNT_COLOR: Record<Account, string> = {
  roth_ira: "#00795a",
  brokerage: "#4a8fd6",
  hysa: "#d4763f",
  coinbase: "#94519f",
  checking: "#8a847e",
};

/** A quote older than this is shown with a stale badge rather than trusted silently. */
export const STALE_PRICE_HOURS = 48;

export const DEFAULT_MILESTONE_TARGET = 25000;
