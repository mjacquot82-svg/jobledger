import { describe, expect, it } from "vitest";
import { extractInvoiceFields, matchJobs } from "./match";

const jobs = [
  { id: "1", jobTag: "SMITH-001" },
  { id: "2", jobTag: "WILSON-002" },
  { id: "3", jobTag: "CHEN-003" },
];

describe("matchJobs", () => {
  it("matches a single job tag in PDF text", () => {
    const result = matchJobs("Home Depot invoice for SMITH-001\nTotal $250.00", jobs);
    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.jobId).toBe("1");
      expect(result.jobTag).toBe("SMITH-001");
    }
  });

  it("matches a job tag in the filename", () => {
    const result = matchJobs("SMITH-001-home-depot.pdf", jobs);
    expect(result.status).toBe("matched");
  });

  it("sends multiple tags to needs review instead of guessing", () => {
    const result = matchJobs("Charge to SMITH-001 and WILSON-002", jobs);
    expect(result.status).toBe("needs_review");
    if (result.status === "needs_review") {
      expect(result.tags).toEqual(["SMITH-001", "WILSON-002"]);
    }
  });

  it("does not match a partial tag", () => {
    const result = matchJobs("SMITH-0011 extra digits", jobs);
    expect(result.status).toBe("unmatched");
  });

  it("stays unmatched when no tag is present", () => {
    const result = matchJobs("Invoice 99 from a supplier", jobs);
    expect(result.status).toBe("unmatched");
  });
});

describe("extractInvoiceFields", () => {
  it("pulls invoice number and total as cents", () => {
    const fields = extractInvoiceFields(
      "Home Depot\nInvoice INV-1001\nTotal $1,250.40",
    );
    expect(fields.invoiceNumber).toBe("INV-1001");
    expect(fields.totalCents).toBe(125040);
    expect(fields.supplierNameGuess).toBe("Home Depot");
  });
});
