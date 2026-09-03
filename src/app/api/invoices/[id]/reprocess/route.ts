import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { reprocessStoredInvoice } from "@/lib/ingest";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  const businessId = session?.user.businessId;
  if (!businessId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await reprocessStoredInvoice({
    businessId,
    invoiceId: (await params).id,
  });
  if (!result) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (!result.ok) {
    return NextResponse.json(result, { status: 422 });
  }
  return NextResponse.json(result);
}
