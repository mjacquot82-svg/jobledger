import { describe, expect, it } from "vitest";
import { isAssignmentTenantSafe, planInvoiceCostSync } from "./invoice-cost-sync";

describe("invoice assignment cost synchronization", () => {
  const desired = {
    businessId: "business-a",
    invoiceId: "invoice-1",
    jobId: "job-new",
    categoryId: "category-labour",
    amountCents: 4567,
  };

  it("reassignment updates the one existing cost with the new job, category and amount", () => {
    expect(
      planInvoiceCostSync(
        { id: "cost-1", categoryId: "category-materials" },
        desired,
      ),
    ).toEqual({
      kind: "update",
      id: "cost-1",
      values: {
        jobId: "job-new",
        categoryId: "category-labour",
        amountCents: 4567,
      },
    });
  });

  it("reprocessing updates rather than inserts and preserves an edited category", () => {
    const plan = planInvoiceCostSync(
      { id: "cost-1", categoryId: "category-edited" },
      { ...desired, categoryId: undefined, amountCents: 5000 },
      "category-materials",
    );
    expect(plan).toMatchObject({
      kind: "update",
      id: "cost-1",
      values: { categoryId: "category-edited", amountCents: 5000 },
    });
  });

  it("rejects cross-tenant assignment records", () => {
    expect(
      isAssignmentTenantSafe("business-a", [
        { businessId: "business-a" },
        { businessId: "business-b" },
        { businessId: "business-a" },
      ]),
    ).toBe(false);
  });
});
