import { describe, expect, it } from "vitest";
import { jobMarginDisplay } from "./job-margin-display";

describe("jobMarginDisplay", () => {
  it("shows Not billed yet when costs exist but billed is zero", () => {
    expect(
      jobMarginDisplay({
        billedCents: 0,
        costCents: 5000,
        marginCents: -5000,
      }),
    ).toEqual({ text: "Not billed yet", kind: "not_billed" });
  });

  it("formats margin when something has been billed", () => {
    const result = jobMarginDisplay({
      billedCents: 10000,
      costCents: 4000,
      marginCents: 6000,
    });
    expect(result.kind).toBe("margin");
    expect(result.text).toContain("60.00");
  });

  it("formats zero margin when both billed and costs are zero", () => {
    const result = jobMarginDisplay({
      billedCents: 0,
      costCents: 0,
      marginCents: 0,
    });
    expect(result.kind).toBe("margin");
    expect(result.text).toMatch(/\$0\.00/);
  });

  it("still shows a negative margin when billed is positive but below costs", () => {
    const result = jobMarginDisplay({
      billedCents: 1000,
      costCents: 5000,
      marginCents: -4000,
    });
    expect(result.kind).toBe("margin");
    expect(result.text).toMatch(/-/);
  });
});
