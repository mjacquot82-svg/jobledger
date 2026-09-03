import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { extractEmailAddresses, inboundAddressFor } from "./email-ingest";

export async function findBusinessByInboundAddress(rawTo: string) {
  const addresses = extractEmailAddresses(rawTo);
  const rows = await db.select().from(businesses);
  const matches = rows.filter((row) => {
    const configured = row.inboundAddress?.toLowerCase();
    const expected = configured || inboundAddressFor(row.id);
    return addresses.includes(expected);
  });
  const unique = [...new Map(matches.map((row) => [row.id, row])).values()];

  // A delivery naming multiple tenants is never safe to assign automatically.
  if (unique.length !== 1) return null;
  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, unique[0].id))
    .limit(1);
  return business ?? null;
}
