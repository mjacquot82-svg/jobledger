/**
 * Provider-neutral email ingest.
 *
 * Front doors (all feed the same invoice pipeline):
 * - Connect Email (preferred UX): platform-owned Google and Microsoft OAuth. Not wired yet.
 * - Forwarding: unique inbound address per business. Webhook is live for local proof.
 *
 * Customers never create a Google Cloud or Azure project.
 */

export type MailboxProvider = "google" | "microsoft" | "forwarding" | "other";

export type InboundAttachment = {
  filename: string;
  contentType?: string;
  buffer: Buffer;
};

export type InboundEmail = {
  to: string;
  from?: string;
  subject?: string;
  text?: string;
  provider: MailboxProvider;
  providerMessageId?: string;
  attachments: InboundAttachment[];
};

export function inboundDomain() {
  return process.env.INBOUND_DOMAIN?.trim() || "inbound.jobledger.local";
}

export function inboundAddressFor(businessId: string) {
  const short = businessId.replaceAll("-", "").slice(0, 12).toLowerCase();
  return `invoices-${short}@${inboundDomain()}`;
}

export function extractEmailAddresses(raw: string) {
  const matches = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  return [...new Set(matches.map((value) => value.toLowerCase()))];
}

export function isInvoiceAttachment(opts: {
  filename: string;
  contentType?: string;
}) {
  const name = opts.filename.toLowerCase();
  const type = (opts.contentType ?? "").toLowerCase();
  return (
    name.endsWith(".pdf") ||
    type.includes("pdf") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    type.startsWith("image/")
  );
}

export function emailIngestStatus(connectedProvider?: string | null) {
  if (connectedProvider) {
    return {
      connected: true,
      reason: `Connected via ${connectedProvider}. New invoice mail is processed automatically.`,
    };
  }
  return {
    connected: false,
    reason:
      "Connect Email is the recommended option (Gmail, Outlook, Hotmail, Microsoft 365). We own the connection. Forwarding to the address above also works. Neither live mailbox is on yet; the inbound webhook is for local proof.",
  };
}
