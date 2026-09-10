import type { InvoiceMatchResult, MatchResult } from "./match";
import { invoiceStatusEnum } from "../db/schema";

/** Canonical invoice status values from `invoiceStatusEnum` in schema. */
export type InvoiceStatus = (typeof invoiceStatusEnum.enumValues)[number];

export type ReprocessExtractFields = {
  invoiceNumber: string | null;
  invoiceDate: string | null;
  totalCents: number | null;
  supplierNameGuess: string | null;
};

export type ReprocessInvoiceSnapshot = {
  totalCents: number | null;
  jobId: string | null;
  status: InvoiceStatus;
  matchReason: string | null;
  supplierId: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  detectedJobTags: string[] | null;
  supplierNameGuess: string | null;
};

/**
 * Builds the drizzle `.set()` payload for reprocessStoredInvoice.
 * When allocations are approved, money/assignment integrity fields stay as stored
 * so re-OCR cannot break allocations = totalCents.
 */
export function buildReprocessInvoiceUpdate(opts: {
  approved: boolean;
  invoice: ReprocessInvoiceSnapshot;
  fields: ReprocessExtractFields;
  match: MatchResult | InvoiceMatchResult;
  supplierId: string | null;
  extractedText: string;
}): {
  totalCents: number | null;
  jobId: string | null;
  status: InvoiceStatus;
  matchReason: string | null;
  supplierId: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  detectedJobTags: string[];
  supplierNameGuess: string | null;
  extractedText: string;
} {
  if (opts.approved) {
    return {
      totalCents: opts.invoice.totalCents,
      jobId: opts.invoice.jobId,
      status: opts.invoice.status,
      matchReason: opts.invoice.matchReason,
      supplierId: opts.invoice.supplierId,
      invoiceNumber: opts.invoice.invoiceNumber,
      invoiceDate: opts.invoice.invoiceDate,
      detectedJobTags: opts.invoice.detectedJobTags ?? [],
      supplierNameGuess: opts.invoice.supplierNameGuess,
      extractedText: opts.extractedText,
    };
  }

  const detectedJobTags =
    opts.match.status === "matched"
      ? [opts.match.jobTag]
      : opts.match.status === "needs_review"
        ? opts.match.tags
        : [];

  return {
    supplierId: opts.supplierId,
    jobId: opts.match.status === "matched" ? opts.match.jobId : null,
    status:
      opts.match.status === "matched"
        ? ("matched" as const)
        : ("needs_review" as const),
    invoiceNumber: opts.fields.invoiceNumber,
    invoiceDate: opts.fields.invoiceDate,
    detectedJobTags,
    totalCents: opts.fields.totalCents,
    extractedText: opts.extractedText,
    matchReason: opts.match.reason,
    supplierNameGuess: opts.fields.supplierNameGuess,
  };
}
