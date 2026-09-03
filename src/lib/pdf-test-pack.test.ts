import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractPdfText } from "./extract";
import { hashBuffer } from "./storage";
import { extractInvoiceFields, matchInvoiceJobs } from "./match";

const root = path.join(process.cwd(), "fixtures", "cloudmailin-test-pack");
const jobs = [
  { id: "smith", jobTag: "SMITH-001" },
  { id: "wilson", jobTag: "WILSON-002" },
  { id: "chen", jobTag: "CHEN-003" },
];

async function readInvoice(name: string) {
  const buffer = await readFile(path.join(root, name));
  return { buffer, text: await extractPdfText(buffer) };
}

describe("fictional PDF matching pack", () => {
  it("matches a code found only in a PDF product line and extracts its total", async () => {
    const { text } = await readInvoice("01-line-item-single.pdf");
    expect(matchInvoiceJobs({ pdfText: text }, jobs)).toMatchObject({
      status: "matched",
      jobId: "smith",
      source: "PDF content",
    });
    expect(extractInvoiceFields(text)).toMatchObject({
      invoiceNumber: "INV-LINE-1001",
      invoiceDate: "2026-09-01",
      totalCents: 9000,
    });
  });

  it("matches a code in a PDF PO/reference field", async () => {
    const { text } = await readInvoice("02-po-reference.pdf");
    expect(matchInvoiceJobs({ pdfText: text }, jobs)).toMatchObject({
      status: "matched",
      jobId: "wilson",
      source: "PDF content",
    });
    expect(extractInvoiceFields(text).totalCents).toBe(15000);
  });

  it("places two product-line codes into review and returns both", async () => {
    const { text } = await readInvoice("03-two-product-lines.pdf");
    expect(matchInvoiceJobs({ pdfText: text }, jobs)).toMatchObject({
      status: "needs_review",
      tags: ["SMITH-001", "WILSON-002"],
      source: "PDF content",
    });
    expect(extractInvoiceFields(text).totalCents).toBe(10000);
  });

  it("places a PDF with no job code into review", async () => {
    const { text } = await readInvoice("04-no-job-code.pdf");
    expect(matchInvoiceJobs({ pdfText: text }, jobs)).toMatchObject({
      status: "unmatched",
    });
    expect(extractInvoiceFields(text).totalCents).toBe(7500);
  });

  it("contains a byte-identical duplicate invoice", async () => {
    const original = await readFile(path.join(root, "01-line-item-single.pdf"));
    const duplicate = await readFile(
      path.join(root, "05-duplicate-of-line-item.pdf"),
    );
    expect(hashBuffer(duplicate)).toBe(hashBuffer(original));
  });

  it("keeps every PDF comfortably below the CloudMailin limit", async () => {
    for (const name of [
      "01-line-item-single.pdf",
      "02-po-reference.pdf",
      "03-two-product-lines.pdf",
      "04-no-job-code.pdf",
      "05-duplicate-of-line-item.pdf",
    ]) {
      expect((await readFile(path.join(root, name))).byteLength).toBeLessThan(
        10 * 1024,
      );
    }
  });
});
