import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { requireBusinessId } from "./queries";
import type { InvoiceNumberDupOpts } from "./invoice-number-dedupe";

export type { InvoiceNumberDupOpts, InvoiceNumberDupCandidate } from "./invoice-number-dedupe";
export { pickInvoiceNumberDuplicate } from "./invoice-number-dedupe";

/**
 * Find an existing invoice by number, tightened to supplier when possible.
 * Call with supplierId after find-or-create so the lookup matches the unique index.
 */
export async function findInvoiceByNumber(
  businessId: string,
  invoiceNumber: string,
  opts: InvoiceNumberDupOpts | string | null = {},
) {
  const id = requireBusinessId(businessId);
  // Back-compat: older callers passed supplierNameGuess as the 3rd argument.
  const normalized: InvoiceNumberDupOpts =
    typeof opts === "string" || opts === null
      ? { supplierNameGuess: opts }
      : opts;

  const supplierId = normalized.supplierId ?? null;
  const supplierNameGuess = normalized.supplierNameGuess?.trim() || null;

  if (supplierId) {
    const [row] = await db
      .select({
        id: invoices.id,
        status: invoices.status,
        supplierId: invoices.supplierId,
        supplierNameGuess: invoices.supplierNameGuess,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.businessId, id),
          eq(invoices.invoiceNumber, invoiceNumber),
          eq(invoices.supplierId, supplierId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  if (supplierNameGuess) {
    const [row] = await db
      .select({
        id: invoices.id,
        status: invoices.status,
        supplierId: invoices.supplierId,
        supplierNameGuess: invoices.supplierNameGuess,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.businessId, id),
          eq(invoices.invoiceNumber, invoiceNumber),
          eq(invoices.supplierNameGuess, supplierNameGuess),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  const [row] = await db
    .select({
      id: invoices.id,
      status: invoices.status,
      supplierId: invoices.supplierId,
      supplierNameGuess: invoices.supplierNameGuess,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.businessId, id),
        eq(invoices.invoiceNumber, invoiceNumber),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function findInvoiceByProviderMessage(opts: {
  businessId: string;
  provider: string;
  providerMessageId: string;
}) {
  const id = requireBusinessId(opts.businessId);
  const [row] = await db
    .select({ id: invoices.id, status: invoices.status })
    .from(invoices)
    .where(
      and(
        eq(invoices.businessId, id),
        eq(invoices.provider, opts.provider),
        eq(invoices.providerMessageId, opts.providerMessageId),
      ),
    )
    .limit(1);
  return row ?? null;
}
