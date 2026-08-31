import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export function hashBuffer(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function storeInvoiceFile(
  businessId: string,
  invoiceId: string,
  buffer: Buffer,
  filename: string,
) {
  const ext = path.extname(filename).toLowerCase() || ".pdf";
  const dir = path.join(process.cwd(), ".data", "invoices", businessId);
  await mkdir(dir, { recursive: true });
  const storedPath = path.join(dir, `${invoiceId}${ext}`);
  await writeFile(storedPath, buffer);
  return storedPath;
}
