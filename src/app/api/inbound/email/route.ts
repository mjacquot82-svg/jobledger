import { NextRequest, NextResponse } from "next/server";
import {
  extractEmailAddresses,
  isInvoiceAttachment,
  type InboundAttachment,
  type MailboxProvider,
} from "@/lib/email-ingest";
import { findBusinessByInboundAddress } from "@/lib/inbound-routing";
import { ingestInvoiceAttachment } from "@/lib/ingest";

function webhookSecret() {
  return process.env.INBOUND_WEBHOOK_SECRET?.trim() ?? "";
}

function isAuthorized(request: NextRequest) {
  const secret = webhookSecret();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  const alt = request.headers.get("x-inbound-secret");
  return header === `Bearer ${secret}` || alt === secret;
}

function isPdf(attachment: InboundAttachment) {
  const name = attachment.filename.toLowerCase();
  const type = (attachment.contentType ?? "").toLowerCase();
  return name.endsWith(".pdf") || type.includes("pdf");
}

async function parseBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      to?: string;
      from?: string;
      subject?: string;
      text?: string;
      provider?: MailboxProvider;
      providerMessageId?: string;
      attachments?: {
        filename?: string;
        contentType?: string;
        contentBase64?: string;
      }[];
    };
    const attachments: InboundAttachment[] = (body.attachments ?? [])
      .filter((item) => item.filename && item.contentBase64)
      .map((item) => ({
        filename: item.filename as string,
        contentType: item.contentType,
        buffer: Buffer.from(item.contentBase64 as string, "base64"),
      }));
    return {
      to: body.to ?? "",
      from: body.from,
      subject: body.subject,
      text: body.text,
      provider: body.provider ?? ("forwarding" as const),
      providerMessageId: body.providerMessageId,
      attachments,
    };
  }

  const form = await request.formData();
  const attachments: InboundAttachment[] = [];
  for (const [key, value] of form.entries()) {
    if (
      value instanceof File &&
      (key === "file" || key === "attachment" || key === "attachments")
    ) {
      attachments.push({
        filename: value.name,
        contentType: value.type,
        buffer: Buffer.from(await value.arrayBuffer()),
      });
    }
  }
  return {
    to: String(form.get("to") ?? ""),
    from: String(form.get("from") ?? "") || undefined,
    subject: String(form.get("subject") ?? "") || undefined,
    text: String(form.get("text") ?? "") || undefined,
    provider: (String(form.get("provider") ?? "forwarding") ||
      "forwarding") as MailboxProvider,
    providerMessageId: String(form.get("providerMessageId") ?? "") || undefined,
    attachments,
  };
}

export async function POST(request: NextRequest) {
  if (!webhookSecret()) {
    return NextResponse.json(
      { ok: false, error: "inbound not configured" },
      { status: 503 },
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const inbound = await parseBody(request);
  if (!extractEmailAddresses(inbound.to).length) {
    return NextResponse.json({ ok: true, invoices: [], ignored: "no recipient" });
  }

  const business = await findBusinessByInboundAddress(inbound.to);
  if (!business) {
    return NextResponse.json({
      ok: true,
      invoices: [],
      ignored: "unknown inbound address",
    });
  }

  const invoiceLike = inbound.attachments.filter(isInvoiceAttachment);
  const pdfs = invoiceLike.filter(isPdf);
  if (!pdfs.length) {
    return NextResponse.json({
      ok: true,
      invoices: [],
      ignored: invoiceLike.length
        ? "image attachments need paid OCR"
        : "no invoice attachment",
    });
  }

  const invoices = [];
  for (const [index, attachment] of pdfs.entries()) {
    const messageId =
      inbound.providerMessageId && pdfs.length > 1
        ? `${inbound.providerMessageId}:${index}`
        : inbound.providerMessageId;
    const result = await ingestInvoiceAttachment({
      businessId: business.id,
      filename: attachment.filename,
      buffer: attachment.buffer,
      source: "email",
      email: {
        provider: inbound.provider || "forwarding",
        providerMessageId: messageId,
        subject: inbound.subject,
        from: inbound.from,
        text: inbound.text,
      },
    });
    invoices.push({ ...result, filename: attachment.filename });
  }

  return NextResponse.json({ ok: true, invoices });
}
