"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assignInvoiceToJob, ingestUploadedInvoice } from "@/lib/ingest";
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
