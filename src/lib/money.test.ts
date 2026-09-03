import { describe, expect, it } from "vitest";
import { dollarsToCents, formatCad } from "../lib/money";

describe("money", () => {
  it("stores dollars as integer cents", () => {
    expect(dollarsToCents("12.34")).toBe(1234);
    expect(dollarsToCents(0.1)).toBe(10);
  });

  it("formats CAD for Canadian English", () => {
    expect(formatCad(0)).toMatch(/\$0\.00/);
    expect(formatCad(1234)).toContain("12.34");
  });
});
