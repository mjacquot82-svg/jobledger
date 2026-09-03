"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  assignInvoiceToJob,
  approveInvoiceAllocations,
  editInvoiceAssignment,
  ingestUploadedInvoice,
} from "@/lib/ingest";
import { dollarsToCents } from "@/lib/money";
import { requireSession } from "@/lib/session";

export async function uploadInvoiceAction(formData: FormData) {
  const session = await requireSession();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a PDF to upload");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await ingestUploadedInvoice({
    businessId: session.user.businessId,
    filename: file.name,
    buffer,
  });

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect(
    result.duplicate
      ? `/invoices/${result.id}?duplicate=1`
      : `/invoices/${result.id}`,
  );
}

export async function approveInvoiceAllocationsAction(
  invoiceId: string,
  formData: FormData,
) {
  const session = await requireSession();
  const jobIds = formData.getAll("allocationJobId").map(String);
  const allocations = jobIds
    .map((jobId) => ({
      jobId,
      categoryId: String(formData.get(`category:${jobId}`) ?? ""),
      amountCents: dollarsToCents(
        String(formData.get(`amount:${jobId}`) ?? ""),
      ),
    }))
    .filter((row) => row.amountCents > 0);
  const result = await approveInvoiceAllocations({
    businessId: session.user.businessId,
    invoiceId,
    allocations,
  });
  if (!result) redirect(`/invoices/${invoiceId}?allocationError=not-found`);
  if (!result.ok) {
    const code = result.error.includes("equal") ? "total" : "invalid";
    redirect(`/invoices/${invoiceId}?allocationError=${code}#allocations`);
  }
  for (const jobId of [...result.oldJobIds, ...result.jobIds]) {
    revalidatePath(`/jobs/${jobId}`);
  }
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/dashboard");
  redirect(`/invoices/${invoiceId}?allocationSaved=1#allocations`);
}

export async function editInvoiceAssignmentAction(
  invoiceId: string,
  previousJobId: string,
  formData: FormData,
) {
  const session = await requireSession();
  const result = await editInvoiceAssignment({
    businessId: session.user.businessId,
    invoiceId,
    jobId: String(formData.get("jobId") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    amountCents: dollarsToCents(String(formData.get("amount") ?? "")),
  });
  if (!result) throw new Error("Could not update this invoice assignment");
  revalidatePath(`/jobs/${previousJobId}`);
  revalidatePath(`/jobs/${result.jobId}`);
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/dashboard");
  redirect(`/jobs/${result.jobId}`);
}

export async function assignInvoiceAction(invoiceId: string, formData: FormData) {
  const session = await requireSession();
  const jobId = String(formData.get("jobId") ?? "");
  await assignInvoiceToJob({
    businessId: session.user.businessId,
    invoiceId,
    jobId,
  });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/dashboard");
  revalidatePath("/jobs");
  redirect(`/invoices/${invoiceId}`);
}
