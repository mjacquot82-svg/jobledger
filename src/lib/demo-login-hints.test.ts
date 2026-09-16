import { describe, expect, it } from "vitest";
import { getLoginDemoHints } from "./demo-login-hints";

describe("getLoginDemoHints", () => {
  it("hides credentials in production with default env", () => {
    const hints = getLoginDemoHints({ nodeEnv: "production" });
    expect(hints.email).toBe("");
    expect(hints.password).toBe("");
    expect(hints.showHint).toBe(false);
    expect(hints.hintText).toBeNull();
  });

  it("shows and prefills demo credentials in development", () => {
    const hints = getLoginDemoHints({ nodeEnv: "development" });
    expect(hints.email).toBe("demo@jobledger.local");
    expect(hints.password).toBe("DemoPass123!");
    expect(hints.showHint).toBe(true);
    expect(hints.hintText).toContain("demo@jobledger.local");
  });

  it("allows an explicit production override", () => {
    const hints = getLoginDemoHints({
      nodeEnv: "production",
      allowDemoLoginHint: "true",
    });
    expect(hints.showHint).toBe(true);
    expect(hints.password).toBe("DemoPass123!");
  });
});
