export const usd = (n: number, cents = true) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });

export const signedUsd = (n: number) => (n > 0 ? "+" : n < 0 ? "-" : "") + usd(Math.abs(n));

export const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;

export const shares = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 8 });

/** Dates are stored as plain yyyy-mm-dd; parse as local so they never shift a day. */
export const shortDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const relativeTime = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
};
