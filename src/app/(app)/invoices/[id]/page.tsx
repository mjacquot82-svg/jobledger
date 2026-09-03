import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCad } from "@/lib/money";
import {
  getInvoice,
  listCostCategories,
  listInvoiceAllocations,
  listJobs,
} from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { approveInvoiceAllocationsAction } from "../actions";

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    duplicate?: string;
    allocationError?: string;
    allocationSaved?: string;
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await requireSession();
  const invoice = await getInvoice(session.user.businessId, id);
  if (!invoice) notFound();
  const [jobs, categories, allocations] = await Promise.all([
    listJobs(session.user.businessId),
    listCostCategories(session.user.businessId),
    listInvoiceAllocations(session.user.businessId, invoice.id),
  ]);
  const approve = approveInvoiceAllocationsAction.bind(null, invoice.id);
  const needsHuman =
    invoice.status === "needs_review" ||
    invoice.status === "unmatched" ||
    invoice.status === "failed";

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm uppercase text-stone-500">
          {invoice.status.replaceAll("_", " ")}
        </p>
        <h1 className="text-2xl font-semibold">
          {invoice.supplierName ?? invoice.originalFilename}
        </h1>
        <p className="mt-1 text-sm text-stone-600">{invoice.originalFilename}</p>
        <a
          className="mt-2 inline-block text-sm font-medium text-amber-800"
          href={`/api/invoices/${invoice.id}/file`}
          target="_blank"
        >
          Open original PDF
        </a>
      </div>
      {query.duplicate === "1" ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          This file was already uploaded. Opening the original instead of creating
          a second invoice.
        </p>
      ) : null}
      <section className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
        <dl className="space-y-2">
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Invoice #</dt>
            <dd>{invoice.invoiceNumber ?? "Not found"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Total</dt>
            <dd>
              {invoice.totalCents != null
                ? formatCad(invoice.totalCents)
                : "Not found"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Job</dt>
            <dd>
              {invoice.jobId ? (
                <Link className="text-amber-800" href={`/jobs/${invoice.jobId}`}>
                  {invoice.jobName} ({invoice.jobTag})
                </Link>
              ) : allocations.length > 1 ? (
                `Split across ${allocations.length} jobs`
              ) : (
                "Unassigned"
              )}
            </dd>
          </div>
        </dl>
        {invoice.matchReason ? (
          <p className="mt-4 text-stone-600">{invoice.matchReason}</p>
        ) : null}
        <div className="mt-4 border-t border-stone-200 pt-4">
          <p className="font-medium">Detected job codes</p>
          {invoice.detectedJobTags.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {invoice.detectedJobTags.map((tag) => (
                <span
                  className="rounded-full bg-amber-100 px-2.5 py-1 font-mono text-xs text-amber-900"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-stone-500">No valid job code detected.</p>
          )}
        </div>
      </section>
      <section
        className="rounded-xl border border-stone-200 bg-white p-4"
        id="allocations"
      >
        <h2 className="font-medium">
          {allocations.length ? "Edit assignment" : "Review and allocate"}
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Enter an amount beside one job for a manual assignment, or split the
          invoice among several jobs. Allocations must equal the extracted total
          of {invoice.totalCents == null ? "an available invoice total" : formatCad(invoice.totalCents)}.
        </p>
        {needsHuman && invoice.detectedJobTags.length > 1 ? (
          <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Multiple job codes were found. No cost is posted until you approve
            the complete split.
          </p>
        ) : null}
        {query.allocationError ? (
          <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {query.allocationError === "total"
              ? "The allocations must add up exactly to the invoice total."
              : "Check every allocation, job, and cost category."}
          </p>
        ) : null}
        {query.allocationSaved === "1" ? (
          <p className="mt-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
            Allocations approved. Job costs were updated without duplicates.
          </p>
        ) : null}
        {allocations.length ? (
          <ul className="mt-3 divide-y divide-stone-200 rounded-lg border border-stone-200 text-sm">
            {allocations.map((allocation) => (
              <li className="flex justify-between gap-3 p-3" key={allocation.id}>
                <span>
                  {allocation.jobTag ? `${allocation.jobTag} · ` : ""}
                  {allocation.jobName} · {allocation.categoryName}
                </span>
                <span className="tabular-nums">{formatCad(allocation.amountCents)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <form action={approve} className="mt-4 space-y-3">
          {jobs.map((job) => {
            const current = allocations.find((row) => row.jobId === job.id);
            const suggested = invoice.detectedJobTags.includes(job.jobTag ?? "");
            const defaultCategory =
              current?.categoryId ??
              categories.find((category) => category.name === "Materials")?.id ??
              "";
            return (
              <fieldset
                className={`grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_10rem_9rem] sm:items-end ${
                  suggested ? "border-amber-300 bg-amber-50" : "border-stone-200"
                }`}
                key={job.id}
              >
                <input name="allocationJobId" type="hidden" value={job.id} />
                <div className="text-sm">
                  <p className="font-medium">
                    {job.jobTag ? `${job.jobTag} · ` : ""}{job.name}
                  </p>
                  {suggested ? <p className="text-xs text-amber-800">Detected in invoice</p> : null}
                </div>
                <label className="text-sm">
                  Category
                  <select
                    className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2 py-2.5"
                    defaultValue={defaultCategory}
                    name={`category:${job.id}`}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Amount (CAD)
                  <input
                    className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-2.5"
                    defaultValue={current ? (current.amountCents / 100).toFixed(2) : ""}
                    inputMode="decimal"
                    min="0"
                    name={`amount:${job.id}`}
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                  />
                </label>
              </fieldset>
            );
          })}
          <button
            className="min-h-11 w-full rounded-lg bg-amber-800 px-4 py-3 font-medium text-white disabled:opacity-50"
            disabled={invoice.totalCents == null}
            type="submit"
          >
            Approve allocations
          </button>
        </form>
      </section>
      {invoice.extractedText ? (
        <section className="rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="font-medium">Extracted text</h2>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-stone-600">
            {invoice.extractedText}
          </pre>
        </section>
      ) : null}
    </main>
  );
}
