import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { costCategories, invoices, jobCosts, jobs, suppliers } from "@/db/schema";
import { extractInvoiceFields, matchJobs } from "./match";
import {
  findInvoiceByNumber,
  findInvoiceByProviderMessage,
} from "./invoice-duplicates";
import { runOcr } from "./ocr";
import { findInvoiceByHash } from "./queries";
import { hashBuffer, storeInvoiceFile } from "./storage";

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

async function postInvoiceCost(opts: {
  businessId: string;
  jobId: string;
  invoiceId: string;
  amountCents: number;
}) {
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
  if (!materials) return;

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
  if (already) return;

  await db.insert(jobCosts).values({
    businessId: opts.businessId,
    jobId: opts.jobId,
    categoryId: materials.id,
    invoiceId: opts.invoiceId,
    amountCents: opts.amountCents,
    sourceType: "invoice",
  });
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
  const fields = extractInvoiceFields(searchText);

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
  const match = matchJobs(searchText, jobRows);
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
    status = "unmatched";
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
    invoiceNumber: fields.invoiceNumber,
    totalCents: fields.totalCents,
    originalFilename: opts.filename,
    storedPath,
    contentHash,
    extractedText: extractedText || null,
    matchReason,
    supplierNameGuess: fields.supplierNameGuess,
  });

  if (status === "matched" && jobId && fields.totalCents) {
    await postInvoiceCost({
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
    await postInvoiceCost({
      businessId: opts.businessId,
      jobId: job.id,
      invoiceId: invoice.id,
      amountCents: invoice.totalCents,
    });
  }

  return invoice.id;
}
