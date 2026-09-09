import { ALLOCATABLE_BUCKETS, type Bucket } from "./constants";

/** Shared shape check for the create and re-assign endpoints. Returns null on bad input. */
export function parseAllocations(raw: unknown): { bucket: Bucket; amount: number }[] | null {
  if (!Array.isArray(raw)) return null;
  const out: { bucket: Bucket; amount: number }[] = [];
  for (const a of raw) {
    const bucket = (a as { bucket?: unknown })?.bucket;
    const amount = Number((a as { amount?: unknown })?.amount);
    if (typeof bucket !== "string" || !ALLOCATABLE_BUCKETS.includes(bucket as Bucket)) return null;
    if (!Number.isFinite(amount)) return null;
    out.push({ bucket: bucket as Bucket, amount });
  }
  return out;
}

export const isIsoDate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Returns the cleaned source fields, or an { error } to hand straight back as a 400. */
export function parseSourceBody(
  body: unknown,
):
  | { name: string; defaultTaxRate: number; defaultBucket: Bucket | null }
  | { error: string } {
  const b = body as Record<string, unknown> | null;
  const name = typeof b?.name === "string" ? b.name.trim() : "";
  const defaultTaxRate = Number(b?.defaultTaxRate);
  const rawBucket = b?.defaultBucket;

  if (!name || name.length > 60) return { error: "Name is required (60 characters max)." };
  if (!Number.isFinite(defaultTaxRate) || defaultTaxRate < 0 || defaultTaxRate > 1) {
    return { error: "Tax rate must be between 0 and 100%." };
  }

  let defaultBucket: Bucket | null = null;
  if (typeof rawBucket === "string" && rawBucket !== "") {
    if (!ALLOCATABLE_BUCKETS.includes(rawBucket as Bucket)) {
      return { error: "Unknown destination." };
    }
    defaultBucket = rawBucket as Bucket;
  }

  return { name, defaultTaxRate, defaultBucket };
}
