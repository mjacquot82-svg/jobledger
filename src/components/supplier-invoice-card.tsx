import React from "react";
import Link from "next/link";
import { formatCad } from "@/lib/money";

type Invoice = {
  id: string;
  status: string;
  originalFilename: string;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  totalCents: number | null;
  supplierName: string | null;
  postedAmountCents: number | null;
  costCategoryId: string | null;
  costCategoryName: string | null;
};

type Option = { id: string; name: string; jobTag?: string | null };

function invoiceDate(value: string | null) {
  if (!value) return "Not found";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function SupplierInvoiceCard({
  invoice,
  currentJobId,
  jobs,
  categories,
  editAction,
}: {
  invoice: Invoice;
  currentJobId: string;
  jobs: Option[];
  categories: Option[];
  editAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <li className="p-4 sm:p-5" data-testid="supplier-invoice-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold">
            {invoice.supplierName ?? "Unknown supplier"}
          </p>
          <p className="mt-1 break-all text-sm text-stone-500">
            {invoice.originalFilename}
          </p>
        </div>
        <span className="w-fit rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium uppercase text-stone-700">
          {invoice.status.replaceAll("_", " ")}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm lg:grid-cols-5">
        <div>
          <dt className="text-stone-500">Invoice #</dt>
          <dd className="mt-0.5 font-medium">{invoice.invoiceNumber ?? "Not found"}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Invoice date</dt>
          <dd className="mt-0.5 font-medium">{invoiceDate(invoice.invoiceDate)}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Extracted total</dt>
          <dd className="mt-0.5 font-medium">
            {invoice.totalCents == null ? "Not found" : formatCad(invoice.totalCents)}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Posted to job</dt>
          <dd className="mt-0.5 font-medium">
            {invoice.postedAmountCents == null
              ? "Not posted"
              : formatCad(invoice.postedAmountCents)}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Cost category</dt>
          <dd className="mt-0.5 font-medium">
            {invoice.costCategoryName ?? "Not posted"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex" data-testid="invoice-actions">
        <a
          className="min-h-11 rounded-lg bg-amber-800 px-3 py-2.5 text-center text-sm font-medium text-white"
          href={`/api/invoices/${invoice.id}/file`}
          rel="noreferrer"
          target="_blank"
        >
          View invoice
        </a>
        <a
          className="min-h-11 rounded-lg border border-stone-300 px-3 py-2.5 text-center text-sm font-medium"
          href={`/api/invoices/${invoice.id}/file?download=1`}
        >
          Download
        </a>
        <Link
          className="col-span-2 min-h-11 rounded-lg border border-stone-300 px-3 py-2.5 text-center text-sm font-medium sm:ml-auto"
          href={`/invoices/${invoice.id}`}
        >
          Invoice details
        </Link>
      </div>

      <details className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
        <summary className="cursor-pointer text-sm font-medium text-amber-800">
          Edit assignment
        </summary>
        <form action={editAction} className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            Job
            <select
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5"
              defaultValue={currentJobId}
              name="jobId"
              required
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.jobTag ? `${job.jobTag} · ` : ""}{job.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Cost category
            <select
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5"
              defaultValue={invoice.costCategoryId ?? ""}
              name="categoryId"
              required
            >
              <option disabled value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Posted amount (CAD)
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5"
              defaultValue={((invoice.postedAmountCents ?? invoice.totalCents ?? 0) / 100).toFixed(2)}
              inputMode="decimal"
              min="0"
              name="amount"
              required
              step="0.01"
              type="number"
            />
          </label>
          <button
            className="min-h-11 rounded-lg bg-amber-800 px-4 py-2.5 text-sm font-medium text-white sm:col-span-3"
            type="submit"
          >
            Save assignment
          </button>
        </form>
      </details>
    </li>
  );
}
