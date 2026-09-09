/** Shared chart styling so every graph reads as one system. */
export const GRID = "#e2ddd4";
export const AXIS_TEXT = "#8a847e";
export const SURFACE = "#fbfaf7";

/** Kept vs tax. Validated all-pairs against the card surface with the dataviz checker. */
export const KEPT = "#d4763f";
export const TAX = "#4a8fd6";

export const ACCENT = "#c36a3f";

export const axisTick = { fill: AXIS_TEXT, fontSize: 11 } as const;

export const tooltipStyle = {
  background: "#ffffff",
  border: `1px solid ${GRID}`,
  borderRadius: 6,
  fontSize: 13,
  color: "#1f1e1b",
} as const;

/** "2026-03" -> "Mar" (and "Mar '26" in January, so year changes stay legible). */
export const monthLabel = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1, 1);
  const short = d.toLocaleDateString("en-US", { month: "short" });
  return mo === 1 ? `${short} '${String(y).slice(2)}` : short;
};
