import { and, eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { db } from "@/db";
import { costCategories, invoices, jobCosts, jobs, suppliers } from "@/db/schema";
import { extractInvoiceFields, matchInvoiceJobs } from "./match";
import {
  findInvoiceByNumber,
  findInvoiceByProviderMessage,
} from "./invoice-duplicates";
import { runOcr } from "./ocr";
import { findInvoiceByHash } from "./queries";
import { hashBuffer, storeInvoiceFile } from "./storage";
import { isAssignmentTenantSafe, planInvoiceCostSync } from "./invoice-cost-sync";
import {
  allocationsAreTenantSafe,
  type InvoiceAllocationInput,
  validateInvoiceAllocations,
} from "./invoice-allocations";

export type IngestEmailMeta = {
  provider: string;
  providerMessageId?: string;
  subject?: string;
  from?: string;
  text?: string;
};

async function findOrCreateSupplier(businessId: string, name: string | null) {
  if (!name) return null;
  const trimmed = name.slice(0, 120);
  const [existing] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.businessId, businessId), eq(suppliers.name, trimmed)))
    .limit(1);
  if (existing) return existing.id;
  const [created] = await db
    .insert(suppliers)
    .values({ businessId, name: trimmed })
    .returning();
  return created.id;
}

async function syncInvoiceCost(opts: {
  businessId: string;
  jobId: string;
  invoiceId: string;
  amountCents: number;
  categoryId?: string;
}) {
  const [already] = await db
    .select()
    .from(jobCosts)
    .where(
      and(
        eq(jobCosts.businessId, opts.businessId),
        eq(jobCosts.invoiceId, opts.invoiceId),
      ),
    )
    .limit(1);
  let defaultCategoryId: string | undefined;
  if (!already && !opts.categoryId) {
    const [materials] = await db
      .select()
      .from(costCategories)
      .where(
        and(
          eq(costCategories.businessId, opts.businessId),
          eq(costCategories.name, "Materials"),
        ),
      )
      .limit(1);
    defaultCategoryId = materials?.id;
  }
  const plan = planInvoiceCostSync(already ?? null, opts, defaultCategoryId);
  if (!plan) return null;
  if (plan.kind === "update") {
    await db
      .update(jobCosts)
      .set(plan.values)
      .where(
        and(
          eq(jobCosts.id, already.id),
          eq(jobCosts.businessId, opts.businessId),
        ),
      );
    return plan.id;
  }
  const [created] = await db
    .insert(jobCosts)
    .values(plan.values)
    .onConflictDoUpdate({
      target: [jobCosts.businessId, jobCosts.invoiceId, jobCosts.jobId],
      set: {
        jobId: plan.values.jobId,
        amountCents: plan.values.amountCents,
      },
    })
    .returning({ id: jobCosts.id });
  return created.id;
}

function haystack(opts: {
  filename: string;
  extractedText: string;
  email?: IngestEmailMeta;
}) {
  return [
    opts.email?.subject,
    opts.email?.text,
    opts.filename,
    opts.extractedText,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function ingestInvoiceAttachment(opts: {
  businessId: string;
  filename: string;
  buffer: Buffer;
  source: "upload" | "email";
  email?: IngestEmailMeta;
}) {
  const contentHash = hashBuffer(opts.buffer);
  const duplicate = await findInvoiceByHash(opts.businessId, contentHash);
  if (duplicate) {
    return { id: duplicate.id, duplicate: true as const };
  }

  if (opts.email?.provider && opts.email.providerMessageId) {
    const messageDup = await findInvoiceByProviderMessage({
      businessId: opts.businessId,
      provider: opts.email.provider,
      providerMessageId: opts.email.providerMessageId,
    });
    if (messageDup) {
      return { id: messageDup.id, duplicate: true as const };
    }
  }

  const extractedText = await runOcr("local_pdf", opts.buffer);
  const searchText = haystack({
    filename: opts.filename,
    extractedText,
    email: opts.email,
  });
  // Supplier invoice fields should come from the document when possible.
  // Forwarded email prose may contain unrelated phrases such as "invoice test".
  const fields = extractInvoiceFields(extractedText || searchText);

  if (fields.invoiceNumber) {
    const numberDup = await findInvoiceByNumber(
      opts.businessId,
      fields.invoiceNumber,
      fields.supplierNameGuess,
    );
    if (numberDup) {
      return { id: numberDup.id, duplicate: true as const };
    }
  }

  const invoiceId = crypto.randomUUID();
  const storedPath = await storeInvoiceFile(
    opts.businessId,
    invoiceId,
    opts.buffer,
    opts.filename,
  );

  const jobRows = await db
    .select({ id: jobs.id, jobTag: jobs.jobTag })
    .from(jobs)
    .where(eq(jobs.businessId, opts.businessId));
  const match = matchInvoiceJobs(
    {
      pdfText: extractedText,
      emailBody: opts.email?.text,
      emailSubject: opts.email?.subject,
      filename: opts.filename,
    },
    jobRows,
  );
  const supplierId = await findOrCreateSupplier(
    opts.businessId,
    fields.supplierNameGuess,
  );

  let status: typeof invoices.$inferInsert.status = "unmatched";
  let jobId: string | null = null;
  let matchReason = match.reason;

  if (!extractedText && match.status === "unmatched") {
    status = "failed";
    matchReason =
      "Could not read PDF text and no job tag was in the file name or email. Paid OCR is not enabled.";
  } else if (match.status === "matched") {
    status = "matched";
    jobId = match.jobId;
  } else if (match.status === "needs_review") {
    status = "needs_review";
  } else {
    status = "needs_review";
  }

  await db.insert(invoices).values({
    id: invoiceId,
    businessId: opts.businessId,
    supplierId,
    jobId,
    status,
    source: opts.source,
    provider: opts.email?.provider ?? (opts.source === "upload" ? "upload" : null),
    providerMessageId: opts.email?.providerMessageId ?? null,
    emailSubject: opts.email?.subject ?? null,
    emailFrom: opts.email?.from ?? null,
    emailText: opts.email?.text ?? null,
    invoiceNumber: fields.invoiceNumber,
    invoiceDate: fields.invoiceDate,
    detectedJobTags:
      match.status === "matched"
        ? [match.jobTag]
        : match.status === "needs_review"
          ? match.tags
          : [],
    totalCents: fields.totalCents,
    originalFilename: opts.filename,
    storedPath,
    contentHash,
    extractedText: extractedText || null,
    matchReason,
    supplierNameGuess: fields.supplierNameGuess,
  });

  if (status === "matched" && jobId && fields.totalCents) {
    await syncInvoiceCost({
      businessId: opts.businessId,
      jobId,
      invoiceId,
      amountCents: fields.totalCents,
    });
  }

  return { id: invoiceId, duplicate: false as const };
}

export async function ingestUploadedInvoice(opts: {
  businessId: string;
  filename: string;
  buffer: Buffer;
}) {
  return ingestInvoiceAttachment({
    ...opts,
    source: "upload",
  });
}

export async function reprocessStoredInvoice(opts: {
  businessId: string;
  invoiceId: string;
}) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.id, opts.invoiceId),
        eq(invoices.businessId, opts.businessId),
      ),
    )
    .limit(1);
  if (!invoice) return null;

  const buffer = await readFile(invoice.storedPath);
  const extractedText = await runOcr("local_pdf", buffer);
  if (!extractedText) return { ok: false as const, reason: "no PDF text" };

  const fields = extractInvoiceFields(extractedText);
  const jobRows = await db
    .select({ id: jobs.id, jobTag: jobs.jobTag })
    .from(jobs)
    .where(eq(jobs.businessId, opts.businessId));
  const match = matchInvoiceJobs(
    {
      pdfText: extractedText,
      emailBody: invoice.emailText,
      emailSubject: invoice.emailSubject,
      filename: invoice.originalFilename,
    },
    jobRows,
  );
  const supplierId = await findOrCreateSupplier(
    opts.businessId,
    fields.supplierNameGuess,
  );

  const detectedJobTags =
    match.status === "matched"
      ? [match.jobTag]
      : match.status === "needs_review"
        ? match.tags
        : [];
  const approved = Boolean(invoice.allocationsApprovedAt);
  const status = approved
    ? invoice.status
    : match.status === "matched"
      ? "matched"
      : "needs_review";
  const jobId = approved
    ? invoice.jobId
    : match.status === "matched"
      ? match.jobId
      : null;
  await db
    .update(invoices)
    .set({
      supplierId,
      jobId,
      status,
      invoiceNumber: fields.invoiceNumber,
      invoiceDate: fields.invoiceDate,
      detectedJobTags,
      totalCents: fields.totalCents,
      extractedText,
      matchReason: approved
        ? invoice.matchReason
        : match.reason,
      supplierNameGuess: fields.supplierNameGuess,
    })
    .where(
      and(
        eq(invoices.id, invoice.id),
        eq(invoices.businessId, opts.businessId),
      ),
    );

  if (!approved && jobId && fields.totalCents) {
    await syncInvoiceCost({
      businessId: opts.businessId,
      jobId,
      invoiceId: invoice.id,
      amountCents: fields.totalCents,
    });
  } else if (!approved && !jobId) {
    await db
      .delete(jobCosts)
      .where(
        and(
          eq(jobCosts.businessId, opts.businessId),
          eq(jobCosts.invoiceId, invoice.id),
        ),
      );
  }
  return { ok: true as const, totalCents: fields.totalCents, status, jobId };
}

export async function assignInvoiceToJob(opts: {
  businessId: string;
  invoiceId: string;
  jobId: string;
}) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.id, opts.invoiceId),
        eq(invoices.businessId, opts.businessId),
      ),
    )
    .limit(1);
  if (!invoice) return null;

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, opts.jobId), eq(jobs.businessId, opts.businessId)))
    .limit(1);
  if (!job) return null;

  await db
    .update(invoices)
    .set({
      jobId: job.id,
      status: "matched",
      matchReason: `Assigned by you to ${job.jobTag ?? job.name}`,
    })
    .where(
      and(
        eq(invoices.id, invoice.id),
        eq(invoices.businessId, opts.businessId),
      ),
    );

  if (invoice.totalCents) {
    await syncInvoiceCost({
      businessId: opts.businessId,
      jobId: job.id,
      invoiceId: invoice.id,
      amountCents: invoice.totalCents,
    });
  }

  return invoice.id;
}

export async function editInvoiceAssignment(opts: {
  businessId: string;
  invoiceId: string;
  jobId: string;
  categoryId: string;
  amountCents: number;
}) {
  const result = await approveInvoiceAllocations({
    businessId: opts.businessId,
    invoiceId: opts.invoiceId,
    allocations: [
      {
        jobId: opts.jobId,
        categoryId: opts.categoryId,
        amountCents: opts.amountCents,
      },
    ],
  });
  if (!result?.ok) return null;
  return { oldJobId: result.oldJobIds[0] ?? null, jobId: opts.jobId };
}

export async function approveInvoiceAllocations(opts: {
  businessId: string;
  invoiceId: string;
  allocations: InvoiceAllocationInput[];
}) {
  const [invoiceRows, jobRows, categoryRows] = await Promise.all([
    db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, opts.invoiceId),
          eq(invoices.businessId, opts.businessId),
        ),
      )
      .limit(1),
    db.select().from(jobs).where(eq(jobs.businessId, opts.businessId)),
    db
      .select()
      .from(costCategories)
      .where(eq(costCategories.businessId, opts.businessId)),
  ]);
  const invoice = invoiceRows[0];
  if (!invoice || !isAssignmentTenantSafe(opts.businessId, [invoice])) return null;
  const validation = validateInvoiceAllocations(invoice.totalCents, opts.allocations);
  if (!validation.ok) return validation;
  if (
    !allocationsAreTenantSafe(
      opts.businessId,
      validation.allocations,
      jobRows,
      categoryRows,
    )
  ) {
    return { ok: false as const, error: "Invalid job or category" };
  }

  const existingCosts = await db
    .select({ jobId: jobCosts.jobId })
    .from(jobCosts)
    .where(
      and(
        eq(jobCosts.businessId, opts.businessId),
        eq(jobCosts.invoiceId, invoice.id),
      ),
    );
  await db.transaction(async (tx) => {
    await tx
      .delete(jobCosts)
      .where(
        and(
          eq(jobCosts.businessId, opts.businessId),
          eq(jobCosts.invoiceId, invoice.id),
        ),
      );
    await tx.insert(jobCosts).values(
      validation.allocations.map((allocation) => ({
        businessId: opts.businessId,
        invoiceId: invoice.id,
        jobId: allocation.jobId,
        categoryId: allocation.categoryId,
        amountCents: allocation.amountCents,
        sourceType: "invoice" as const,
      })),
    );
    const one = validation.allocations.length === 1 ? validation.allocations[0] : null;
    await tx
      .update(invoices)
      .set({
        jobId: one?.jobId ?? null,
        status: "matched",
        allocationsApprovedAt: new Date(),
        matchReason: one
          ? "Manual allocation approved for one job"
          : `Split approved across ${validation.allocations.length} jobs`,
      })
      .where(
        and(
          eq(invoices.id, invoice.id),
          eq(invoices.businessId, opts.businessId),
        ),
      );
  });
  return {
    ok: true as const,
    oldJobIds: [...new Set([invoice.jobId, ...existingCosts.map((row) => row.jobId)].filter(Boolean))] as string[],
    jobIds: validation.allocations.map((row) => row.jobId),
  };
}
