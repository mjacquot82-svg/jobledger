import { describe, expect, it } from "vitest";
import {
  allocationsAreTenantSafe,
  validateInvoiceAllocations,
} from "./invoice-allocations";

const split = [
  { jobId: "job-a", categoryId: "materials", amountCents: 4000 },
  { jobId: "job-b", categoryId: "materials", amountCents: 6000 },
];

describe("invoice allocations", () => {
  it("approves a multi-job split only when it equals the invoice total", () => {
    expect(validateInvoiceAllocations(10000, split)).toMatchObject({
      ok: true,
      allocatedCents: 10000,
    });
    expect(validateInvoiceAllocations(10001, split)).toMatchObject({
      ok: false,
      differenceCents: 1,
    });
  });

  it("supports a single manual assignment with the same exact-total rule", () => {
    expect(validateInvoiceAllocations(1234, [
      { jobId: "job-a", categoryId: "materials", amountCents: 1234 },
    ])).toMatchObject({ ok: true });
  });

  it("rejects duplicate job allocations", () => {
    expect(validateInvoiceAllocations(8000, [split[0], split[0]])).toMatchObject({
      ok: false,
      error: "Each job can be allocated only once",
    });
  });

  it("rejects allocations involving another tenant", () => {
    expect(
      allocationsAreTenantSafe("business-a", split, [
        { id: "job-a", businessId: "business-a" },
        { id: "job-b", businessId: "business-b" },
      ], [
        { id: "materials", businessId: "business-a" },
      ]),
    ).toBe(false);
  });
});
