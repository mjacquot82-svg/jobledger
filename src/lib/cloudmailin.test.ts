import { describe, expect, it } from "vitest";
import {
  attachmentBytes,
  CLOUDMAILIN_MESSAGE_LIMIT_BYTES,
  cloudMailinAuthorization,
  isCloudMailinAuthorized,
  parseCloudMailinForm,
} from "./cloudmailin";

describe("CloudMailin Multipart - Normalized", () => {
  it("authenticates its supported Authorization header securely", () => {
    const header = cloudMailinAuthorization("staging", "long-password");
    expect(
      isCloudMailinAuthorized(header, "staging", "long-password"),
    ).toBe(true);
    expect(isCloudMailinAuthorized(header, "staging", "wrong")).toBe(false);
    expect(isCloudMailinAuthorized(null, "staging", "long-password")).toBe(
      false,
    );
  });

  it("parses envelope routing, normalized headers, and attachments", async () => {
    const form = new FormData();
    form.set("envelope[to]", "invoice-address@cloudmailin.net");
    form.set("envelope[recipients][0]", "invoice-address@cloudmailin.net");
    form.set("envelope[from]", "supplier@example.com");
    form.set("headers[subject]", "Invoice SMITH-001");
    form.set("headers[message_id]", "<message-1@example.com>");
    form.set("plain", "Please see attached");
    form.set(
      "attachments[0]",
      new File(["pdf bytes"], "invoice.pdf", { type: "application/pdf" }),
    );

    const email = await parseCloudMailinForm(form);
    expect(email.to).toContain("invoice-address@cloudmailin.net");
    expect(email.from).toBe("supplier@example.com");
    expect(email.subject).toBe("Invoice SMITH-001");
    expect(email.providerMessageId).toBe("<message-1@example.com>");
    expect(email.attachments[0]).toMatchObject({
      filename: "invoice.pdf",
      contentType: "application/pdf",
    });
  });

  it("detects an attachment over the free-plan limit", () => {
    const email = {
      to: "invoice-address@cloudmailin.net",
      provider: "forwarding" as const,
      attachments: [
        {
          filename: "large.pdf",
          buffer: Buffer.alloc(CLOUDMAILIN_MESSAGE_LIMIT_BYTES + 1),
        },
      ],
    };
    expect(attachmentBytes(email)).toBeGreaterThan(
      CLOUDMAILIN_MESSAGE_LIMIT_BYTES,
    );
  });
});
