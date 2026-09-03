import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { requireBusinessId } from "./queries";

export async function findInvoiceByNumber(
  businessId: string,
  invoiceNumber: string,
  supplierNameGuess: string | null,
) {
  const id = requireBusinessId(businessId);
  const rows = await db
    .select({ id: invoices.id, status: invoices.status })
    .from(invoices)
    .where(
      and(
        eq(invoices.businessId, id),
        eq(invoices.invoiceNumber, invoiceNumber),
      ),
    );
  if (!supplierNameGuess) return rows[0] ?? null;
  const [row] = await db
    .select({ id: invoices.id, status: invoices.status })
    .from(invoices)
    .where(
      and(
        eq(invoices.businessId, id),
        eq(invoices.invoiceNumber, invoiceNumber),
        eq(invoices.supplierNameGuess, supplierNameGuess),
      ),
    )
    .limit(1);
  return row ?? rows[0] ?? null;
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
