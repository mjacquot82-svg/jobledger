import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInvoiceFile } from "@/lib/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  const businessId = session?.user.businessId;
  if (!businessId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const invoice = await getInvoiceFile(businessId, (await params).id);
  if (!invoice) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const file = await readFile(invoice.storedPath);
    const filename = invoice.originalFilename.replace(/["\r\n]/g, "_");
    return new NextResponse(file, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${filename}"`,
        "cache-control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "file unavailable" }, { status: 404 });
  }
}
