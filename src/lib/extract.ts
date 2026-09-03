export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdf = (await import("pdf-parse")).default as (
      data: Buffer,
    ) => Promise<{ text: string }>;
    const result = await pdf(buffer);
    return (result.text ?? "").trim();
  } catch (error) {
    console.error("PDF text extraction failed", error);
    return "";
  }
}
