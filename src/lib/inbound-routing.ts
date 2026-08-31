import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { extractEmailAddresses } from "./email-ingest";

export async function findBusinessByInboundAddress(rawTo: string) {
  const addresses = extractEmailAddresses(rawTo);
  if (!addresses.length) return null;

  const rows = await db.select().from(businesses);
  return (
    rows.find(
      (row) =>
        row.inboundAddress &&
        addresses.includes(row.inboundAddress.toLowerCase()),
    ) ?? null
  );
}
