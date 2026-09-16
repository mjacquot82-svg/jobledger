import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  businesses,
  costCategories,
  customers,
  invoices,
  jobCosts,
  jobs,
  suppliers,
} from "@/db/schema";
import { requireBusinessId } from "./tenant";
import { invoiceBelongsToJob } from "./invoice-cost-sync";

export { requireBusinessId };

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

export async function countNeedsReview(businessId: string) {
  const id = requireBusinessId(businessId);
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoices)
    .where(
      and(
        eq(invoices.businessId, id),
        inArray(invoices.status, [
          "needs_review",
          "unmatched",
          "duplicate",
          "failed",
        ]),
      ),
    );
  return Number(row?.count ?? 0);
}

export async function listInvoices(businessId: string) {
  const id = requireBusinessId(businessId);
  return db
    .select({
      id: invoices.id,
      status: invoices.status,
      originalFilename: invoices.originalFilename,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      totalCents: invoices.totalCents,
      detectedJobTags: invoices.detectedJobTags,
      allocationsApprovedAt: invoices.allocationsApprovedAt,
      matchReason: invoices.matchReason,
      jobName: jobs.name,
      jobTag: jobs.jobTag,
      supplierName: suppliers.name,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .leftJoin(jobs, eq(jobs.id, invoices.jobId))
    .leftJoin(suppliers, eq(suppliers.id, invoices.supplierId))
    .where(eq(invoices.businessId, id))
    .orderBy(desc(invoices.createdAt));
}

export async function listInvoiceAllocations(
  businessId: string,
  invoiceId: string,
) {
  const id = requireBusinessId(businessId);
  return db
    .select({
      id: jobCosts.id,
      jobId: jobCosts.jobId,
      jobName: jobs.name,
      jobTag: jobs.jobTag,
      categoryId: jobCosts.categoryId,
      categoryName: costCategories.name,
      amountCents: jobCosts.amountCents,
    })
    .from(jobCosts)
    .innerJoin(
      jobs,
      and(eq(jobs.id, jobCosts.jobId), eq(jobs.businessId, id)),
    )
    .innerJoin(
      costCategories,
      and(
        eq(costCategories.id, jobCosts.categoryId),
        eq(costCategories.businessId, id),
      ),
    )
    .where(
      and(
        eq(jobCosts.businessId, id),
        eq(jobCosts.invoiceId, invoiceId),
      ),
    )
    .orderBy(jobs.name);
}

export async function getInvoice(businessId: string, invoiceId: string) {
  const id = requireBusinessId(businessId);
  const [row] = await db
    .select({
      id: invoices.id,
      status: invoices.status,
      originalFilename: invoices.originalFilename,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      detectedJobTags: invoices.detectedJobTags,
      allocationsApprovedAt: invoices.allocationsApprovedAt,
      totalCents: invoices.totalCents,
      matchReason: invoices.matchReason,
      extractedText: invoices.extractedText,
      supplierNameGuess: invoices.supplierNameGuess,
      jobId: invoices.jobId,
      jobName: jobs.name,
      jobTag: jobs.jobTag,
      supplierName: suppliers.name,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .leftJoin(jobs, eq(jobs.id, invoices.jobId))
    .leftJoin(suppliers, eq(suppliers.id, invoices.supplierId))
    .where(and(eq(invoices.businessId, id), eq(invoices.id, invoiceId)))
    .limit(1);
  return row ?? null;
}

export async function getInvoiceFile(businessId: string, invoiceId: string) {
  const id = requireBusinessId(businessId);
  const [row] = await db
    .select({
      storedPath: invoices.storedPath,
      originalFilename: invoices.originalFilename,
    })
    .from(invoices)
    .where(and(eq(invoices.businessId, id), eq(invoices.id, invoiceId)))
    .limit(1);
  return row ?? null;
}

export async function listJobInvoices(businessId: string, jobId: string) {
  const id = requireBusinessId(businessId);
  const rows = await db
    .select({
      id: invoices.id,
      businessId: invoices.businessId,
      jobId: invoices.jobId,
      status: invoices.status,
      originalFilename: invoices.originalFilename,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      totalCents: invoices.totalCents,
      supplierName: suppliers.name,
      allocatedJobId: jobCosts.jobId,
      postedAmountCents: jobCosts.amountCents,
      costCategoryId: jobCosts.categoryId,
      costCategoryName: costCategories.name,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .leftJoin(
      suppliers,
      and(eq(suppliers.id, invoices.supplierId), eq(suppliers.businessId, id)),
    )
    .leftJoin(
      jobCosts,
      and(
        eq(jobCosts.invoiceId, invoices.id),
        eq(jobCosts.businessId, id),
        eq(jobCosts.jobId, jobId),
      ),
    )
    .leftJoin(
      costCategories,
      and(
        eq(costCategories.id, jobCosts.categoryId),
        eq(costCategories.businessId, id),
      ),
    )
    .where(
      and(
        eq(invoices.businessId, id),
        or(eq(invoices.jobId, jobId), eq(jobCosts.jobId, jobId)),
      ),
    )
    .orderBy(desc(invoices.createdAt));
  return rows.filter((invoice) => invoiceBelongsToJob(invoice, id, jobId));
}

export async function findInvoiceByHash(businessId: string, contentHash: string) {
  const id = requireBusinessId(businessId);
  const [row] = await db
    .select({ id: invoices.id, status: invoices.status })
    .from(invoices)
    .where(and(eq(invoices.businessId, id), eq(invoices.contentHash, contentHash)))
    .limit(1);
  return row ?? null;
}
