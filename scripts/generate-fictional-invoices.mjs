import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";

const output = path.join(process.cwd(), "fixtures", "cloudmailin-test-pack");
const fixedDate = new Date("2026-09-01T00:00:00Z");

async function makePdf(lines) {
  const document = await PDFDocument.create();
  document.setTitle("Fictional JobLedger test invoice");
  document.setAuthor("JobLedger test suite");
  document.setCreationDate(fixedDate);
  document.setModificationDate(fixedDate);
  const page = document.addPage([612, 792]);
  const font = await document.embedFont(StandardFonts.Helvetica);
  let y = 750;
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: 11, font });
    y -= 20;
  }
  return document.save({ useObjectStreams: false });
}

const lineItem = await makePdf([
  "Fictional North Supply",
  "Invoice INV-LINE-1001",
  "Invoice Date: 2026-09-01",
  "Description                         Qty     Amount",
  "Deck screws for SMITH-001             2      45.00",
  "Total $90.00",
]);

const files = {
  "01-line-item-single.pdf": lineItem,
  "02-po-reference.pdf": await makePdf([
    "Example Builders Merchant",
    "Invoice INV-PO-1002",
    "Invoice Date: 2026-09-02",
    "Purchase Order / Reference: WILSON-002",
    "General building materials                 150.00",
    "Total $150.00",
  ]),
  "03-two-product-lines.pdf": await makePdf([
    "Fictional Trade Counter",
    "Invoice INV-SPLIT-1003",
    "Invoice Date: 2026-09-03",
    "Fasteners for SMITH-001                      40.00",
    "Tile adhesive for WILSON-002                 60.00",
    "Total $100.00",
  ]),
  "04-no-job-code.pdf": await makePdf([
    "Sample Hardware Company",
    "Invoice INV-REVIEW-1004",
    "Invoice Date: 2026-09-04",
    "Assorted site supplies                       75.00",
    "Total $75.00",
  ]),
  "05-duplicate-of-line-item.pdf": lineItem,
};

await mkdir(output, { recursive: true });
await Promise.all(
  Object.entries(files).map(([name, contents]) =>
    writeFile(path.join(output, name), contents),
  ),
);
