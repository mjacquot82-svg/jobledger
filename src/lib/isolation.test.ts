import { describe, expect, it } from "vitest";
import { requireBusinessId } from "./tenant";

describe("tenant isolation", () => {
  it("refuses queries without a business id", () => {
    expect(() => requireBusinessId(undefined)).toThrow(/business_id/);
    expect(() => requireBusinessId("")).toThrow(/business_id/);
    expect(requireBusinessId("biz_1")).toBe("biz_1");
  });
});
