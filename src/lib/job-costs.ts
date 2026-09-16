import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { costCategories, jobCosts } from "@/db/schema";
import { dollarsToCents } from "./money";
import { requireBusinessId } from "./queries";

export async function listJobCosts(businessId: string, jobId: string) {
  const id = requireBusinessId(businessId);
  return db
    .select({
      id: jobCosts.id,
      amountCents: jobCosts.amountCents,
      sourceType: jobCosts.sourceType,
      notes: jobCosts.notes,
      categoryName: costCategories.name,
      createdAt: jobCosts.createdAt,
    })
    .from(jobCosts)
    .innerJoin(costCategories, eq(costCategories.id, jobCosts.categoryId))
    .where(and(eq(jobCosts.businessId, id), eq(jobCosts.jobId, jobId)))
    .orderBy(desc(jobCosts.createdAt));
}

export async function addManualCost(opts: {
  businessId: string;
  jobId: string;
  categoryId: string;
  amount: string;
  notes?: string;
}) {
  const businessId = requireBusinessId(opts.businessId);
  const amountCents = dollarsToCents(opts.amount);
  if (amountCents <= 0) return;
  await db.insert(jobCosts).values({
    businessId,
    jobId: opts.jobId,
    categoryId: opts.categoryId,
    amountCents,
    sourceType: "manual",
    notes: opts.notes || null,
  });
}
