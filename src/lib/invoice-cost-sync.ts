export type ExistingInvoiceCost = {
  id: string;
  categoryId: string;
};

export type DesiredInvoiceCost = {
  businessId: string;
  invoiceId: string;
  jobId: string;
  categoryId?: string;
  amountCents: number;
};

export function planInvoiceCostSync(
  existing: ExistingInvoiceCost | null,
  desired: DesiredInvoiceCost,
  defaultCategoryId?: string,
) {
  if (existing) {
    return {
      kind: "update" as const,
      id: existing.id,
      values: {
        jobId: desired.jobId,
        categoryId: desired.categoryId ?? existing.categoryId,
        amountCents: desired.amountCents,
      },
    };
  }
  const categoryId = desired.categoryId ?? defaultCategoryId;
  if (!categoryId) return null;
  return {
    kind: "insert" as const,
    values: {
      ...desired,
      categoryId,
      sourceType: "invoice" as const,
    },
  };
}

export function isAssignmentTenantSafe(
  businessId: string,
  records: Array<{ businessId: string } | null | undefined>,
) {
  return records.every((record) => record?.businessId === businessId);
}

export function invoiceBelongsToJob(
  invoice: {
    businessId: string;
    jobId: string | null;
    allocatedJobId?: string | null;
  },
  businessId: string,
  jobId: string,
) {
  return (
    invoice.businessId === businessId &&
    (invoice.jobId === jobId || invoice.allocatedJobId === jobId)
  );
}
