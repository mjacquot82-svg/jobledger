import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  costCategories,
  customers,
  jobCosts,
  jobs,
  businesses,
} from "@/db/schema";

export function requireBusinessId(businessId: string | null | undefined) {
  if (!businessId) {
    throw new Error("business_id is required on every query");
  }
  return businessId;
}

export async function getBusiness(businessId: string) {
  const id = requireBusinessId(businessId);
  const [row] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, id))
    .limit(1);
  return row ?? null;
}

export async function listJobs(businessId: string) {
  const id = requireBusinessId(businessId);
  return db
    .select({
      id: jobs.id,
      name: jobs.name,
      jobTag: jobs.jobTag,
      status: jobs.status,
      customerName: customers.name,
      createdAt: jobs.createdAt,
    })
    .from(jobs)
    .innerJoin(customers, eq(customers.id, jobs.customerId))
    .where(and(eq(jobs.businessId, id), eq(customers.businessId, id)))
    .orderBy(desc(jobs.createdAt));
}

export async function getJob(businessId: string, jobId: string) {
  const id = requireBusinessId(businessId);
  const [row] = await db
    .select({
      id: jobs.id,
      name: jobs.name,
      jobTag: jobs.jobTag,
      status: jobs.status,
      notes: jobs.notes,
      addressLine1: jobs.addressLine1,
      customerId: jobs.customerId,
      customerName: customers.name,
      customerAddress: customers.addressLine1,
    })
    .from(jobs)
    .innerJoin(customers, eq(customers.id, jobs.customerId))
    .where(
      and(eq(jobs.businessId, id), eq(jobs.id, jobId), eq(customers.businessId, id)),
    )
    .limit(1);
  return row ?? null;
}

export async function listCustomers(businessId: string) {
  const id = requireBusinessId(businessId);
  return db
    .select()
    .from(customers)
    .where(eq(customers.businessId, id))
    .orderBy(customers.name);
}

export async function getCustomer(businessId: string, customerId: string) {
  const id = requireBusinessId(businessId);
  const [row] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.businessId, id), eq(customers.id, customerId)))
    .limit(1);
  return row ?? null;
}

export async function listCostCategories(businessId: string) {
  const id = requireBusinessId(businessId);
  return db
    .select()
    .from(costCategories)
    .where(eq(costCategories.businessId, id))
    .orderBy(costCategories.sortOrder);
}

export async function jobCategoryTotals(businessId: string, jobId: string) {
  const id = requireBusinessId(businessId);
  const categories = await listCostCategories(id);
  const totals = await db
    .select({
      categoryId: jobCosts.categoryId,
      totalCents: sql<number>`coalesce(sum(${jobCosts.amountCents}), 0)`,
    })
    .from(jobCosts)
    .where(and(eq(jobCosts.businessId, id), eq(jobCosts.jobId, jobId)))
    .groupBy(jobCosts.categoryId);

  const byCategory = new Map(
    totals.map((row) => [row.categoryId, Number(row.totalCents)]),
  );

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    totalCents: byCategory.get(category.id) ?? 0,
  }));
}

export async function countActiveJobs(businessId: string) {
  const id = requireBusinessId(businessId);
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobs)
    .where(and(eq(jobs.businessId, id), eq(jobs.status, "active")));
  return Number(row?.count ?? 0);
}
