import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "./middleware";

describe("authentication middleware", () => {
  it("sends a clean dashboard session to login", () => {
    const response = middleware(
      new NextRequest("https://staging.example/dashboard"),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://staging.example/login",
    );
  });

  it("allows login even when a stale session cookie exists", () => {
    const response = middleware(
      new NextRequest("https://staging.example/login", {
        headers: { cookie: "better-auth.session_token=stale" },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
