import { timingSafeEqual } from "node:crypto";
import type { InboundEmail } from "./email-ingest";

export const CLOUDMAILIN_MESSAGE_LIMIT_BYTES = 512 * 1024;

function secureEqual(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function cloudMailinAuthorization(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

export function isCloudMailinAuthorized(
  authorization: string | null,
  username = process.env.CLOUDMAILIN_BASIC_USERNAME?.trim() ?? "",
  password = process.env.CLOUDMAILIN_BASIC_PASSWORD ?? "",
) {
  if (!username || !password || !authorization) return false;
  return secureEqual(
    authorization,
    cloudMailinAuthorization(username, password),
  );
}

function firstString(form: FormData, ...keys: string[]) {
  for (const key of keys) {
    const value = form.get(key);
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

export async function parseCloudMailinForm(form: FormData): Promise<InboundEmail> {
  const attachments = [];
  for (const [key, value] of form.entries()) {
    if (value instanceof File && /^attachments(?:\[\d*\])?$/.test(key)) {
      attachments.push({
        filename: value.name,
        contentType: value.type,
        buffer: Buffer.from(await value.arrayBuffer()),
      });
    }
  }

  const recipients = [...form.entries()]
    .filter(
      ([key, value]) =>
        typeof value === "string" &&
        /^envelope\[recipients\]\[\d+\]$/.test(key),
    )
    .map(([, value]) => String(value));
  const envelopeTo = firstString(form, "envelope[to]");

  return {
    // SMTP envelope recipients are authoritative. Header To may only contain
    // the original supplier/customer address after a forwarded message.
    to: [...recipients, envelopeTo].filter(Boolean).join(", "),
    from: firstString(form, "envelope[from]", "headers[from]"),
    subject: firstString(form, "headers[subject]"),
    text: firstString(form, "plain", "reply_plain"),
    provider: "forwarding",
    providerMessageId: firstString(
      form,
      "headers[message_id]",
      "headers[message-id]",
    ),
    attachments,
  };
}

export function attachmentBytes(email: InboundEmail) {
  return email.attachments.reduce(
    (total, attachment) => total + attachment.buffer.byteLength,
    0,
  );
}
