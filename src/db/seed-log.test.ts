import { describe, expect, it } from "vitest";
import { demoSeedLogMessage } from "./seed-log";

describe("demoSeedLogMessage", () => {
  it("does not contain the demo password or email", () => {
    const message = demoSeedLogMessage();
    expect(message).toBe("Seeded demo user");
    expect(message.toLowerCase()).not.toContain("demopass");
    expect(message).not.toContain("DemoPass123!");
    expect(message).not.toContain("demo@jobledger.local");
    expect(message).not.toContain("/");
  });
});
