import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { extractEmailAddresses, inboundAddressFor } from "./email-ingest";

export async function findBusinessByInboundAddress(rawTo: string) {
  const addresses = extractEmailAddresses(rawTo);
  for (const address of addresses) {
    const [row] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.inboundAddress, address))
      .limit(1);
    if (row) return row;
  }

  const rows = await db.select({ id: businesses.id, inboundAddress: businesses.inboundAddress }).from(businesses);
  const match = rows.find((row) => addresses.includes(inboundAddressFor(row.id)));
  if (!match) return null;
  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, match.id))
    .limit(1);
  return business ?? null;
}
