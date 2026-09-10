import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("package.json start script", () => {
  it("does not run drizzle push or seed on boot", () => {
    const pkg = JSON.parse(
      readFileSync(resolve(__dirname, "../../package.json"), "utf8"),
    ) as { scripts: { start: string } };
    const start = pkg.scripts.start;
    expect(start).toBeTruthy();
    expect(start).not.toMatch(/drizzle-kit/);
    expect(start).not.toMatch(/\bpush\b/);
    expect(start).not.toMatch(/--force/);
    expect(start).not.toMatch(/\bseed\b/);
  });
});
