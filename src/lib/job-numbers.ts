import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { requireBusinessId } from "./queries";

export async function nextJobNumber(businessId: string) {
  const id = requireBusinessId(businessId);
  const rows = await db
    .select({ jobTag: jobs.jobTag })
    .from(jobs)
    .where(eq(jobs.businessId, id));
  const numbers = rows
    .map((row) => row.jobTag?.trim() ?? "")
    .filter((tag) => /^\d+$/.test(tag))
    .map((tag) => Number(tag));
  const max = numbers.length ? Math.max(...numbers) : 100;
  return String(Math.max(max + 1, 101));
}
