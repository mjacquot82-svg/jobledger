import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getInvoiceFile: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/lib/queries", () => ({ getInvoiceFile: mocks.getInvoiceFile }));
vi.mock("node:fs/promises", () => ({ readFile: mocks.readFile }));

import { GET } from "./route";

describe("tenant-protected invoice files", () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
    mocks.getInvoiceFile.mockReset();
    mocks.readFile.mockReset();
  });

  it("rejects file access without an authenticated tenant", async () => {
    mocks.getSession.mockResolvedValue(null);
    const response = await GET(
      new NextRequest("https://staging.example/api/invoices/invoice-1/file"),
      { params: Promise.resolve({ id: "invoice-1" }) },
    );
    expect(response.status).toBe(401);
    expect(mocks.getInvoiceFile).not.toHaveBeenCalled();
  });

  it("scopes lookup to the session tenant and supports secure download", async () => {
    mocks.getSession.mockResolvedValue({
      user: { businessId: "business-a" },
    });
    mocks.getInvoiceFile.mockResolvedValue({
      storedPath: "/private/tenant/invoice.pdf",
      originalFilename: "supplier-invoice.pdf",
    });
    mocks.readFile.mockResolvedValue(Buffer.from("pdf"));
    const response = await GET(
      new NextRequest(
        "https://staging.example/api/invoices/invoice-1/file?download=1",
      ),
      { params: Promise.resolve({ id: "invoice-1" }) },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="supplier-invoice.pdf"',
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.getInvoiceFile).toHaveBeenCalledWith(
      "business-a",
      "invoice-1",
    );
    expect(response.headers.get("x-file-path")).toBeNull();
  });
});
