import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { extractEmailAddresses } from "./email-ingest";

export async function findBusinessByInboundAddress(rawTo: string) {
  for (const address of extractEmailAddresses(rawTo)) {
    const [row] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.inboundAddress, address))
      .limit(1);
    if (row) return row;
  }
  return null;
}
