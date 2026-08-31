import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  businesses,
  costCategories,
  customerInvoiceLines,
  customerInvoices,
  customers,
  jobs,
} from "@/db/schema";
import { jobCategoryTotals, requireBusinessId } from "./queries";

export async function listBills(businessId: string) {
  const id = requireBusinessId(businessId);
  return db
    .select({
      id: customerInvoices.id,
      number: customerInvoices.number,
      status: customerInvoices.status,
      totalCents: customerInvoices.totalCents,
      customerName: customers.name,
      jobName: jobs.name,
      jobTag: jobs.jobTag,
      createdAt: customerInvoices.createdAt,
    })
    .from(customerInvoices)
    .innerJoin(customers, eq(customers.id, customerInvoices.customerId))
    .leftJoin(jobs, eq(jobs.id, customerInvoices.jobId))
    .where(eq(customerInvoices.businessId, id))
    .orderBy(desc(customerInvoices.createdAt));
}

export async function getBill(businessId: string, billId: string) {
  const id = requireBusinessId(businessId);
  const [bill] = await db
    .select({
      id: customerInvoices.id,
      number: customerInvoices.number,
      status: customerInvoices.status,
      subtotalCents: customerInvoices.subtotalCents,
      markupCents: customerInvoices.markupCents,
      totalCents: customerInvoices.totalCents,
      customerId: customerInvoices.customerId,
      customerName: customers.name,
      jobId: customerInvoices.jobId,
      jobName: jobs.name,
      jobTag: jobs.jobTag,
      issuedAt: customerInvoices.issuedAt,
      paidAt: customerInvoices.paidAt,
    })
    .from(customerInvoices)
    .innerJoin(customers, eq(customers.id, customerInvoices.customerId))
    .leftJoin(jobs, eq(jobs.id, customerInvoices.jobId))
    .where(
      and(eq(customerInvoices.businessId, id), eq(customerInvoices.id, billId)),
    )
    .limit(1);
  if (!bill) return null;
  const lines = await db
    .select()
    .from(customerInvoiceLines)
    .where(
      and(
        eq(customerInvoiceLines.businessId, id),
        eq(customerInvoiceLines.customerInvoiceId, bill.id),
      ),
    );
  return { ...bill, lines };
}

export async function nextBillNumber(businessId: string) {
  const id = requireBusinessId(businessId);
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customerInvoices)
    .where(eq(customerInvoices.businessId, id));
  const n = Number(row?.count ?? 0) + 1;
  return `CINV-${String(n).padStart(4, "0")}`;
}

export async function createBillFromJob(opts: {
  businessId: string;
  jobId: string;
}) {
  const businessId = requireBusinessId(opts.businessId);
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, opts.jobId), eq(jobs.businessId, businessId)))
    .limit(1);
  if (!job) return null;

  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);
  const categories = await jobCategoryTotals(businessId, job.id);
  const lines = categories.filter((row) => row.totalCents > 0);
  const subtotal = lines.reduce((sum, row) => sum + row.totalCents, 0);
  const markupBps = business?.markupBps ?? 0;
  const markup = Math.round((subtotal * markupBps) / 10000);
  const number = await nextBillNumber(businessId);

  const [bill] = await db
    .insert(customerInvoices)
    .values({
      businessId,
      customerId: job.customerId,
      jobId: job.id,
      number,
      status: "draft",
      subtotalCents: subtotal,
      markupCents: markup,
      totalCents: subtotal + markup,
    })
    .returning();

  if (lines.length) {
    await db.insert(customerInvoiceLines).values(
      lines.map((line) => ({
        businessId,
        customerInvoiceId: bill.id,
        description: `${line.name} on ${job.jobTag}`,
        amountCents: line.amountCents ?? line.totalCents,
      })),
    );
  }

  if (markup > 0) {
    await db.insert(customerInvoiceLines).values({
      businessId,
      customerInvoiceId: bill.id,
      description: `Markup ${markupBps / 100}%`,
      amountCents: markup,
    });
  }

  if (!lines.length) {
    await db.insert(customerInvoiceLines).values({
      businessId,
      customerInvoiceId: bill.id,
      description: `${job.name} (${job.jobTag})`,
      amountCents: 0,
    });
  }

  return bill.id;
}
