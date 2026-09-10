export type InvoiceNumberDupOpts = {
  /** Prefer this when known — aligns with partial unique index. */
  supplierId?: string | null;
  /** Fallback scope when supplier row is not resolved yet. */
  supplierNameGuess?: string | null;
};

export type InvoiceNumberDupCandidate = {
  id: string;
  status: string;
  supplierId: string | null;
  supplierNameGuess: string | null;
};

/**
 * Pure supplier-scoped pick among rows that already share businessId + invoiceNumber.
 * - With supplierId: only that supplier counts as a duplicate.
 * - Else with supplierNameGuess: only matching guess (case-insensitive) counts.
 * - Else: any existing row with that number is treated as a duplicate (weak).
 */
export function pickInvoiceNumberDuplicate(
  candidates: InvoiceNumberDupCandidate[],
  opts: InvoiceNumberDupOpts = {},
): InvoiceNumberDupCandidate | null {
  if (candidates.length === 0) return null;

  const supplierId = opts.supplierId ?? null;
  const guess = opts.supplierNameGuess?.trim() || null;

  if (supplierId) {
    return candidates.find((row) => row.supplierId === supplierId) ?? null;
  }

  if (guess) {
    const needle = guess.toLowerCase();
    return (
      candidates.find(
        (row) => (row.supplierNameGuess ?? "").trim().toLowerCase() === needle,
      ) ?? null
    );
  }

  return candidates[0] ?? null;
}
