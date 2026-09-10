import { describe, expect, it } from "vitest";
import { buildReprocessInvoiceUpdate } from "./reprocess-invoice-update";

const invoice = {
  totalCents: 10000,
  jobId: "job-approved",
  status: "matched",
  matchReason: "Manual allocation approved for one job",
  supplierId: "supplier-stored",
  invoiceNumber: "INV-STORED",
  invoiceDate: "2026-01-15",
  detectedJobTags: ["SMITH-001"],
  supplierNameGuess: "Home Depot",
};

const fields = {
  invoiceNumber: "INV-FRESH",
  invoiceDate: "2026-02-01",
  totalCents: 99999,
  supplierNameGuess: "Different Supplier",
};

const matched = {
  status: "matched" as const,
  jobId: "job-fresh",
  jobTag: "WILSON-002",
  reason: "Found job tag WILSON-002 in PDF content",
};

describe("buildReprocessInvoiceUpdate", () => {
  it("keeps approved totalCents from the stored invoice, not fresh extract", () => {
    const update = buildReprocessInvoiceUpdate({
      approved: true,
      invoice,
      fields,
      match: matched,
      supplierId: "supplier-fresh",
      extractedText: "fresh ocr text",
    });

    expect(update.totalCents).toBe(invoice.totalCents);
    expect(update.totalCents).not.toBe(fields.totalCents);
    expect(update.jobId).toBe(invoice.jobId);
    expect(update.status).toBe(invoice.status);
    expect(update.matchReason).toBe(invoice.matchReason);
    expect(update.supplierId).toBe(invoice.supplierId);
    expect(update.invoiceNumber).toBe(invoice.invoiceNumber);
    expect(update.invoiceDate).toBe(invoice.invoiceDate);
    expect(update.detectedJobTags).toEqual(invoice.detectedJobTags);
    expect(update.supplierNameGuess).toBe(invoice.supplierNameGuess);
    expect(update.extractedText).toBe("fresh ocr text");
  });

  it("still refreshes money and assignment fields when not approved", () => {
    const update = buildReprocessInvoiceUpdate({
      approved: false,
      invoice,
      fields,
      match: matched,
      supplierId: "supplier-fresh",
      extractedText: "fresh ocr text",
    });

    expect(update.totalCents).toBe(fields.totalCents);
    expect(update.jobId).toBe(matched.jobId);
    expect(update.status).toBe("matched");
    expect(update.matchReason).toBe(matched.reason);
    expect(update.supplierId).toBe("supplier-fresh");
    expect(update.invoiceNumber).toBe(fields.invoiceNumber);
    expect(update.detectedJobTags).toEqual([matched.jobTag]);
    expect(update.supplierNameGuess).toBe(fields.supplierNameGuess);
  });

  it("maps needs_review when unapproved and match is ambiguous", () => {
    const update = buildReprocessInvoiceUpdate({
      approved: false,
      invoice,
      fields,
      match: {
        status: "needs_review",
        jobIds: ["a", "b"],
        tags: ["SMITH-001", "WILSON-002"],
        reason: "Found multiple job tags",
      },
      supplierId: null,
      extractedText: "text",
    });

    expect(update.status).toBe("needs_review");
    expect(update.jobId).toBeNull();
    expect(update.detectedJobTags).toEqual(["SMITH-001", "WILSON-002"]);
    expect(update.totalCents).toBe(fields.totalCents);
  });
});
