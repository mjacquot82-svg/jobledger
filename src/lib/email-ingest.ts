/**
 * Future inbound email ingest. Not connected.
 *
 * Planned adapters:
 * - Gmail API + gmail.readonly + Pub/Sub users.watch (renew daily)
 * - Microsoft Graph Mail.Read delegated subscriptions (~7 days)
 *
 * Each business gets a unique inbound address. Until a real mailbox is
 * authorized, JobLedger only shows that address and accepts PDF uploads.
 */
export function inboundAddressFor(businessId: string) {
  const short = businessId.replaceAll("-", "").slice(0, 12);
  return `invoices-${short}@inbound.jobledger.local`;
}

export function emailIngestStatus() {
  return {
    connected: false,
    reason: "No mailbox connected. Upload PDFs until email ingest is authorized.",
  };
}
