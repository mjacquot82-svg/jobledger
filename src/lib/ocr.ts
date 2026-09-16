import { extractPdfText } from "./extract";

export type OcrProvider = "local_pdf" | "paid_disabled";

export async function runOcr(provider: OcrProvider, buffer: Buffer) {
  if (provider === "paid_disabled") {
    throw new Error("Paid OCR is not enabled for this business.");
  }
  return extractPdfText(buffer);
}
