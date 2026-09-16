import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CLOUDMAILIN_MESSAGE_LIMIT_BYTES, cloudMailinAuthorization } from "@/lib/cloudmailin";

const mocks = vi.hoisted(() => ({
  findBusiness: vi.fn(),
  ingest: vi.fn(),
}));

vi.mock("@/lib/inbound-routing", () => ({
  findBusinessByInboundAddress: mocks.findBusiness,
}));
vi.mock("@/lib/ingest", () => ({
  ingestInvoiceAttachment: mocks.ingest,
}));

import { POST } from "./route";

const address = "jobledger-test@cloudmailin.net";

function delivery(options: {
  to?: string;
  attachment?: ArrayBuffer | string;
  filename?: string;
  messageId?: string;
  subject?: string;
} = {}) {
  const form = new FormData();
  form.set("envelope[to]", options.to ?? address);
  form.set("envelope[recipients][0]", options.to ?? address);
  form.set("envelope[from]", "supplier@example.com");
  form.set("headers[subject]", options.subject ?? "Invoice SMITH-001");
  form.set("headers[message_id]", options.messageId ?? "<message-1@example.com>");
  form.set("plain", "Forwarded supplier invoice");
  if (options.attachment !== undefined) {
    form.set(
      "attachments[0]",
      new File([options.attachment], options.filename ?? "invoice.pdf", {
        type: "application/pdf",
      }),
    );
  }
  return new NextRequest("https://staging.example/api/inbound/email", {
    method: "POST",
    headers: {
      authorization: cloudMailinAuthorization("staging", "secret-password"),
    },
    body: form,
  });
}

describe("CloudMailin inbound endpoint", () => {
  beforeEach(() => {
    process.env.CLOUDMAILIN_BASIC_USERNAME = "staging";
    process.env.CLOUDMAILIN_BASIC_PASSWORD = "secret-password";
    mocks.findBusiness.mockReset().mockResolvedValue({ id: "business-1" });
    mocks.ingest.mockReset().mockResolvedValue({ id: "invoice-1", duplicate: false });
  });

  it("accepts a valid normalized multipart PDF delivery", async () => {
    const response = await POST(delivery({ attachment: "small pdf" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      invoices: [{ id: "invoice-1", duplicate: false, filename: "invoice.pdf" }],
    });
    expect(mocks.ingest).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "business-1",
        source: "email",
        email: expect.objectContaining({
          providerMessageId: "<message-1@example.com>",
        }),
      }),
    );
  });

  it("ignores an unknown recipient without crossing tenants", async () => {
    mocks.findBusiness.mockResolvedValue(null);
    const response = await POST(
      delivery({ to: "unknown@cloudmailin.net", attachment: "small pdf" }),
    );
    expect(await response.json()).toMatchObject({
      invoices: [],
      ignored: "unknown inbound address",
    });
    expect(mocks.ingest).not.toHaveBeenCalled();
  });

  it("acknowledges a delivery with no attachment", async () => {
    const response = await POST(delivery());
    expect(await response.json()).toMatchObject({
      invoices: [],
      ignored: "no invoice attachment",
    });
  });

  it("rejects an oversized attachment", async () => {
    const response = await POST(
      delivery({
        attachment: new ArrayBuffer(CLOUDMAILIN_MESSAGE_LIMIT_BYTES + 1),
      }),
    );
    expect(response.status).toBe(413);
    expect(mocks.ingest).not.toHaveBeenCalled();
  });

  it("reports a duplicate provider email without importing it twice", async () => {
    mocks.ingest.mockResolvedValue({ id: "existing-email", duplicate: true });
    const response = await POST(
      delivery({ attachment: "small pdf", messageId: "<already-seen@example.com>" }),
    );
    expect(await response.json()).toMatchObject({
      invoices: [{ id: "existing-email", duplicate: true }],
    });
  });

  it("reports a duplicate invoice file without importing it twice", async () => {
    mocks.ingest.mockResolvedValue({ id: "existing-invoice", duplicate: true });
    const response = await POST(
      delivery({ attachment: "identical invoice bytes", messageId: "<new-email@example.com>" }),
    );
    expect(await response.json()).toMatchObject({
      invoices: [{ id: "existing-invoice", duplicate: true }],
    });
  });
});
