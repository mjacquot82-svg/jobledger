import { describe, expect, it } from "vitest";
import { invoiceBelongsToJob } from "./invoice-cost-sync";

describe("job invoice visibility", () => {
  it("shows invoices only on their assigned job", () => {
    const invoices = [
      { id: "one", businessId: "business-a", jobId: "job-a" },
      { id: "two", businessId: "business-a", jobId: "job-b" },
      { id: "three", businessId: "business-b", jobId: "job-a" },
    ];
    expect(
      invoices
        .filter((invoice) =>
          invoiceBelongsToJob(invoice, "business-a", "job-a"),
        )
        .map((invoice) => invoice.id),
    ).toEqual(["one"]);
  });
});
