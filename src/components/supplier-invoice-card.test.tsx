import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SupplierInvoiceCard } from "./supplier-invoice-card";

describe("SupplierInvoiceCard", () => {
  it("renders useful invoice data and phone-friendly actions", () => {
    const html = renderToStaticMarkup(
      <SupplierInvoiceCard
        categories={[{ id: "materials", name: "Materials" }]}
        currentJobId="job-1"
        editAction={async () => {}}
        invoice={{
          id: "invoice-1",
          status: "matched",
          originalFilename: "invoice.pdf",
          invoiceNumber: "INV-100",
          invoiceDate: "2026-09-03",
          totalCents: 1234,
          supplierName: "Supplier Ltd.",
          postedAmountCents: 1200,
          costCategoryId: "materials",
          costCategoryName: "Materials",
        }}
        jobs={[{ id: "job-1", name: "Smith Garage", jobTag: "SMITH-001" }]}
      />,
    );
    expect(html).toContain("Supplier Ltd.");
    expect(html).toContain("INV-100");
    expect(html).toContain("Sep 3, 2026");
    expect(html).toContain("View invoice");
    expect(html).toContain("Download");
    expect(html).toContain("Edit assignment");
    expect(html).toContain("grid-cols-2");
    expect(html).toContain("min-h-11");
    expect(html).not.toContain("/private/");
  });
});
