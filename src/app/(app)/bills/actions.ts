"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createBillFromJob, setBillStatus } from "@/lib/billing";
import { addManualCost } from "@/lib/job-costs";
import { requireSession } from "@/lib/session";

export async function addManualCostAction(jobId: string, formData: FormData) {
  const session = await requireSession();
  await addManualCost({
    businessId: session.user.businessId,
    jobId,
    categoryId: String(formData.get("categoryId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
  redirect(`/jobs/${jobId}`);
}

export async function createBillFromJobAction(jobId: string) {
  const session = await requireSession();
  const billId = await createBillFromJob({
    businessId: session.user.businessId,
    jobId,
  });
  if (!billId) redirect(`/jobs/${jobId}`);
  revalidatePath("/bills");
  redirect(`/bills/${billId}`);
}

export async function setBillStatusAction(billId: string, formData: FormData) {
  const session = await requireSession();
  const status = String(formData.get("status") ?? "draft") as
    | "draft"
    | "issued"
    | "paid";
  await setBillStatus({
    businessId: session.user.businessId,
    billId,
    status,
  });
  revalidatePath("/bills");
  revalidatePath(`/bills/${billId}`);
  redirect(`/bills/${billId}`);
}
