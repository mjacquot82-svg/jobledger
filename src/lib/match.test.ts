import { describe, expect, it } from "vitest";
import {
  extractEmailAddresses,
  inboundAddressFor,
  isInvoiceAttachment,
} from "./email-ingest";
import { extractInvoiceFields, matchInvoiceJobs, matchJobs } from "./match";

const jobs = [
  { id: "1", jobTag: "SMITH-001" },
  { id: "2", jobTag: "WILSON-002" },
  { id: "3", jobTag: "CHEN-003" },
];

const withNumber = [
  ...jobs,
  { id: "4", jobTag: "104" },
  { id: "5", jobTag: null },
];

describe("matchJobs", () => {
  it("matches an emailed invoice to a job when exactly one valid tag is found", () => {
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

  it("matches a job tag in an email subject", () => {
    const result = matchJobs(
      "Invoice for SMITH-001\nPlease see attached\nscan.pdf",
      jobs,
    );
    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.jobTag).toBe("SMITH-001");
    }
  });

  it("matches a numeric job number with a hash", () => {
    const result = matchJobs("Invoice #104 from Home Depot", withNumber);
    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.jobId).toBe("4");
      expect(result.jobTag).toBe("104");
    }
  });

  it("matches job 104 wording", () => {
    const result = matchJobs("Please charge job 104", withNumber);
    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.jobTag).toBe("104");
    }
  });

  it("does not treat a dollar total as a job number", () => {
    const result = matchJobs("Home Depot\nTotal $104.00", withNumber);
    expect(result.status).toBe("unmatched");
  });

  it("does not match 104 inside 1040 or 104.00", () => {
    expect(matchJobs("PO 1040 extra digits", withNumber).status).toBe(
      "unmatched",
    );
    expect(matchJobs("Amount 104.00 CAD", withNumber).status).toBe("unmatched");
  });

  it("skips jobs with no tag instead of guessing from the name", () => {
    const result = matchJobs("Smith Garage materials", withNumber);
    expect(result.status).toBe("unmatched");
  });

  it("sends an uncertain emailed invoice to Needs Review", () => {
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
  it("uses the final invoice total rather than a subtotal", () => {
    expect(
      extractInvoiceFields("Subtotal $100.00\nTax $13.00\nTotal $113.00")
        .totalCents,
    ).toBe(11300);
  });
  it("pulls invoice number and total as cents", () => {
    const fields = extractInvoiceFields(
      "Home Depot\nInvoice INV-1001\nTotal $1,250.40",
    );
    expect(fields.invoiceNumber).toBe("INV-1001");
    expect(fields.totalCents).toBe(125040);
    expect(fields.supplierNameGuess).toBe("Home Depot");
  });

  it("pulls a normalized invoice date", () => {
    expect(
      extractInvoiceFields("Supplier\nInvoice INV-2\nInvoice Date: 09/03/2026")
        .invoiceDate,
    ).toBe("2026-09-03");
  });
});

describe("matchInvoiceJobs priority", () => {
  it("finds a job code in a product line inside PDF text", () => {
    const result = matchInvoiceJobs(
      {
        pdfText: "1  Cedar boards for SMITH-001  $120.00",
        emailSubject: "Invoice for WILSON-002",
      },
      jobs,
    );
    expect(result).toMatchObject({ status: "matched", jobId: "1", source: "PDF content" });
  });

  it("finds a job code in a PDF PO/reference field", () => {
    const result = matchInvoiceJobs(
      { pdfText: "PO / Reference: CHEN-003", filename: "SMITH-001.pdf" },
      jobs,
    );
    expect(result).toMatchObject({ status: "matched", jobId: "3", source: "PDF content" });
  });

  it("returns every valid PDF job code for review without using fallbacks", () => {
    const result = matchInvoiceJobs(
      {
        pdfText: "Fasteners SMITH-001\nTile adhesive WILSON-002",
        emailBody: "CHEN-003",
      },
      jobs,
    );
    expect(result).toMatchObject({
      status: "needs_review",
      tags: ["SMITH-001", "WILSON-002"],
      source: "PDF content",
    });
  });

  it("uses body, subject, and filename only as ordered fallbacks", () => {
    expect(
      matchInvoiceJobs(
        { pdfText: "No code", emailBody: "WILSON-002", emailSubject: "CHEN-003" },
        jobs,
      ),
    ).toMatchObject({ jobId: "2", source: "email body" });
    expect(
      matchInvoiceJobs(
        { pdfText: "No code", emailBody: "No code", emailSubject: "CHEN-003" },
        jobs,
      ),
    ).toMatchObject({ jobId: "3", source: "email subject" });
  });
});

describe("email ingest helpers", () => {
  it("builds a unique inbound address from the business id", () => {
    const address = inboundAddressFor("11111111-2222-3333-4444-555555555555");
    expect(address).toBe("invoices-111111112222@inbound.jobledger.local");
  });

  it("pulls the recipient out of a To header", () => {
    expect(
      extractEmailAddresses(
        `Jacquot Demo <invoices-abc@inbound.jobledger.local>, other@example.com`,
      ),
    ).toEqual([
      "invoices-abc@inbound.jobledger.local",
      "other@example.com",
    ]);
  });

  it("treats PDFs and photos as invoice-like attachments", () => {
    expect(
      isInvoiceAttachment({ filename: "bill.pdf", contentType: "application/pdf" }),
    ).toBe(true);
    expect(isInvoiceAttachment({ filename: "photo.JPG" })).toBe(true);
    expect(isInvoiceAttachment({ filename: "notes.txt" })).toBe(false);
  });
});
