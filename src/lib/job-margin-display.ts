import { formatCad } from "./money";

/**
 * Reports UI helper: margin = billed − costs.
 * When there is cost but nothing billed yet, show a clear label instead of a
 * bare negative "loss" (accounting values are unchanged).
 */
export function jobMarginDisplay(opts: {
  billedCents: number;
  costCents: number;
  marginCents: number;
}): { text: string; kind: "not_billed" | "margin" } {
  if (opts.billedCents === 0 && opts.costCents > 0) {
    return { text: "Not billed yet", kind: "not_billed" };
  }
  return { text: formatCad(opts.marginCents), kind: "margin" };
}
