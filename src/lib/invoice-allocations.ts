export type InvoiceAllocationInput = {
  jobId: string;
  categoryId: string;
  amountCents: number;
};

export function validateInvoiceAllocations(
  invoiceTotalCents: number | null,
  allocations: InvoiceAllocationInput[],
) {
  if (invoiceTotalCents == null || invoiceTotalCents < 0) {
    return { ok: false as const, error: "Invoice total is required before allocation" };
  }
  const positive = allocations.filter((row) => row.amountCents > 0);
  if (!positive.length) {
    return { ok: false as const, error: "Enter at least one allocation" };
  }
  if (
    positive.some(
      (row) =>
        !row.jobId ||
        !row.categoryId ||
        !Number.isInteger(row.amountCents),
    )
  ) {
    return { ok: false as const, error: "Every allocation must be valid" };
  }
  if (new Set(positive.map((row) => row.jobId)).size !== positive.length) {
    return { ok: false as const, error: "Each job can be allocated only once" };
  }
  const allocatedCents = positive.reduce((sum, row) => sum + row.amountCents, 0);
  if (allocatedCents !== invoiceTotalCents) {
    return {
      ok: false as const,
      error: "Allocations must equal the invoice total",
      allocatedCents,
      differenceCents: invoiceTotalCents - allocatedCents,
    };
  }
  return { ok: true as const, allocations: positive, allocatedCents };
}

export function allocationsAreTenantSafe(
  businessId: string,
  allocations: InvoiceAllocationInput[],
  jobs: Array<{ id: string; businessId: string }>,
  categories: Array<{ id: string; businessId: string }>,
) {
  return allocations.every((allocation) => {
    const job = jobs.find((row) => row.id === allocation.jobId);
    const category = categories.find((row) => row.id === allocation.categoryId);
    return job?.businessId === businessId && category?.businessId === businessId;
  });
}
