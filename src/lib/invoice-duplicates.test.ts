import { describe, expect, it } from "vitest";
import { pickInvoiceNumberDuplicate } from "./invoice-number-dedupe";

const homeDepot = {
  id: "inv-hd",
  status: "matched",
  supplierId: "sup-hd",
  supplierNameGuess: "Home Depot",
};

const lowes = {
  id: "inv-lw",
  status: "needs_review",
  supplierId: "sup-lw",
  supplierNameGuess: "Lowe's",
};

const unknown = {
  id: "inv-unk",
  status: "unmatched",
  supplierId: null,
  supplierNameGuess: null,
};

describe("pickInvoiceNumberDuplicate", () => {
  it("scopes to supplierId when provided (no cross-supplier false positive)", () => {
    expect(
      pickInvoiceNumberDuplicate([homeDepot, lowes], {
        supplierId: "sup-hd",
        supplierNameGuess: "Home Depot",
      }),
    ).toEqual(homeDepot);

    expect(
      pickInvoiceNumberDuplicate([homeDepot, lowes], {
        supplierId: "sup-other",
      }),
    ).toBeNull();
  });

  it("falls back to supplierNameGuess when supplierId is unknown", () => {
    expect(
      pickInvoiceNumberDuplicate([homeDepot, lowes], {
        supplierNameGuess: "lowe's",
      }),
    ).toEqual(lowes);

    expect(
      pickInvoiceNumberDuplicate([homeDepot], {
        supplierNameGuess: "Rona",
      }),
    ).toBeNull();
  });

  it("without supplier context treats any existing number as a duplicate", () => {
    expect(pickInvoiceNumberDuplicate([unknown], {})).toEqual(unknown);
    expect(pickInvoiceNumberDuplicate([homeDepot, lowes], {})).toEqual(
      homeDepot,
    );
  });

  it("returns null when there are no candidates", () => {
    expect(
      pickInvoiceNumberDuplicate([], { supplierId: "sup-hd" }),
    ).toBeNull();
  });
});
