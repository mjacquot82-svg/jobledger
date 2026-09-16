export async function extractPdfText(buffer: Buffer): Promise<string> {
  let parser: { getText(): Promise<{ text: string }>; destroy(): Promise<void> } | undefined;
  try {
    const { PDFParse } = await import("pdf-parse");
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return (result.text ?? "").trim();
  } catch (error) {
    console.error("PDF text extraction failed", error);
    return "";
  } finally {
    await parser?.destroy();
  }
}
